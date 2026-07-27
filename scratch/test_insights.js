const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock REF and codesDataset for loading insightsData.js in Node.js
global.REF = {
  product: "6000",
  consumer: "HOUSEHOLD",
  consoms: "KWH2500-4999",
  unit: "KWH",
  currency: "EUR",
  time: "2024-S2",
  chartGeo: "DE",
  language: "EN"
};

global.codesDataset = {
  "nrg_pc_204_c": {
    product: "6000",
    consumer: "HOUSEHOLD",
    consoms: ["TOT_KWH", "KWH_LT1000", "KWH1000-2499", "KWH2500-4999", "KWH5000-14999", "KWH_LE15000"],
    unit: ["KWH", "MWH"],
    currency: ["EUR", "PPS"],
    nrg_prc: ["NETC", "NRG_SUP", "OTH", "TAX_CAP", "TAX_ENV", "TAX_NUC", "TAX_RNW", "VAT"],
    defaultConsom: "TOT_KWH",
    defaultUnit: "KWH",
    defaultCurrency: "EUR"
  },
  "nrg_pc_204": {
    product: "6000",
    consumer: "HOUSEHOLD",
    consoms: ["KWH_LT1000", "KWH_GE15000", "KWH5000-14999", "KWH2500-4999", "KWH1000-2499"],
    unit: ["KWH", "MWH"],
    currency: ["EUR", "PPS"],
    defaultConsom: "KWH2500-4999",
    defaultUnit: "KWH",
    defaultCurrency: "EUR"
  }
};

// Load insightsData.js
const code = fs.readFileSync(path.join(__dirname, '../js/insightsData.js'), 'utf8');
eval(code);

console.log('--------------------------------------------------');
console.log('RUNNING ENPRICES INSIGHTS UNIT TESTS & REGRESSION PASS');
console.log('--------------------------------------------------');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

// 1. Math & Stat Helpers
test('percentChange', () => {
  assert.strictEqual(insightsDataNameSpace.percentChange(100, 110), 10);
  assert.strictEqual(insightsDataNameSpace.percentChange(100, 90), -10);
  assert.strictEqual(insightsDataNameSpace.percentChange(0, 10), null);
  assert.strictEqual(insightsDataNameSpace.percentChange(null, 10), null);
});

test('absoluteChange', () => {
  assert.ok(Math.abs(insightsDataNameSpace.absoluteChange(0.20, 0.25) - 0.05) < 1e-9);
  assert.ok(Math.abs(insightsDataNameSpace.absoluteChange(0.25, 0.20) - (-0.05)) < 1e-9);
});

test('median', () => {
  assert.strictEqual(insightsDataNameSpace.median([1, 3, 5]), 3);
  assert.strictEqual(insightsDataNameSpace.median([1, 2, 3, 4]), 2.5);
  assert.strictEqual(insightsDataNameSpace.median([]), null);
});

test('quartile', () => {
  const sorted = [10, 20, 30, 40, 50];
  assert.strictEqual(insightsDataNameSpace.quartile(sorted, 0.5), 30);
});

test('classifyDirection', () => {
  assert.strictEqual(insightsDataNameSpace.classifyDirection(5), 'rising');
  assert.strictEqual(insightsDataNameSpace.classifyDirection(-3), 'falling');
  assert.strictEqual(insightsDataNameSpace.classifyDirection(0.2), 'stable');
  assert.strictEqual(insightsDataNameSpace.classifyDirection(null), 'unavailable');
});

// 2. Cross Country & Ranking
test('computeCrossCountry', () => {
  const panel = [
    { geo: 'EU27_2020', value: 0.25 },
    { geo: 'EA', value: 0.26 },
    { geo: 'DE', value: 0.30 },
    { geo: 'FR', value: 0.20 },
    { geo: 'ES', value: 0.22 },
    { geo: 'IT', value: 0.28 }
  ];
  const res = insightsDataNameSpace.computeCrossCountry(panel, 'DE');
  assert.strictEqual(res.n, 4);
  assert.strictEqual(res.focusValue, 0.30);
  assert.strictEqual(res.rankHigh, 1);
  assert.strictEqual(res.rankLow, 4);
  assert.ok(Math.abs(res.euGapAbs - 0.05) < 1e-9);
});

