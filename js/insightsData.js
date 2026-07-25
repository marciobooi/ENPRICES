/*
 * Insights calculation engine for the ENPRICES "Insights" view.
 * Reads the app's existing REF selection + codes.js tables, fetches whatever
 * extra Eurostat data is needed (full country panel, full history, component
 * breakdown) and returns a structured result for insightsView.js to render.
 *
 * Formula references (Nx.y) match the numbered sections of insights.md.
 */
var insightsDataNameSpace = (function () {

  const CACHE_PREFIX = "enprices_insights_cache::";
  const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h: Eurostat updates twice a year, no need to refetch often
  const AGGREGATE_GEOS = ["EU27_2020", "EA"];
  const STABILITY_EPSILON_PERCENT = 0.5; // 11.6 materiality threshold for "broadly stable"
  const NEAR_EXTREME_PERCENT = 5; // 7.13 "near historical high/low" threshold
  const DOMINANCE_THRESHOLD_PERCENT = 50; // 6.22 dominant-component threshold
  const RANK_SENSITIVITY_THRESHOLD_PERCENT = 2; // "rank sensitivity" — gap to neighbours below this % is "sensitive"
  const PERSISTENT_QUARTILE_WINDOW = 8; // 7.7 — last 8 semesters (~4 years)
  const PERSISTENT_QUARTILE_SHARE_THRESHOLD = 0.75; // 7.7 — must be in that quartile 75%+ of valid periods
  const VOLATILITY_WINDOW = 10; // 6.32 — last 10 semesters (~5 years)
  const DISPERSION_THRESHOLD_PERCENT = 5; // 7.6 — convergence/divergence threshold on IQR change
  const IMPLAUSIBLE_CHANGE_PERCENT = 200; // data-anomaly guard against tiny-denominator blowups

  const DATASET_CONDITIONS = {
    "4100_HOUSEHOLD_1": "nrg_pc_202_c", "4100_HOUSEHOLD_0": "nrg_pc_202",
    "4100_N_HOUSEHOLD_1": "nrg_pc_203_c", "4100_N_HOUSEHOLD_0": "nrg_pc_203",
    "6000_HOUSEHOLD_1": "nrg_pc_204_c", "6000_HOUSEHOLD_0": "nrg_pc_204",
    "6000_N_HOUSEHOLD_1": "nrg_pc_205_c", "6000_N_HOUSEHOLD_0": "nrg_pc_205"
  };

  // ---------------------------------------------------------------------
  // Cache (localStorage, not cookies: cookies cap out around 4KB and are
  // sent on every HTTP request, which is wasteful for these JSON payloads)
  // ---------------------------------------------------------------------

  function readCache(key) {
    try {
      const raw = window.localStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (!entry || (Date.now() - entry.t) > CACHE_TTL_MS) return null;
      return entry.d;
    } catch (e) {
      return null;
    }
  }

  function writeCache(key, data) {
    try {
      window.localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ t: Date.now(), d: data }));
    } catch (e) {
      // Storage full/unavailable (private browsing, quota): degrade to no cache.
    }
  }

  async function fetchDataset(url) {
    const cached = readCache(url);
    if (cached) {
      return JSONstat(cached).Dataset(0);
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Insights request failed: " + response.status);
    }
    const raw = await response.json();
    writeCache(url, raw);
    return JSONstat(raw).Dataset(0);
  }

  // ---------------------------------------------------------------------
  // Context: derive dataset ids + selection from the current REF
  // ---------------------------------------------------------------------

  function resolveDataset(product, consumer, isComponent) {
    return DATASET_CONDITIONS[`${product}_${consumer}_${isComponent ? 1 : 0}`];
  }

  function getFocusGeo() {
    if (REF.chartGeo) return REF.chartGeo;
    if (Array.isArray(REF.geos) && REF.geos.length) {
      const individual = REF.geos.find((g) => AGGREGATE_GEOS.indexOf(g) === -1);
      return individual || REF.geos[0];
    }
    return "EU27_2020";
  }

  function buildContext() {
    const dataset = resolveDataset(REF.product, REF.consumer, false);
    const componentDataset = resolveDataset(REF.product, REF.consumer, true);
    const unitParam = REF.unit === "MWH" ? "KWH" : REF.unit;
    return {
      geo: getFocusGeo(),
      product: REF.product,
      consumer: REF.consumer,
      band: REF.consoms,
      unit: REF.unit,
      unitParam,
      // Cross-country ranking/benchmarking is only valid in a common expression (quality
      // rule: never mix EUR/NAT/PPS). NAT is meaningless across countries, so the main
      // panel always uses EUR regardless of what the user picked on the main chart; PPS
      // is offered separately as its own dedicated comparison (see rankShift).
      currency: "EUR",
      time: REF.time,
      dataset,
      componentDataset,
      nrgPrc: (codesDataset[componentDataset] && codesDataset[componentDataset].nrg_prc) || []
    };
  }

  // ---------------------------------------------------------------------
  // URL builders
  // ---------------------------------------------------------------------

  function baseUrl(dataset) {
    return "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/" + dataset +
      "?format=JSON&lang=" + (REF.language || "EN");
  }

  function buildPanelUrl(ctx, currency) {
    return baseUrl(ctx.dataset) +
      "&tax=I_TAX&tax=X_TAX" +
      "&unit=" + ctx.unitParam +
      "&nrg_cons=" + ctx.band +
      "&currency=" + currency;
  }

  function buildComponentUrl(ctx, times) {
    // Component ("_c") datasets have no UNIT dimension at all (always published in their
    // native unit, normally kWh) — the plain price datasets do. Mirrors chartApiCall()'s
    // own `!REF.component ? "&unit=..." : ""` branch in js/basics.js.
    let url = baseUrl(ctx.componentDataset) +
      ctx.nrgPrc.map((p) => "&nrg_prc=" + p).join("") +
      "&nrg_cons=" + ctx.band +
      "&currency=" + ctx.currency +
      "&geo=" + ctx.geo;
    times.filter(Boolean).forEach((t) => { url += "&time=" + t; });
    return url;
  }

  // Component values for more than one geo at once (used to compare the focus country's
  // composition with the official EU aggregate's own composition — 7.8/7.9).
  function buildComponentUrlMultiGeo(ctx, geos, times) {
    let url = baseUrl(ctx.componentDataset) +
      ctx.nrgPrc.map((p) => "&nrg_prc=" + p).join("") +
      "&nrg_cons=" + ctx.band +
      "&currency=" + ctx.currency;
    geos.forEach((g) => { url += "&geo=" + g; });
    times.filter(Boolean).forEach((t) => { url += "&time=" + t; });
    return url;
  }

  // All consumption bands for the focus geo, across all available periods, final price
  // only (I_TAX) — feeds both the band-pattern/premium cards and the band-spread-over-time
  // card from a single fetch.
  function buildBandUrl(ctx) {
    const bands = (codesDataset[ctx.dataset] && codesDataset[ctx.dataset].consoms) || [ctx.band];
    let url = baseUrl(ctx.dataset) +
      "&tax=I_TAX" +
      "&unit=" + ctx.unitParam +
      "&currency=" + ctx.currency +
      "&geo=" + ctx.geo;
    bands.forEach((b) => { url += "&nrg_cons=" + b; });
    return url;
  }

  // Eurostat's HICP annual rate-of-change dataset (all-items, monthly). Used as "related
  // context" only (8.2) — an association, never presented as a cause of the energy-price
  // movement. Aligned to the last month of the relevant semester (June for S1, December
  // for S2) since HICP has no semester concept of its own.
  function buildHicpUrl(geo, yearMonth) {
    return "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_manr" +
      "?format=JSON&lang=" + (REF.language || "EN") +
      "&coicop=CP00&unit=RCH_A&geo=" + geo + "&time=" + yearMonth;
  }

  function semesterToHicpMonth(periodCode) {
    const p = parsePeriod(periodCode);
    if (!p) return null;
    return p.year + "-" + (p.semester === 1 ? "06" : "12");
  }

  // ---------------------------------------------------------------------
  // Period helpers (Eurostat bi-annual codes: "YYYY-S1" / "YYYY-S2")
  // ---------------------------------------------------------------------

  function parsePeriod(code) {
    if (!code) return null;
    const m = /^(\d{4})-S([12])$/.exec(code);
    if (!m) return null;
    return { year: parseInt(m[1], 10), semester: parseInt(m[2], 10) };
  }

  function semesterCode(year, semester) {
    return year + "-S" + semester;
  }

  function previousSemester(code) {
    const p = parsePeriod(code);
    if (!p) return null;
    return p.semester === 2 ? semesterCode(p.year, 1) : semesterCode(p.year - 1, 2);
  }

  function yoyPeriod(code) {
    const p = parsePeriod(code);
    if (!p) return null;
    return semesterCode(p.year - 1, p.semester);
  }

  // Component ("_c") datasets are published annually (time codes are plain "YYYY",
  // no semester suffix) even though the price datasets they break down are bi-annual.
  function periodToYear(code) {
    const p = parsePeriod(code);
    if (p) return String(p.year);
    const m = /^(\d{4})$/.exec(code || "");
    return m ? m[1] : null;
  }

  // ---------------------------------------------------------------------
  // Generic numeric helpers (section 5)
  // ---------------------------------------------------------------------

  function isValid(v) {
    return v !== null && v !== undefined && !isNaN(v);
  }

  function percentChange(a, b) {
    if (!isValid(a) || !isValid(b) || a === 0) return null;
    return ((b - a) / Math.abs(a)) * 100;
  }

  function absoluteChange(a, b) {
    if (!isValid(a) || !isValid(b)) return null;
    return b - a;
  }

  function median(values) {
    const v = values.filter(isValid).slice().sort((a, b) => a - b);
    if (!v.length) return null;
    const mid = Math.floor(v.length / 2);
    return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
  }

  function quartile(sortedValues, q) {
    const pos = (sortedValues.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sortedValues[base + 1] !== undefined) {
      return sortedValues[base] + rest * (sortedValues[base + 1] - sortedValues[base]);
    }
    return sortedValues[base];
  }

  function classifyDirection(pct) {
    if (!isValid(pct)) return "unavailable";
    if (pct > STABILITY_EPSILON_PERCENT) return "rising";
    if (pct < -STABILITY_EPSILON_PERCENT) return "falling";
    return "stable";
  }

  // ---------------------------------------------------------------------
  // Point / series readers on top of the JSONstat dataset object
  // ---------------------------------------------------------------------

  function readPoint(d, geo, time) {
    const res = d.Data({ geo, time, tax: "I_TAX" });
    return res ? res.value : null;
  }

  function readPointForTax(d, geo, time, tax) {
    const res = d.Data({ geo, time, tax });
    return res ? res.value : null;
  }

  // Eurostat observation status flag (e.g. "p" provisional, "e" estimated) for the
  // freshness/data-quality disclosure.
  function readStatus(d, geo, time) {
    const res = d.Data({ geo, time, tax: "I_TAX" });
    return res ? res.status : null;
  }

  function readCrossCountry(d, time) {
    const geos = d.Dimension("geo").id;
    const arr = d.Data({ time, tax: "I_TAX" });
    return geos.map((g, i) => ({ geo: g, value: arr[i] ? arr[i].value : null }));
  }

  function readHistory(d, geo) {
    const times = d.Dimension("time").id;
    const arr = d.Data({ geo, tax: "I_TAX" });
    return times.map((t, i) => ({ period: t, value: arr[i] ? arr[i].value : null }))
      .filter((row) => isValid(row.value));
  }

  function readPreTaxHistory(d, geo) {
    const times = d.Dimension("time").id;
    const arr = d.Data({ geo, tax: "X_TAX" });
    return times.map((t, i) => ({ period: t, value: arr[i] ? arr[i].value : null }));
  }

  function readBandRowsAtPeriod(d, period) {
    const bands = d.Dimension("nrg_cons").id;
    const arr = d.Data({ time: period });
    return bands.map((b, i) => ({ band: b, value: arr[i] && isValid(arr[i].value) ? arr[i].value : null }));
  }

  function readBandHistory(d, band) {
    const times = d.Dimension("time").id;
    const arr = d.Data({ nrg_cons: band });
    return times.map((t, i) => ({ period: t, value: arr[i] && isValid(arr[i].value) ? arr[i].value : null }))
      .filter((r) => isValid(r.value));
  }

  function periodExists(d, code) {
    if (!code) return false;
    const ids = d.Dimension("time").id;
    return !!ids && ids.indexOf(code) !== -1;
  }

  // ---------------------------------------------------------------------
  // 6.8 / 6.9 / 6.10 / 6.11 / 6.12 — cross-country comparison
  // ---------------------------------------------------------------------

  function computeCrossCountry(panel, focusGeo) {
    const countryRows = panel.filter((r) => AGGREGATE_GEOS.indexOf(r.geo) === -1 && isValid(r.value));
    const values = countryRows.map((r) => r.value).sort((a, b) => a - b);
    const n = values.length;
    const focusValue = (panel.find((r) => r.geo === focusGeo) || {}).value;
    const euValue = (panel.find((r) => r.geo === "EU27_2020") || {}).value;
    const eaValue = (panel.find((r) => r.geo === "EA") || {}).value;

    const med = median(values);
    let rankHigh = null, rankLow = null, percentile = null, outlier = "unknown";
    if (isValid(focusValue) && n > 0) {
      rankHigh = 1 + values.filter((v) => v > focusValue).length;
      rankLow = 1 + values.filter((v) => v < focusValue).length;
      const below = values.filter((v) => v < focusValue).length;
      const equal = values.filter((v) => v === focusValue).length;
      percentile = (100 * (below + 0.5 * equal)) / n;

      if (n >= 8) {
        const q1 = quartile(values, 0.25);
        const q3 = quartile(values, 0.75);
        const iqr = q3 - q1;
        const lowerFence = q1 - 1.5 * iqr;
        const upperFence = q3 + 1.5 * iqr;
        outlier = focusValue < lowerFence ? "low" : focusValue > upperFence ? "high" : "within";
      }
    }

    return {
      n,
      focusValue: isValid(focusValue) ? focusValue : null,
      euValue: isValid(euValue) ? euValue : null,
      eaValue: isValid(eaValue) ? eaValue : null,
      euGapAbs: absoluteChange(euValue, focusValue),
      euGapPct: percentChange(euValue, focusValue),
      eaGapAbs: absoluteChange(eaValue, focusValue),
      eaGapPct: percentChange(eaValue, focusValue),
      median: med,
      medianGapPct: percentChange(med, focusValue),
      min: values.length ? values[0] : null,
      max: values.length ? values[values.length - 1] : null,
      rankHigh,
      rankLow,
      percentile,
      outlier
    };
  }

  // ---------------------------------------------------------------------
  // 6.13 / 6.14 / 6.15 / 6.16 — historical position
  // ---------------------------------------------------------------------

  function computeHistoricalPosition(history, latestPeriod) {
    if (!history.length) return null;
    const ordered = history.slice();
    const values = ordered.map((r) => r.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const peakRow = ordered.slice().reverse().find((r) => r.value === max);
    const med = median(values);
    const latestRow = ordered.find((r) => r.period === latestPeriod) || ordered[ordered.length - 1];
    const latestValue = latestRow ? latestRow.value : null;

    const below = values.filter((v) => v < latestValue).length;
    const equal = values.filter((v) => v === latestValue).length;
    const historicalPercentile = values.length ? (100 * (below + 0.5 * equal)) / values.length : null;

    const latestIndex = ordered.indexOf(latestRow);
    const peakIndex = ordered.indexOf(peakRow);
    const periodsSincePeak = latestIndex >= 0 && peakIndex >= 0 ? latestIndex - peakIndex : null;

    return {
      latestPeriod: latestRow ? latestRow.period : latestPeriod,
      latestValue,
      max,
      min,
      peakPeriod: peakRow ? peakRow.period : null,
      percentBelowMax: percentChange(max, latestValue),
      percentAboveMin: percentChange(min, latestValue),
      median: med,
      relativeToMedianPct: percentChange(med, latestValue),
      historicalPercentile,
      periodsSincePeak,
      observationCount: values.length,
      isNewHigh: latestValue === max,
      isNewLow: latestValue === min,
      nearHigh: isValid(latestValue) && max !== 0 && Math.abs(percentChange(max, latestValue)) <= NEAR_EXTREME_PERCENT,
      nearLow: isValid(latestValue) && min !== 0 && Math.abs(percentChange(min, latestValue)) <= NEAR_EXTREME_PERCENT
    };
  }

  // ---------------------------------------------------------------------
  // 6.19 / 6.22 — composition + driver of change
  // ---------------------------------------------------------------------

  function computeComposition(componentDataset, ctx, latestPeriod, yoyPeriodCode) {
    const geo = ctx.geo;
    const hasLatest = periodExists(componentDataset, latestPeriod);
    const hasPrior = periodExists(componentDataset, yoyPeriodCode);
    // The "_c" dataset has no UNIT dimension and is always published per kWh; scale it to
    // match ctx.unit so composition figures line up with the rest of the panel (which is
    // already in ctx.unit), same 1000x convention the app uses elsewhere for kWh->MWh.
    const scale = ctx.unit === "MWH" ? 1000 : 1;
    const components = ctx.nrgPrc.map((code) => {
      const latest = hasLatest ? componentDataset.Data({ geo, time: latestPeriod, nrg_prc: code }) : null;
      const prior = hasPrior ? componentDataset.Data({ geo, time: yoyPeriodCode, nrg_prc: code }) : null;
      return {
        code,
        latest: latest && isValid(latest.value) ? latest.value * scale : null,
        prior: prior && isValid(prior.value) ? prior.value * scale : null
      };
    });

    const validComponents = components.filter((c) => isValid(c.latest));
    const componentSum = validComponents.reduce((sum, c) => sum + c.latest, 0);

    const withShares = components.map((c) => ({
      ...c,
      share: isValid(c.latest) && componentSum ? (c.latest / componentSum) * 100 : null,
      deltaYoy: absoluteChange(c.prior, c.latest)
    }));

    const deltas = withShares.filter((c) => isValid(c.deltaYoy));
    const deltaTotal = deltas.reduce((sum, c) => sum + c.deltaYoy, 0);
    const dominanceBase = deltas.reduce((sum, c) => sum + Math.abs(c.deltaYoy), 0);

    let mainUpward = null, mainDownward = null, dominant = null;
    deltas.forEach((c) => {
      if (c.deltaYoy > 0 && (!mainUpward || c.deltaYoy > mainUpward.deltaYoy)) mainUpward = c;
      if (c.deltaYoy < 0 && (!mainDownward || c.deltaYoy < mainDownward.deltaYoy)) mainDownward = c;
    });
    if (dominanceBase > 0) {
      const top = deltas.slice().sort((a, b) => Math.abs(b.deltaYoy) - Math.abs(a.deltaYoy))[0];
      if (top && (Math.abs(top.deltaYoy) / dominanceBase) * 100 >= DOMINANCE_THRESHOLD_PERCENT) {
        dominant = top;
      }
    }

    return {
      components: withShares.sort((a, b) => (b.latest || 0) - (a.latest || 0)),
      componentSum,
      mainUpward,
      mainDownward,
      dominant,
      deltaTotal: deltas.length ? deltaTotal : null,
      hasData: validComponents.length > 0
    };
  }

  // ---------------------------------------------------------------------
  // 6.23 — fiscal cushioning / amplification
  // ---------------------------------------------------------------------

  // Argument order is (latest, prior) for each pair, matching absoluteChange(prior, latest).
  function computeFiscalEffect(preTaxLatest, preTaxPrior, finalLatest, finalPrior) {
    const deltaPreTax = absoluteChange(preTaxPrior, preTaxLatest);
    const deltaFinal = absoluteChange(finalPrior, finalLatest);
    if (!isValid(deltaPreTax) || !isValid(deltaFinal)) {
      return { deltaPreTax: null, deltaFinal: null, classification: "unavailable" };
    }

    let classification = "neutral";
    if (deltaPreTax > 0 && deltaFinal > 0 && deltaFinal < deltaPreTax) classification = "cushioned";
    else if (deltaPreTax > 0 && deltaFinal > deltaPreTax) classification = "amplified";
    else if (deltaPreTax < 0 && deltaFinal < 0 && Math.abs(deltaFinal) < Math.abs(deltaPreTax)) classification = "offsetDecrease";
    else if (deltaPreTax < 0 && deltaFinal > 0) classification = "oppositeUp";
    else if (deltaPreTax > 0 && deltaFinal < 0) classification = "oppositeDown";

    return {
      deltaPreTax,
      deltaFinal,
      fiscalEffect: deltaFinal - deltaPreTax,
      classification
    };
  }

  // ---------------------------------------------------------------------
  // 6.29 — EUR vs PPS rank shift
  // ---------------------------------------------------------------------

  function computeRankShift(eurPanel, ppsPanel, focusGeo) {
    const eurByGeo = {};
    eurPanel.forEach((r) => { if (AGGREGATE_GEOS.indexOf(r.geo) === -1 && isValid(r.value)) eurByGeo[r.geo] = r.value; });
    const ppsByGeo = {};
    ppsPanel.forEach((r) => { if (AGGREGATE_GEOS.indexOf(r.geo) === -1 && isValid(r.value)) ppsByGeo[r.geo] = r.value; });

    const commonGeos = Object.keys(eurByGeo).filter((g) => ppsByGeo.hasOwnProperty(g));
    if (!commonGeos.includes(focusGeo)) {
      return { available: false, cohortSize: commonGeos.length };
    }

    const eurValues = commonGeos.map((g) => eurByGeo[g]);
    const ppsValues = commonGeos.map((g) => ppsByGeo[g]);
    const rankEur = 1 + eurValues.filter((v) => v > eurByGeo[focusGeo]).length;
    const rankPps = 1 + ppsValues.filter((v) => v > ppsByGeo[focusGeo]).length;
    const shift = rankEur - rankPps;

    return {
      available: true,
      cohortSize: commonGeos.length,
      rankEur,
      rankPps,
      shift,
      classification: shift >= 5 ? "higherInPps" : shift <= -5 ? "lowerInPps" : "similar"
    };
  }

  // ---------------------------------------------------------------------
  // 6.5 — short-term momentum (needs a YoY% series, derived from history)
  // ---------------------------------------------------------------------

  function buildYoySeries(history) {
    const byPeriod = {};
    history.forEach((r) => { byPeriod[r.period] = r.value; });
    return history
      .map((r) => ({ period: r.period, yoyPct: percentChange(byPeriod[yoyPeriod(r.period)], r.value) }))
      .filter((r) => isValid(r.yoyPct));
  }

  function computeMomentum(history) {
    const yoySeries = buildYoySeries(history);
    if (yoySeries.length < 2) return null;
    const latest = yoySeries[yoySeries.length - 1];
    const prev = yoySeries[yoySeries.length - 2];
    const momentumChange = latest.yoyPct - prev.yoyPct;

    let classification;
    if (latest.yoyPct > STABILITY_EPSILON_PERCENT && momentumChange > STABILITY_EPSILON_PERCENT) classification = "risingAccelerating";
    else if (latest.yoyPct > STABILITY_EPSILON_PERCENT && momentumChange < -STABILITY_EPSILON_PERCENT) classification = "risingSlowing";
    else if (latest.yoyPct < -STABILITY_EPSILON_PERCENT && momentumChange < -STABILITY_EPSILON_PERCENT) classification = "fallingAccelerating";
    else if (latest.yoyPct < -STABILITY_EPSILON_PERCENT && momentumChange > STABILITY_EPSILON_PERCENT) classification = "fallingSlowing";
    else if (Math.sign(latest.yoyPct) !== 0 && Math.sign(latest.yoyPct) !== Math.sign(prev.yoyPct) && Math.abs(latest.yoyPct) > STABILITY_EPSILON_PERCENT) classification = "reversal";
    else classification = "stableYoy";

    return { latestYoyPct: latest.yoyPct, previousYoyPct: prev.yoyPct, momentumChange, classification };
  }

  // ---------------------------------------------------------------------
  // 6.7 — compound annual growth rate
  // ---------------------------------------------------------------------

  function computeCagr(history, years) {
    if (!history.length) return null;
    const latest = history[history.length - 1];
    const p = parsePeriod(latest.period);
    if (!p || !isValid(latest.value) || latest.value <= 0) return null;
    const baseCode = semesterCode(p.year - years, p.semester);
    const baseRow = history.find((r) => r.period === baseCode);
    if (!baseRow || !isValid(baseRow.value) || baseRow.value <= 0) return null;
    const cagr = (Math.pow(latest.value / baseRow.value, 1 / years) - 1) * 100;
    return { years, baseValue: baseRow.value, basePeriod: baseRow.period, latestValue: latest.value, latestPeriod: latest.period, cagr };
  }

  // ---------------------------------------------------------------------
  // 6.17 / 6.18 — consecutive movement + trend reversal
  // ---------------------------------------------------------------------

  function computeConsecutiveMovement(history) {
    if (history.length < 2) return null;
    const directions = [];
    for (let i = history.length - 1; i > 0; i--) {
      const diff = history[i].value - history[i - 1].value;
      directions.push(diff > 0 ? 1 : (diff < 0 ? -1 : 0));
    }
    const first = directions[0];
    if (first === 0) return { count: 0, direction: "stable" };
    let count = 1;
    for (let j = 1; j < directions.length; j++) {
      if (directions[j] === first) count++;
      else break;
    }
    return { count, direction: first > 0 ? "increase" : "decrease" };
  }

  function computeTrendReversal(history) {
    if (history.length < 4) return { reversal: false };
    const diffs = [];
    for (let i = 1; i < history.length; i++) diffs.push(history[i].value - history[i - 1].value);
    const last = diffs[diffs.length - 1];
    const prev1 = diffs[diffs.length - 2];
    const prev2 = diffs[diffs.length - 3];
    const priorDirection = prev1 > 0 && prev2 > 0 ? 1 : (prev1 < 0 && prev2 < 0 ? -1 : 0);
    const latestDirection = last > 0 ? 1 : (last < 0 ? -1 : 0);
    return {
      reversal: priorDirection !== 0 && latestDirection !== 0 && priorDirection !== latestDirection,
      priorDirection,
      latestDirection
    };
  }

  // ---------------------------------------------------------------------
  // 6.32 — historical volatility (sample st. dev. of period returns)
  // ---------------------------------------------------------------------

  function computeVolatility(history, windowSize) {
    const win = history.slice(-windowSize);
    if (win.length < 4) return null;
    const returns = [];
    for (let i = 1; i < win.length; i++) {
      const r = percentChange(win[i - 1].value, win[i].value);
      if (isValid(r)) returns.push(r);
    }
    if (returns.length < 3) return null;
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
    return { volatility: Math.sqrt(variance), n: returns.length, windowPeriods: win.length };
  }

  // ---------------------------------------------------------------------
  // "12. Seasonal pattern" — typical S1->S2 premium and latest deviation from it
  // ---------------------------------------------------------------------

  function computeSeasonalPattern(history) {
    const byYear = {};
    history.forEach((r) => {
      const p = parsePeriod(r.period);
      if (!p) return;
      byYear[p.year] = byYear[p.year] || {};
      byYear[p.year]["s" + p.semester] = r.value;
    });

    const diffs = [];
    Object.keys(byYear).forEach((y) => {
      const yr = byYear[y];
      const d = percentChange(yr.s1, yr.s2);
      if (isValid(d)) diffs.push(d);
    });
    if (diffs.length < 2) return null;

    const typicalS2Premium = median(diffs);
    const years = Object.keys(byYear).map(Number).sort((a, b) => a - b);
    const latestYear = years[years.length - 1];
    const latestDiff = latestYear !== undefined ? percentChange(byYear[latestYear].s1, byYear[latestYear].s2) : null;

    return {
      typicalS2Premium,
      sampleYears: diffs.length,
      latestDiff: isValid(latestDiff) ? latestDiff : null,
      deviation: isValid(latestDiff) ? latestDiff - typicalS2Premium : null
    };
  }

  // ---------------------------------------------------------------------
  // "7. Rank sensitivity" — is the exact rank fragile because neighbours are close?
  // ---------------------------------------------------------------------

  function computeRankSensitivity(panel, focusGeo) {
    const rows = panel
      .filter((r) => AGGREGATE_GEOS.indexOf(r.geo) === -1 && isValid(r.value))
      .sort((a, b) => b.value - a.value); // descending: rank 1 = highest price
    const idx = rows.findIndex((r) => r.geo === focusGeo);
    if (idx === -1) return null;

    const above = idx > 0 ? rows[idx - 1] : null;
    const below = idx < rows.length - 1 ? rows[idx + 1] : null;
    const focusValue = rows[idx].value;
    const gapAbove = above ? above.value - focusValue : null;
    const gapBelow = below ? focusValue - below.value : null;
    const gapAbovePct = above && focusValue ? (gapAbove / Math.abs(focusValue)) * 100 : null;
    const gapBelowPct = below && focusValue ? (gapBelow / Math.abs(focusValue)) * 100 : null;

    return {
      aboveGeo: above ? above.geo : null,
      belowGeo: below ? below.geo : null,
      gapAbove, gapBelow, gapAbovePct, gapBelowPct,
      sensitive: (gapAbovePct !== null && gapAbovePct < RANK_SENSITIVITY_THRESHOLD_PERCENT) ||
        (gapBelowPct !== null && gapBelowPct < RANK_SENSITIVITY_THRESHOLD_PERCENT)
    };
  }

  // ---------------------------------------------------------------------
  // "14. Data anomaly safeguards"
  // ---------------------------------------------------------------------

  function detectAnomalies(price) {
    const flags = [];
    if (isValid(price.latestValue) && price.latestValue < 0) flags.push("negativePrice");
    if (isValid(price.latestValue) && price.latestValue === 0) flags.push("zeroPrice");
    if (isValid(price.yoyChangePct) && Math.abs(price.yoyChangePct) >= IMPLAUSIBLE_CHANGE_PERCENT) flags.push("implausibleChange");
    return flags;
  }

  // ---------------------------------------------------------------------
  // 7.1 / 7.2 / 7.5 / 7.6 — Europe-at-a-glance snapshot (reuses the already-fetched
  // full geo x time panel, no extra network call)
  // ---------------------------------------------------------------------

  function buildCountryYoyRows(panelDataset, latestPeriod, yoyBeforePeriod) {
    const geos = panelDataset.Dimension("geo").id;
    const latestArr = panelDataset.Data({ time: latestPeriod, tax: "I_TAX" });
    const hasYoy = periodExists(panelDataset, yoyBeforePeriod);
    const yoyArr = hasYoy ? panelDataset.Data({ time: yoyBeforePeriod, tax: "I_TAX" }) : null;

    return geos.map((g, i) => {
      const latestVal = latestArr[i] && isValid(latestArr[i].value) ? latestArr[i].value : null;
      const yoyVal = yoyArr && yoyArr[i] && isValid(yoyArr[i].value) ? yoyArr[i].value : null;
      return { geo: g, latest: latestVal, yoy: yoyVal, yoyPct: percentChange(yoyVal, latestVal) };
    });
  }

  function computeEuropeSnapshot(rows) {
    const countryRows = rows.filter((r) => AGGREGATE_GEOS.indexOf(r.geo) === -1);
    const validRows = countryRows.filter((r) => isValid(r.latest));
    const values = validRows.map((r) => r.latest).sort((a, b) => a - b);

    let rising = 0, falling = 0, stable = 0, unavailable = 0;
    countryRows.forEach((r) => {
      const dir = classifyDirection(r.yoyPct);
      if (dir === "rising") rising++;
      else if (dir === "falling") falling++;
      else if (dir === "stable") stable++;
      else unavailable++;
    });

    const euRow = rows.find((r) => r.geo === "EU27_2020");
    const eaRow = rows.find((r) => r.geo === "EA");

    let iqrLatest = null;
    if (values.length >= 8) {
      iqrLatest = quartile(values, 0.75) - quartile(values, 0.25);
    }
    let iqrYoy = null;
    const yoyValues = countryRows.map((r) => r.yoy).filter(isValid).sort((a, b) => a - b);
    if (yoyValues.length >= 8) {
      iqrYoy = quartile(yoyValues, 0.75) - quartile(yoyValues, 0.25);
    }
    const dispersionChangePct = (iqrLatest !== null && iqrYoy !== null) ? percentChange(iqrYoy, iqrLatest) : null;

    return {
      reportingCountries: validRows.length,
      totalCountries: countryRows.length,
      min: values.length ? values[0] : null,
      max: values.length ? values[values.length - 1] : null,
      median: median(values),
      euValue: euRow ? euRow.latest : null,
      euYoyPct: euRow ? euRow.yoyPct : null,
      eaValue: eaRow ? eaRow.latest : null,
      rising, falling, stable, unavailable,
      iqr: iqrLatest,
      dispersionChangePct,
      dispersionClassification: dispersionChangePct === null ? "unknown"
        : (dispersionChangePct < -DISPERSION_THRESHOLD_PERCENT ? "converging"
          : (dispersionChangePct > DISPERSION_THRESHOLD_PERCENT ? "diverging" : "stable")),
      topRising: countryRows.filter((r) => isValid(r.yoyPct)).sort((a, b) => b.yoyPct - a.yoyPct).slice(0, 3),
      topFalling: countryRows.filter((r) => isValid(r.yoyPct)).sort((a, b) => a.yoyPct - b.yoyPct).slice(0, 3)
    };
  }

  // ---------------------------------------------------------------------
  // 7.7 — persistent high/low quartile position over a window of past periods
  // ---------------------------------------------------------------------

  function computePersistentPosition(periodPanels, focusGeo) {
    let topCount = 0, bottomCount = 0, validCount = 0;
    periodPanels.forEach((rows) => {
      const countryRows = rows.filter((r) => AGGREGATE_GEOS.indexOf(r.geo) === -1 && isValid(r.value));
      if (countryRows.length < 8) return;
      const values = countryRows.map((r) => r.value).sort((a, b) => a - b);
      const q1 = quartile(values, 0.25);
      const q3 = quartile(values, 0.75);
      const focusRow = countryRows.find((r) => r.geo === focusGeo);
      if (!focusRow) return;
      validCount++;
      if (focusRow.value >= q3) topCount++;
      if (focusRow.value <= q1) bottomCount++;
    });
    if (!validCount) return null;
    return {
      validPeriods: validCount,
      topQuartileShare: (topCount / validCount) * 100,
      bottomQuartileShare: (bottomCount / validCount) * 100,
      persistentlyHigh: (topCount / validCount) >= PERSISTENT_QUARTILE_SHARE_THRESHOLD,
      persistentlyLow: (bottomCount / validCount) >= PERSISTENT_QUARTILE_SHARE_THRESHOLD
    };
  }

  // ---------------------------------------------------------------------
  // 6.24 / 6.25 / 6.26 / 6.28 — consumption-band premium, profile pattern, spread over time
  // ---------------------------------------------------------------------

  // codesDataset's own `consoms` arrays are NOT reliably ordered low->high (e.g.
  // nrg_pc_204's list has KWH_GE15000 as its second entry) — exactly the pitfall flagged in
  // insights.md 2.4 ("don't infer band order from the code text alone... use a canonical
  // mapping"). Extract the numeric threshold from each code instead, so ordering is correct
  // regardless of how codesDataset happens to list them.
  function bandSortKey(code) {
    const upper = code.toUpperCase();
    const m = /(\d+)/.exec(upper);
    if (!m) return Number.POSITIVE_INFINITY;
    let key = parseInt(m[1], 10);
    if (upper.indexOf("_LT") !== -1) key -= 0.5; // "less than N" sorts just below N
    return key;
  }

  function computeBandPattern(bandRows, referenceBand, selectedBand) {
    // TOT_* / aggregate bands aren't part of the bounded low->high consumption profile.
    const boundedRows = bandRows
      .filter((r) => r.band.toUpperCase().indexOf("TOT") === -1 && isValid(r.value))
      .sort((a, b) => bandSortKey(a.band) - bandSortKey(b.band));
    const diffs = [];
    for (let i = 1; i < boundedRows.length; i++) diffs.push(boundedRows[i].value - boundedRows[i - 1].value);

    const refRow = bandRows.find((r) => r.band === referenceBand);
    const selectedRow = bandRows.find((r) => r.band === selectedBand);
    const refValue = refRow && isValid(refRow.value) ? refRow.value : null;
    const selectedValue = selectedRow && isValid(selectedRow.value) ? selectedRow.value : null;
    const epsilonBand = isValid(refValue) && refValue ? Math.abs(refValue) * 0.01 : 0.001;

    let pattern = "mixed";
    if (diffs.length) {
      if (diffs.every((d) => Math.abs(d) <= epsilonBand)) pattern = "flat";
      else if (diffs.every((d) => d <= epsilonBand)) pattern = "decreasing";
      else if (diffs.every((d) => d >= -epsilonBand)) pattern = "increasing";
    }

    return {
      bands: boundedRows,
      referenceBand, referenceValue: refValue,
      selectedBand, selectedValue,
      bandGapAbs: absoluteChange(refValue, selectedValue),
      bandGapPct: percentChange(refValue, selectedValue),
      pattern
    };
  }

  function computeBandSpreadOverTime(lowHistory, highHistory) {
    // lowHistory/highHistory: [{period, value}], same context, only band differs
    const byPeriodLow = {};
    lowHistory.forEach((r) => { byPeriodLow[r.period] = r.value; });
    const spreads = highHistory
      .map((r) => ({ period: r.period, spread: absoluteChange(r.value, byPeriodLow[r.period]) }))
      .filter((r) => isValid(r.spread));
    if (spreads.length < 2) return null;

    const latest = spreads[spreads.length - 1];
    const yoyCode = yoyPeriod(latest.period);
    const yoyRow = spreads.find((r) => r.period === yoyCode);
    const deltaSpread = yoyRow ? absoluteChange(yoyRow.spread, latest.spread) : null;
    const deltaSpreadPct = yoyRow ? percentChange(yoyRow.spread, latest.spread) : null;

    return {
      latestSpread: latest.spread,
      latestPeriod: latest.period,
      yoySpread: yoyRow ? yoyRow.spread : null,
      deltaSpread,
      deltaSpreadPct,
      classification: !isValid(deltaSpreadPct) ? "unavailable"
        : (deltaSpreadPct > DISPERSION_THRESHOLD_PERCENT ? "widened"
          : (deltaSpreadPct < -DISPERSION_THRESHOLD_PERCENT ? "narrowed" : "stable"))
    };
  }

  // ---------------------------------------------------------------------
  // 7.8 / 7.9 — focus country's composition vs the official EU aggregate's own composition
  // ---------------------------------------------------------------------

  function computeGlobalComponentSummary(focusComposition, euComposition) {
    if (!focusComposition.hasData || !euComposition.hasData) return { available: false };
    const byCode = {};
    focusComposition.components.forEach((c) => { byCode[c.code] = { focusShare: c.share }; });
    euComposition.components.forEach((c) => {
      byCode[c.code] = byCode[c.code] || {};
      byCode[c.code].euShare = c.share;
    });
    const comparison = Object.keys(byCode).map((code) => ({
      code,
      focusShare: byCode[code].focusShare != null ? byCode[code].focusShare : null,
      euShare: byCode[code].euShare != null ? byCode[code].euShare : null,
      gap: (byCode[code].focusShare != null && byCode[code].euShare != null) ? byCode[code].focusShare - byCode[code].euShare : null
    })).filter((c) => isValid(c.gap)).sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));

    return { available: true, comparison, mostDivergent: comparison[0] || null };
  }

  // ---------------------------------------------------------------------
  // "1. What does this mean for me?" — indicative annual-cost estimator
  // and "2. Consumption-band suitability" — band finder
  // ---------------------------------------------------------------------

  function computeAnnualCost(pricePerUnit, annualConsumption) {
    if (!isValid(pricePerUnit) || !isValid(annualConsumption) || annualConsumption < 0) return null;
    return pricePerUnit * annualConsumption;
  }

  // Parses a consumption-band code into a numeric [lower, upper) range so a user's own
  // consumption figure can be matched against it. Handles the three shapes actually used
  // in codesDataset: "..._LTn" (below n), "..._GEn" / "..._LEn" (n and above — the "LE"
  // spelling is a known naming inconsistency for what is really a "greater-or-equal"
  // open-ended band, per insights.md 2.4), and "..lower-upper" (bounded range, upper is
  // inclusive in the code so the matching range extends to upper+1).
  function parseBandBounds(code) {
    const upper = code.toUpperCase();
    if (upper.indexOf("TOT") !== -1) return null;
    const ltMatch = /_LT(\d+)/.exec(upper);
    if (ltMatch) return { lower: 0, upper: parseInt(ltMatch[1], 10) };
    const openMatch = /_(?:GE|LE)(\d+)/.exec(upper);
    if (openMatch) return { lower: parseInt(openMatch[1], 10), upper: Infinity };
    const rangeMatch = /(\d+)-(\d+)/.exec(upper);
    if (rangeMatch) return { lower: parseInt(rangeMatch[1], 10), upper: parseInt(rangeMatch[2], 10) + 1 };
    return null;
  }

  function findBandForConsumption(bandRows, consumption) {
    if (!isValid(consumption) || consumption < 0) return null;
    const candidates = bandRows
      .map((r) => ({ band: r.band, value: r.value, bounds: parseBandBounds(r.band) }))
      .filter((r) => r.bounds);
    const match = candidates.find((r) => consumption >= r.bounds.lower && consumption < r.bounds.upper);
    return match ? { band: match.band, value: match.value, bounds: match.bounds } : null;
  }

  // ---------------------------------------------------------------------
  // 8.2 — energy price vs. general inflation (related context, not causation)
  // ---------------------------------------------------------------------

  function computeInflationComparison(hicpDataset, energyYoyPct, month) {
    if (!hicpDataset || !isValid(energyYoyPct)) return null;
    const res = hicpDataset.Data(0);
    const hicpYoyPct = res && isValid(res.value) ? res.value : null;
    if (!isValid(hicpYoyPct)) return null;
    return { hicpYoyPct, energyYoyPct, gap: energyYoyPct - hicpYoyPct, month };
  }

  // ---------------------------------------------------------------------
  // Orchestration
  // ---------------------------------------------------------------------

  async function computeSelectedViewInsights() {
    const ctx = buildContext();

    // REF.time is not trustworthy as "the latest period": it's read from whichever dataset
    // is currently active on the main chart (js/populateYears.js), and the component ("_c")
    // dataset is annual while the plain price dataset used here is bi-annual — REF.time can
    // therefore be in the wrong format entirely (e.g. "2025" instead of "2025-S2") whenever
    // the user currently has component mode toggled on. Instead, fetch the panel first and
    // derive the latest period from the data itself, exactly as spec 6.2 defines it
    // ("latestPeriod = max(period where value is valid")).
    const eurPanelDataset = await fetchDataset(buildPanelUrl(ctx, "EUR"));
    const eurHistoryFull = readHistory(eurPanelDataset, ctx.geo);
    const latestPeriod = eurHistoryFull.length ? eurHistoryFull[eurHistoryFull.length - 1].period : ctx.time;

    const semesterBefore = previousSemester(latestPeriod);
    const yoyBefore = yoyPeriod(latestPeriod);

    const latestYear = periodToYear(latestPeriod);
    const yoyYear = latestYear ? String(parseInt(latestYear, 10) - 1) : null;

    const hicpMonth = semesterToHicpMonth(latestPeriod);

    const [ppsPanelSettled, componentSettled, bandDatasetSettled, hicpDatasetSettled] = await Promise.all([
      fetchDataset(buildPanelUrl(ctx, "PPS")).catch(() => null),
      // Fetch both the focus geo and EU27_2020 together so the same response can feed both
      // the focus-country composition and the "vs official EU composition" comparison (7.8/7.9).
      fetchDataset(buildComponentUrlMultiGeo(ctx, [ctx.geo, "EU27_2020"], [latestYear, yoyYear])).catch(() => null),
      fetchDataset(buildBandUrl(ctx)).catch(() => null),
      hicpMonth ? fetchDataset(buildHicpUrl(ctx.geo, hicpMonth)).catch(() => null) : Promise.resolve(null)
    ]);

    const hasLatestPeriod = periodExists(eurPanelDataset, latestPeriod);
    const hasSemesterBefore = periodExists(eurPanelDataset, semesterBefore);
    const hasYoyBefore = periodExists(eurPanelDataset, yoyBefore);

    const eurHistory = eurHistoryFull;
    const eurPanelLatest = hasLatestPeriod ? readCrossCountry(eurPanelDataset, latestPeriod) : [];

    const latestValue = hasLatestPeriod ? readPoint(eurPanelDataset, ctx.geo, latestPeriod) : null;
    const semesterValue = hasSemesterBefore ? readPoint(eurPanelDataset, ctx.geo, semesterBefore) : null;
    const yoyValue = hasYoyBefore ? readPoint(eurPanelDataset, ctx.geo, yoyBefore) : null;

    const crossCountry = computeCrossCountry(eurPanelLatest, ctx.geo);
    const historicalPosition = computeHistoricalPosition(eurHistory, latestPeriod);

    const preTaxLatest = hasLatestPeriod ? readPointForTax(eurPanelDataset, ctx.geo, latestPeriod, "X_TAX") : null;
    const preTaxYoy = hasYoyBefore ? readPointForTax(eurPanelDataset, ctx.geo, yoyBefore, "X_TAX") : null;
    const fiscalEffect = computeFiscalEffect(preTaxLatest, preTaxYoy, latestValue, yoyValue);

    let composition = { components: [], hasData: false };
    let euComposition = { components: [], hasData: false };
    let globalComponentSummary = { available: false };
    let rankShift = { available: false, cohortSize: 0 };
    if (componentSettled) {
      composition = computeComposition(componentSettled, ctx, latestYear, yoyYear);
      euComposition = computeComposition(componentSettled, Object.assign({}, ctx, { geo: "EU27_2020" }), latestYear, yoyYear);
      globalComponentSummary = computeGlobalComponentSummary(composition, euComposition);
    }
    if (ppsPanelSettled && periodExists(ppsPanelSettled, latestPeriod)) {
      const ppsPanelLatest = readCrossCountry(ppsPanelSettled, latestPeriod);
      rankShift = computeRankShift(eurPanelLatest, ppsPanelLatest, ctx.geo);
    }

    // Development: momentum/CAGR/turning points/volatility/seasonality, all derived from the
    // history already fetched for historicalPosition — no extra network calls.
    const development = {
      momentum: computeMomentum(eurHistory),
      cagr2: computeCagr(eurHistory, 2),
      cagr5: computeCagr(eurHistory, 5),
      trendReversal: computeTrendReversal(eurHistory),
      consecutiveMovement: computeConsecutiveMovement(eurHistory),
      volatility: computeVolatility(eurHistory, VOLATILITY_WINDOW),
      seasonalPattern: computeSeasonalPattern(eurHistory)
    };

    const rankSensitivity = computeRankSensitivity(eurPanelLatest, ctx.geo);
    const anomalies = detectAnomalies({
      latestValue,
      yoyChangePct: percentChange(yoyValue, latestValue)
    });

    // Europe-at-a-glance and persistent-position both reuse the full geo x time panel that
    // was already fetched for the focus country's own history — no extra network calls.
    const countryYoyRows = buildCountryYoyRows(eurPanelDataset, latestPeriod, yoyBefore);
    const europeSnapshot = computeEuropeSnapshot(countryYoyRows);

    const allPeriods = eurPanelDataset.Dimension("time").id || [];
    const windowPeriods = allPeriods.slice(-PERSISTENT_QUARTILE_WINDOW);
    const periodPanels = windowPeriods.map((p) => readCrossCountry(eurPanelDataset, p));
    const persistentPosition = computePersistentPosition(periodPanels, ctx.geo);

    let bandPattern = null;
    let bandSpreadOverTime = null;
    if (bandDatasetSettled) {
      const referenceBand = (codesDataset[ctx.dataset] && codesDataset[ctx.dataset].defaultConsom) || ctx.band;
      const bandRowsLatest = readBandRowsAtPeriod(bandDatasetSettled, latestPeriod);
      bandPattern = computeBandPattern(bandRowsLatest, referenceBand, ctx.band);

      if (bandPattern.bands.length >= 2) {
        const lowBand = bandPattern.bands[0].band;
        const highBand = bandPattern.bands[bandPattern.bands.length - 1].band;
        bandSpreadOverTime = computeBandSpreadOverTime(
          readBandHistory(bandDatasetSettled, lowBand),
          readBandHistory(bandDatasetSettled, highBand)
        );
      }
    }

    const inflationComparison = computeInflationComparison(hicpDatasetSettled, percentChange(yoyValue, latestValue), hicpMonth);

    const latestStatus = hasLatestPeriod ? readStatus(eurPanelDataset, ctx.geo, latestPeriod) : null;

    const dataQuality = {
      focusMissing: !isValid(latestValue),
      yoyMissing: !isValid(yoyValue) && !!yoyBefore,
      cohortSize: crossCountry.n,
      benchmarkMissing: !isValid(crossCountry.euValue),
      componentDataMissing: !composition.hasData,
      insufficientHistory: historicalPosition ? historicalPosition.observationCount < 6 : true,
      reconciliationGap: composition.hasData && isValid(latestValue) && latestValue
        ? Math.abs(latestValue - composition.componentSum) / Math.abs(latestValue) * 100
        : null,
      latestStatus,
      isProvisional: latestStatus === "p",
      isEstimated: latestStatus === "e",
      anomalies
    };

    return {
      context: ctx,
      latestPeriod,
      semesterBefore,
      yoyBefore,
      price: {
        latestValue,
        semesterValue,
        yoyValue,
        semesterChangeAbs: absoluteChange(semesterValue, latestValue),
        semesterChangePct: percentChange(semesterValue, latestValue),
        yoyChangeAbs: absoluteChange(yoyValue, latestValue),
        yoyChangePct: percentChange(yoyValue, latestValue),
        direction: classifyDirection(percentChange(yoyValue, latestValue))
      },
      crossCountry,
      historicalPosition,
      eurHistoryForChart: eurHistory,
      composition,
      euComposition,
      globalComponentSummary,
      fiscalEffect,
      rankShift,
      development,
      rankSensitivity,
      europeSnapshot,
      persistentPosition,
      bandPattern,
      bandSpreadOverTime,
      inflationComparison,
      dataQuality
    };
  }

  return {
    computeSelectedViewInsights,
    // exposed for testing/reuse
    percentChange,
    absoluteChange,
    median,
    quartile,
    classifyDirection,
    computeCrossCountry,
    computeHistoricalPosition,
    computeComposition,
    computeFiscalEffect,
    computeRankShift,
    computeMomentum,
    computeCagr,
    computeConsecutiveMovement,
    computeTrendReversal,
    computeVolatility,
    computeSeasonalPattern,
    computeRankSensitivity,
    detectAnomalies,
    computeEuropeSnapshot,
    computePersistentPosition,
    computeBandPattern,
    computeBandSpreadOverTime,
    computeGlobalComponentSummary,
    computeInflationComparison,
    computeAnnualCost,
    parseBandBounds,
    findBandForConsumption,
    bandSortKey,
    parsePeriod,
    semesterCode,
    previousSemester,
    yoyPeriod,
    periodToYear
  };
})();