// 3. Historical Position & Development
test('computeHistoricalPosition', () => {
  const history = [
    { period: '2020-S1', value: 0.15 },
    { period: '2020-S2', value: 0.18 },
    { period: '2021-S1', value: 0.25 }, // peak
    { period: '2021-S2', value: 0.22 },
    { period: '2022-S1', value: 0.24 }
  ];
  const res = insightsDataNameSpace.computeHistoricalPosition(history, '2022-S1');
  assert.strictEqual(res.max, 0.25);
  assert.strictEqual(res.min, 0.15);
  assert.strictEqual(res.peakPeriod, '2021-S1');
  assert.strictEqual(res.periodsSincePeak, 2);
});

test('computeMomentum', () => {
  const history = [
    { period: '2022-S1', value: 100 },
    { period: '2022-S2', value: 110 },
    { period: '2023-S1', value: 120 },
    { period: '2023-S2', value: 135 },
    { period: '2024-S1', value: 160 }
  ];
  const res = insightsDataNameSpace.computeMomentum(history);
  assert.ok(res !== null);
  assert.ok(typeof res.classification === 'string');
});

test('computeCagr', () => {
  const history = [
    { period: '2019-S1', value: 100 },
    { period: '2024-S1', value: 146.41 }
  ];
  const res = insightsDataNameSpace.computeCagr(history, 5);
  assert.ok(res !== null);
  assert.strictEqual(Math.round(res.cagr), 8);
});

// 4. Fiscal Cushioning & PPS Rank Shift
test('computeFiscalEffect', () => {
  const res = insightsDataNameSpace.computeFiscalEffect(0.20, 0.15, 0.22, 0.20);
  assert.ok(Math.abs(res.deltaPreTax - 0.05) < 1e-9);
  assert.ok(Math.abs(res.deltaFinal - 0.02) < 1e-9);
  assert.strictEqual(res.classification, 'cushioned');
});

test('computeRankShift', () => {
  const eurPanel = [{ geo: 'DE', value: 0.30 }, { geo: 'FR', value: 0.25 }, { geo: 'ES', value: 0.20 }];
  const ppsPanel = [{ geo: 'DE', value: 0.20 }, { geo: 'FR', value: 0.25 }, { geo: 'ES', value: 0.30 }];
  const res = insightsDataNameSpace.computeRankShift(eurPanel, ppsPanel, 'DE');
  assert.strictEqual(res.rankEur, 1);
  assert.strictEqual(res.rankPps, 3);
  assert.strictEqual(res.shift, -2);
});

// 5. Consumer Tools: Estimator & Band Finder
test('computeAnnualCost', () => {
  assert.ok(Math.abs(insightsDataNameSpace.computeAnnualCost(0.289, 3500) - 1011.5) < 1e-9);
  assert.strictEqual(insightsDataNameSpace.computeAnnualCost(0.289, -10), null);
  assert.strictEqual(insightsDataNameSpace.computeAnnualCost(null, 3500), null);
});

test('parseBandBounds', () => {
  const b1 = insightsDataNameSpace.parseBandBounds('KWH_LT1000');
  assert.deepStrictEqual(b1, { lower: 0, upper: 1000 });

  const b2 = insightsDataNameSpace.parseBandBounds('KWH2500-4999');
  assert.deepStrictEqual(b2, { lower: 2500, upper: 5000 });

  const b3 = insightsDataNameSpace.parseBandBounds('KWH_GE15000');
  assert.deepStrictEqual(b3, { lower: 15000, upper: Infinity });

  const b4 = insightsDataNameSpace.parseBandBounds('KWH_LE15000');
  assert.deepStrictEqual(b4, { lower: 15000, upper: Infinity });

  const bTot = insightsDataNameSpace.parseBandBounds('TOT_KWH');
  assert.strictEqual(bTot, null);
});

test('findBandForConsumption', () => {
  const bandRows = [
    { band: 'KWH_LT1000', value: 0.35 },
    { band: 'KWH1000-2499', value: 0.30 },
    { band: 'KWH2500-4999', value: 0.28 },
    { band: 'KWH5000-14999', value: 0.25 },
    { band: 'KWH_GE15000', value: 0.22 }
  ];
  const res1 = insightsDataNameSpace.findBandForConsumption(bandRows, 3500);
  assert.strictEqual(res1.band, 'KWH2500-4999');

  const res2 = insightsDataNameSpace.findBandForConsumption(bandRows, 500);
  assert.strictEqual(res2.band, 'KWH_LT1000');

  const res3 = insightsDataNameSpace.findBandForConsumption(bandRows, 20000);
  assert.strictEqual(res3.band, 'KWH_GE15000');
});

// 6. Direct Country Comparison
test('computeDirectCountryComparison', () => {
  const mockPanel = {
    Dimension: () => ({ id: ['DE', 'FR', 'ES'] }),
    Data: ({ geo, time, tax }) => {
      if (geo === 'DE') return { value: 0.30 };
      if (geo === 'FR') return { value: 0.22 };
      return null;
    }
  };
  const res = insightsDataNameSpace.computeDirectCountryComparison(mockPanel, 'DE', 'FR', null, { unit: 'KWH' }, '2024-S2');
  assert.ok(res !== null);
  assert.strictEqual(res.countryA, 'DE');
  assert.strictEqual(res.countryB, 'FR');
  assert.strictEqual(res.valA, 0.30);
  assert.strictEqual(res.valB, 0.22);
  assert.ok(Math.abs(res.gapAbs - 0.08) < 1e-9);
  assert.ok(res.gapPct > 0);
});

// 7. Advanced Analytical Insights Expansion
test('computeCrisisRecovery', () => {
  const history = [
    { period: '2019-S2', value: 0.20 },
    { period: '2020-S1', value: 0.21 },
    { period: '2021-S1', value: 0.25 },
    { period: '2022-S2', value: 0.40 }, // Peak
    { period: '2023-S1', value: 0.35 },
    { period: '2024-S2', value: 0.28 }  // Latest
  ];
  const res = insightsDataNameSpace.computeCrisisRecovery(history);
  assert.ok(res !== null);
  assert.strictEqual(res.peakPeriod, '2022-S2');
  assert.strictEqual(res.peakValue, 0.40);
  assert.strictEqual(res.preCrisisPeriod, '2019-S2');
  assert.ok(Math.abs(res.dropFromPeakPct - (-30)) < 1e-9);
  assert.ok(Math.abs(res.gapFromPreCrisisPct - 40) < 1e-9);
});

test('computeRegionalBenchmark', () => {
  const eurPanelLatest = [
    { geo: 'DE', value: 0.35 },
    { geo: 'FR', value: 0.25 },
    { geo: 'BE', value: 0.30 },
    { geo: 'NL', value: 0.20 },
    { geo: 'LU', value: 0.15 },
    { geo: 'AT', value: 0.25 },
    { geo: 'IE', value: 0.30 }
  ];
  const res = insightsDataNameSpace.computeRegionalBenchmark(eurPanelLatest, 'FR');
  assert.ok(res !== null);
  assert.strictEqual(res.regionName, 'Western Europe');
  assert.strictEqual(res.regionSize, 7);
  assert.strictEqual(res.rankInRegion, 4);
});

test('computeCrossFuelRatio', () => {
  const res = insightsDataNameSpace.computeCrossFuelRatio(0.30, 0.10, '6000');
  assert.ok(res !== null);
  assert.ok(Math.abs(res.ratio - 3) < 1e-9);
  assert.ok(Math.abs(res.pctDiff - 200) < 1e-9);
});

console.log('--------------------------------------------------');
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('--------------------------------------------------');

if (failed > 0) {
  process.exit(1);
}
