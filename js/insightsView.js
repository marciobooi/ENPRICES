function openInsightsView() {
    $('#charts').addClass('d-none');
    $('#insightsView').removeClass('d-none');

    $('#chartBtns').children().not('#closeInsightsWrapper').addClass('d-none');
    $('#closeInsightsWrapper').removeClass('d-none');

    var trigger = document.getElementById('insightsChart');
    if (trigger) {
        trigger.setAttribute('aria-expanded', 'true');
    }

    var closeBtn = document.getElementById('insightsCloseBtn');
    if (closeBtn) {
        closeBtn.focus();
    }

    $(document).on('keydown.insightsView', function (event) {
        if (event.key === 'Escape' || event.key === 'Esc') {
            event.preventDefault();
            closeInsightsView();
        }
    });

    loadInsights();
}

function closeInsightsView() {
    $('#insightsView').addClass('d-none');
    $('#charts').removeClass('d-none');

    $('#chartBtns').children().removeClass('d-none');
    $('#closeInsightsWrapper').addClass('d-none');

    var trigger = document.getElementById('insightsChart');
    if (trigger) {
        trigger.setAttribute('aria-expanded', 'false');
        trigger.focus();
    }

    $(document).off('keydown.insightsView');
}

// Per-card "how is this calculated" disclosure. Global because it's wired via inline
// onclick on dynamically generated markup.
function toggleInsightCalc(btn) {
    var panelId = btn.getAttribute('aria-controls');
    var panel = document.getElementById(panelId);
    if (!panel) return;
    var expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    if (expanded) {
        panel.setAttribute('hidden', '');
    } else {
        panel.removeAttribute('hidden');
    }
}

var insightsRenderNameSpace = (function () {

    var currentRequestId = 0;
    var cardIdCounter = 0;

    function t(key) {
        return (typeof languageNameSpace !== 'undefined' && languageNameSpace.labels[key]) || key;
    }

    function locale() {
        var map = { EN: 'en', DE: 'de', FR: 'fr' };
        return map[REF.language] || 'en';
    }

    function esc(value) {
        return String(value === null || value === undefined ? '' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function formatNumber(value, decimals) {
        if (value === null || value === undefined || isNaN(value)) return null;
        try {
            return new Intl.NumberFormat(locale(), { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
        } catch (e) {
            return value.toFixed(decimals);
        }
    }

    function priceDecimals(ctx) {
        return ctx.unit === 'MWH' ? 2 : 4;
    }

    function unitLabel(ctx) {
        return esc(t('S_' + ctx.currency)) + '/' + esc(t('S_' + ctx.unit));
    }

    function formatPrice(value, ctx) {
        var n = formatNumber(value, priceDecimals(ctx));
        return n === null ? null : n + ' ' + unitLabel(ctx);
    }

    function formatRaw(value, ctx) {
        // Plain number, no unit suffix — used inside calculation strings where the unit is
        // already implied by context.
        var n = formatNumber(value, priceDecimals(ctx));
        return n === null ? '—' : n;
    }

    function formatPercent(value) {
        var n = formatNumber(value === null || value === undefined ? null : Math.abs(value), 1);
        if (n === null) return null;
        var sign = value > 0 ? '+' : (value < 0 ? '−' : '');
        return sign + n + '%';
    }

    function directionIcon(direction) {
        if (direction === 'rising') return 'fa-arrow-up';
        if (direction === 'falling') return 'fa-arrow-down';
        if (direction === 'stable') return 'fa-minus';
        return 'fa-question';
    }

    function directionLabel(direction) {
        if (direction === 'rising') return t('INSIGHTS_RISING');
        if (direction === 'falling') return t('INSIGHTS_FALLING');
        if (direction === 'stable') return t('INSIGHTS_STABLE');
        return t('INSIGHTS_UNAVAILABLE');
    }

    function contextPhrase(ctx) {
        return [t(ctx.product), t(ctx.consumer), t(ctx.band), t(ctx.geo)].filter(Boolean).join(' · ');
    }

    // ---- card primitive: label + value + context + optional expandable calc -------------

    // ---- card primitive: label + value + context + expandable calc (What it is, Calculation, Purpose) -------------

    function card(opts) {
        var hasValue = opts.value !== null && opts.value !== undefined && opts.value !== '';
        return '<div class="insight-card">' +
            '<div class="insight-card__label"><span>' + esc(opts.label) + '</span></div>' +
            '<div class="insight-card__value">' + (hasValue ? opts.value : esc(t('INSIGHTS_NOT_AVAILABLE'))) + '</div>' +
            (opts.sub ? '<div class="insight-card__sub">' + opts.sub + '</div>' : '') +
            (opts.note ? '<div class="insight-card__note">' + esc(opts.note) + '</div>' : '') +
            '</div>';
    }

    function changeSub(pct, abs, ctx) {
        var pctText = formatPercent(pct);
        if (pctText === null) return null;
        var absText = formatPrice(abs, ctx);
        var dir = pct > 0 ? 'rising' : (pct < 0 ? 'falling' : 'stable');
        return '<i class="fas ' + directionIcon(dir) + '" aria-hidden="true"></i> ' + esc(directionLabel(dir)) +
            (absText ? ' (' + esc(absText) + ')' : '');
    }

    function section(titleIcon, titleText, bodyHtml, info) {
        if (!bodyHtml) return '';

        var infoBtn = info ? '<button type="button" class="insight-card__info-btn" ' +
            'data-title="' + esc(titleText) + '" ' +
            'data-what="' + esc(info.whatItIs) + '" ' +
            'data-calc="' + esc(info.calculation) + '" ' +
            'data-purpose="' + esc(info.purpose) + '" ' +
            'onclick="insightsRenderNameSpace.openModal(this)" title="' + esc(t('INSIGHTS_HOW_CALCULATED')) + '"><i class="fas fa-info-circle" aria-hidden="true"></i>' +
            '<span class="sr-only">' + esc(t('INSIGHTS_HOW_CALCULATED')) + '</span></button>' : '';

        return '<section class="insights-section">' +
            '<h3 class="insights-section__title"><span style="display:flex;align-items:center;gap:0.45rem"><i class="fas ' + titleIcon + '" aria-hidden="true"></i> ' + esc(titleText) + infoBtn + '</span></h3>' +
            bodyHtml +
            '</section>';
    }

    // ---- context strip --------------------------------------------------------------------

    function renderContext(ctx, latestPeriod) {
        function item(label, value) {
            if (!value) return '';
            return '<div class="insights-meta__item"><span class="insights-meta__label">' + esc(label) + '</span>' +
                '<span class="insights-meta__value">' + esc(value) + '</span></div>';
        }
        return '<div class="insights-meta">' +
            item(t('INSIGHTS_GEOGRAPHY'), t(ctx.geo)) +
            item(t('INSIGHTS_PERIOD'), latestPeriod) +
            item(t('INSIGHTS_PRODUCT'), t(ctx.product)) +
            item(t('INSIGHTS_CONSUMER'), t(ctx.consumer)) +
            item(t('INSIGHTS_BAND'), t(ctx.band)) +
            item(t('INSIGHTS_PRICE_EXPRESSION'), unitLabel(ctx)) +
            '</div>';
    }

    // ---- SVG sparkline (historical trend) --------------------------------------------------

    // ---- SVG sparkline (historical trend) --------------------------------------------------

    // ---- SVG sparkline (historical trend) --------------------------------------------------

    function renderSparkline(history, ctx) {
        if (!history || history.length < 2) return '';
        var width = 800, height = 320;
        var paddingX = 40, paddingY = 28;

        var values = history.map(function (r) { return r.value; });
        var min = Math.min.apply(null, values);
        var max = Math.max.apply(null, values);
        var avg = values.reduce(function (a, b) { return a + b; }, 0) / values.length;
        var range = (max - min) || 1;

        var stepX = (width - paddingX * 2) / (history.length - 1);
        var yScale = function (val) {
            return paddingY + (1 - (val - min) / range) * (height - paddingY * 2);
        };

        var points = history.map(function (r, i) {
            return {
                x: paddingX + i * stepX,
                y: yScale(r.value),
                value: r.value,
                period: r.period
            };
        });

        var linePath = points.map(function (p, i) {
            return (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1);
        }).join(' ');

        var lastX = points[points.length - 1].x.toFixed(1);
        var firstX = points[0].x.toFixed(1);
        var baseline = (height - paddingY).toFixed(1);
        var areaPath = linePath + ' L' + lastX + ',' + baseline + ' L' + firstX + ',' + baseline + ' Z';

        var yMax = yScale(max);
        var yMin = yScale(min);
        var yAvg = yScale(avg);

        var peakPoint = points[values.indexOf(max)];
        var minPoint = points[values.indexOf(min)];
        var lastPoint = points[points.length - 1];

        var maxLine = '<line class="insights-sparkline__ref-line insights-sparkline__ref-line--max" x1="' + paddingX + '" y1="' + yMax.toFixed(1) + '" x2="' + (width - paddingX) + '" y2="' + yMax.toFixed(1) + '"></line>';
        var avgLine = '<line class="insights-sparkline__ref-line insights-sparkline__ref-line--avg" x1="' + paddingX + '" y1="' + yAvg.toFixed(1) + '" x2="' + (width - paddingX) + '" y2="' + yAvg.toFixed(1) + '"></line>';
        var minLine = '<line class="insights-sparkline__ref-line insights-sparkline__ref-line--min" x1="' + paddingX + '" y1="' + yMin.toFixed(1) + '" x2="' + (width - paddingX) + '" y2="' + yMin.toFixed(1) + '"></line>';

        var maxMarker = '<circle class="insights-sparkline__marker insights-sparkline__marker--max" cx="' + peakPoint.x.toFixed(1) + '" cy="' + peakPoint.y.toFixed(1) + '" r="6"></circle>';
        var minMarker = '<circle class="insights-sparkline__marker insights-sparkline__marker--min" cx="' + minPoint.x.toFixed(1) + '" cy="' + minPoint.y.toFixed(1) + '" r="6"></circle>';
        var lastMarker = '<circle class="insights-sparkline__marker insights-sparkline__marker--latest" cx="' + lastPoint.x.toFixed(1) + '" cy="' + lastPoint.y.toFixed(1) + '" r="6"></circle>';

        var maxText = '<text class="insights-sparkline__label insights-sparkline__label--max" x="' + Math.min(width - 80, Math.max(80, peakPoint.x)).toFixed(1) + '" y="' + Math.max(16, yMax - 8).toFixed(1) + '" text-anchor="middle">Max: ' + esc(formatPrice(max, ctx)) + '</text>';
        var minText = '<text class="insights-sparkline__label insights-sparkline__label--min" x="' + Math.min(width - 80, Math.max(80, minPoint.x)).toFixed(1) + '" y="' + Math.min(height - 6, yMin + 18).toFixed(1) + '" text-anchor="middle">Min: ' + esc(formatPrice(min, ctx)) + '</text>';
        var avgText = '<text class="insights-sparkline__label insights-sparkline__label--avg" x="' + (width - paddingX - 6) + '" y="' + (yAvg - 6).toFixed(1) + '" text-anchor="end">Avg: ' + esc(formatPrice(avg, ctx)) + '</text>';

        var svg = '<svg class="insights-sparkline__svg" viewBox="0 0 ' + width + ' ' + height + '" preserveAspectRatio="none" aria-hidden="true">' +
            '<path class="insights-sparkline__area" d="' + areaPath + '"></path>' +
            maxLine + avgLine + minLine +
            '<path class="insights-sparkline__line" d="' + linePath + '"></path>' +
            maxMarker + minMarker + lastMarker +
            maxText + minText + avgText +
            '</svg>';

        var legend = '<div class="insights-sparkline__legend">' +
            '<span><span class="insights-sparkline__legend-dot" style="background:#dc2626"></span><strong>Max:</strong> ' + esc(formatPrice(max, ctx)) + ' (' + esc(peakPoint.period) + ')</span>' +
            '<span><span class="insights-sparkline__legend-dot" style="background:#2563eb;border-top:1px dashed #2563eb"></span><strong>Avg:</strong> ' + esc(formatPrice(avg, ctx)) + '</span>' +
            '<span><span class="insights-sparkline__legend-dot" style="background:#16a34a"></span><strong>Min:</strong> ' + esc(formatPrice(min, ctx)) + ' (' + esc(minPoint.period) + ')</span>' +
            '</div>';

        var axis = '<div class="insights-sparkline__axis"><span>' + esc(history[0].period) + '</span><span>' + esc(history[history.length - 1].period) + '</span></div>';

        return '<div class="insights-history-trend">' +
            '<div class="insights-history-trend__title">' + esc(t('INSIGHTS_HISTORICAL_POSITION')) +
            '<span class="insights-history-trend__meta">(' + history.length + ' ' + esc(t('INSIGHTS_PERIOD')).toLowerCase() + 's)</span></div>' +
            '<div class="insights-sparkline">' + svg + axis + legend + '</div>' +
            '</div>';
    }

    // ---- country distribution position bar -------------------------------------------------

    function renderDistribution(cc, ctx) {
        if (!cc || cc.focusValue == null || cc.min == null || cc.max == null || cc.max === cc.min) return '';
        var pct = function (v) { return Math.max(0, Math.min(100, ((v - cc.min) / (cc.max - cc.min)) * 100)); };
        var focusPct = pct(cc.focusValue);
        var euMarker = cc.euValue != null ? '<div class="insights-distribution__marker insights-distribution__marker--eu" style="left:' + pct(cc.euValue).toFixed(1) + '%" title="' + esc(t('EU27_2020')) + '"></div>' : '';

        return '<div class="insights-distribution">' +
            '<div class="insights-distribution__track">' +
            '<div class="insights-distribution__marker" style="left:' + focusPct.toFixed(1) + '%" title="' + esc(t(ctx.geo)) + '"></div>' +
            euMarker +
            '</div>' +
            '<div class="insights-distribution__labels"><span>' + esc(formatPrice(cc.min, ctx)) + '</span><span>' + esc(formatPrice(cc.max, ctx)) + '</span></div>' +
            '<div class="insights-distribution__legend">' +
            '<span><span class="insights-distribution__legend-dot" style="background:var(--nav-color)"></span>' + esc(t(ctx.geo)) + '</span>' +
            (cc.euValue != null ? '<span><span class="insights-distribution__legend-dot" style="background:#cca300"></span>' + esc(t('EU27_2020')) + '</span>' : '') +
            '</div>' +
            '</div>';
    }

    // ---- composition stacked bar -------------------------------------------------------------

    function renderCompositionBar(components) {
        var valid = components.filter(function (c) { return c.share != null; });
        if (!valid.length) return '';
        var segments = valid.map(function (c) {
            var color = (typeof colors !== 'undefined' && colors[c.code]) || '#0E47CB';
            return '<div class="insights-composition-bar__segment" style="width:' + Math.max(0, c.share).toFixed(1) + '%;background:' + color + '" title="' + esc(t(c.code)) + ' ' + esc(formatNumber(c.share, 1)) + '%"></div>';
        }).join('');
        return '<div class="insights-composition-bar" role="img" aria-label="' + esc(t('INSIGHTS_COMPOSITION')) + '">' + segments + '</div>';
    }

    // ---- consumption-band bar chart -----------------------------------------------------------

    function renderBandBars(bands, selectedBand, ctx) {
        if (!bands || !bands.length) return '';
        var max = Math.max.apply(null, bands.map(function (b) { return b.value; }));
        if (!max) return '';
        var bars = bands.map(function (b) {
            var heightPct = Math.max(4, (b.value / max) * 100);
            var isSelected = b.band === selectedBand;
            return '<div class="insights-band-bar' + (isSelected ? ' insights-band-bar--selected' : '') + '">' +
                '<div class="insights-band-bar__fill" style="height:' + heightPct.toFixed(1) + '%" title="' + esc(formatPrice(b.value, ctx)) + '"></div>' +
                '<div class="insights-band-bar__label">' + esc(t(b.band)) + '</div>' +
                '</div>';
        }).join('');
        return '<div class="insights-band-bars">' + bars + '</div>';
    }

    // ---- price / change cards -----------------------------------------------------------------

    function renderPriceCards(data) {
        var ctx = data.context;
        var p = data.price;

        var latestCalc = p.latestValue != null
            ? esc(t(ctx.geo)) + ', ' + esc(data.latestPeriod) + ' = <strong>' + formatRaw(p.latestValue, ctx) + '</strong> ' + unitLabel(ctx)
            : null;
        var latestCard = card({
            label: t('INSIGHTS_LATEST_PRICE'),
            value: p.latestValue != null ? esc(formatPrice(p.latestValue, ctx)) : null,
            sub: esc(contextPhrase(ctx)),
            whatItIs: t('INSIGHTS_WHAT_LATEST_PRICE'),
            calculation: latestCalc,
            purpose: t('INSIGHTS_PURPOSE_LATEST_PRICE')
        });

        var semesterCalc = (p.semesterChangePct != null && p.semesterValue != null)
            ? '(' + formatRaw(p.latestValue, ctx) + ' − ' + formatRaw(p.semesterValue, ctx) + ') / |' + formatRaw(p.semesterValue, ctx) + '| × 100 = <strong>' + esc(formatPercent(p.semesterChangePct)) + '</strong>'
            : null;
        var semesterCard = card({
            label: t('INSIGHTS_SEMESTER_CHANGE'),
            value: p.semesterChangePct != null ? esc(formatPercent(p.semesterChangePct)) : null,
            sub: changeSub(p.semesterChangePct, p.semesterChangeAbs, ctx),
            whatItIs: t('INSIGHTS_WHAT_SEMESTER_CHANGE'),
            calculation: semesterCalc,
            purpose: t('INSIGHTS_PURPOSE_SEMESTER_CHANGE')
        });

        var yoyCalc = (p.yoyChangePct != null && p.yoyValue != null)
            ? '(' + formatRaw(p.latestValue, ctx) + ' − ' + formatRaw(p.yoyValue, ctx) + ') / |' + formatRaw(p.yoyValue, ctx) + '| × 100 = <strong>' + esc(formatPercent(p.yoyChangePct)) + '</strong>'
            : null;
        var yoyCard = card({
            label: t('INSIGHTS_YOY_CHANGE'),
            value: p.yoyChangePct != null ? esc(formatPercent(p.yoyChangePct)) : null,
            sub: changeSub(p.yoyChangePct, p.yoyChangeAbs, ctx),
            whatItIs: t('INSIGHTS_WHAT_YOY_CHANGE'),
            calculation: yoyCalc,
            purpose: t('INSIGHTS_PURPOSE_YOY_CHANGE')
        });

        return '<div class="insights-cards">' + latestCard + semesterCard + yoyCard + '</div>';
    }

    // ---- EU comparison / rank / median ----------------------------------------------------------

    function renderComparisonCards(data) {
        var ctx = data.context;
        var cc = data.crossCountry;
        if (!cc || cc.focusValue == null) return '';

        var euCalc = cc.euValue != null ? '(' + formatRaw(cc.focusValue, ctx) + ' − ' + formatRaw(cc.euValue, ctx) + ') / |' + formatRaw(cc.euValue, ctx) + '| × 100 = <strong>' + esc(formatPercent(cc.euGapPct)) + '</strong>' : null;
        var euCard = cc.euValue != null ? card({
            label: t('INSIGHTS_EU_COMPARISON'),
            value: esc(formatPercent(cc.euGapPct)),
            sub: esc(cc.euGapPct > 0 ? t('INSIGHTS_ABOVE_EU') : (cc.euGapPct < 0 ? t('INSIGHTS_BELOW_EU') : t('INSIGHTS_IN_LINE_EU'))),
            whatItIs: t('INSIGHTS_WHAT_EU_GAP'),
            calculation: euCalc,
            purpose: t('INSIGHTS_PURPOSE_EU_GAP')
        }) : '';

        var rankCalc = cc.rankHigh != null ? esc(String(cc.rankHigh - 1)) + ' ' + esc(t('INSIGHTS_REPORTING_COUNTRIES')) + ' &gt; ' + esc(t(ctx.geo)) + ' &rarr; <strong>' + cc.rankHigh + ' / ' + cc.n + '</strong>' : null;
        var rankSub = cc.rankHigh != null
            ? esc(t('INSIGHTS_REPORTING_COUNTRIES')) + (cc.outlier === 'high' || cc.outlier === 'low' ? ' &middot; ' + esc(t(cc.outlier === 'high' ? 'INSIGHTS_OUTLIER_HIGH' : 'INSIGHTS_OUTLIER_LOW')) : '')
            : null;
        var rankCard = cc.rankHigh != null ? card({
            label: t('INSIGHTS_COUNTRY_RANK'),
            value: esc(cc.rankHigh + ' / ' + cc.n),
            sub: rankSub,
            whatItIs: t('INSIGHTS_WHAT_RANK'),
            calculation: rankCalc,
            purpose: t('INSIGHTS_PURPOSE_RANK')
        }) : '';

        var medianCalc = cc.median != null ? '(' + formatRaw(cc.focusValue, ctx) + ' − ' + formatRaw(cc.median, ctx) + ') / |' + formatRaw(cc.median, ctx) + '| × 100 = <strong>' + esc(formatPercent(cc.medianGapPct)) + '</strong>' : null;
        var medianCard = cc.median != null ? card({
            label: t('INSIGHTS_VS_MEDIAN'),
            value: esc(formatPercent(cc.medianGapPct)),
            sub: esc(formatPrice(cc.median, ctx)),
            whatItIs: t('INSIGHTS_WHAT_MEDIAN_GAP'),
            calculation: medianCalc,
            purpose: t('INSIGHTS_PURPOSE_MEDIAN_GAP')
        }) : '';

        var cardsHtml = (euCard || rankCard || medianCard) ? '<div class="insights-cards">' + euCard + rankCard + medianCard + '</div>' : '';
        return renderDistribution(cc, ctx) + cardsHtml;
    }

    function renderRankSensitivity(data) {
        var rs = data.rankSensitivity;
        if (!rs) return '';
        var ctx = data.context;
        var items = [];
        if (rs.aboveGeo) items.push(esc(t('INSIGHTS_GAP_ABOVE')) + ' (' + esc(t(rs.aboveGeo)) + '): ' + esc(formatPrice(rs.gapAbove, ctx)));
        if (rs.belowGeo) items.push(esc(t('INSIGHTS_GAP_BELOW')) + ' (' + esc(t(rs.belowGeo)) + '): ' + esc(formatPrice(rs.gapBelow, ctx)));
        return '<p class="insights-summary">' +
            '<strong>' + esc(t('INSIGHTS_RANK_SENSITIVITY')) + ':</strong> ' +
            esc(t(rs.sensitive ? 'INSIGHTS_RANK_SENSITIVE' : 'INSIGHTS_RANK_NOT_SENSITIVE')) +
            (items.length ? '<br>' + items.join(' &middot; ') : '') +
            '</p>';
    }

    // ---- historical position ------------------------------------------------------------------

    function renderHistoryCards(data) {
        var ctx = data.context;
        var hp = data.historicalPosition;
        if (!hp) return '';

        var flags = [];
        if (hp.isNewHigh) flags.push(t('INSIGHTS_NEW_HIGH'));
        else if (hp.nearHigh) flags.push(t('INSIGHTS_NEAR_HIGH'));
        if (hp.isNewLow) flags.push(t('INSIGHTS_NEW_LOW'));
        else if (hp.nearLow) flags.push(t('INSIGHTS_NEAR_LOW'));

        var peakCard = card({
            label: t('INSIGHTS_HISTORICAL_MAX'),
            value: esc(formatPrice(hp.max, ctx)),
            sub: esc(t('INSIGHTS_PEAK_PERIOD') + ': ' + hp.peakPeriod + (hp.periodsSincePeak != null ? ' (' + hp.periodsSincePeak + ')' : '')),
            whatItIs: t('INSIGHTS_WHAT_HIST_MAX'),
            calculation: "Max(Price_t over all available semesters)",
            purpose: t('INSIGHTS_PURPOSE_HIST_MAX')
        });

        var minCard = card({
            label: t('INSIGHTS_HISTORICAL_MIN'),
            value: esc(formatPrice(hp.min, ctx)),
            whatItIs: t('INSIGHTS_WHAT_HIST_MIN'),
            calculation: "Min(Price_t over all available semesters)",
            purpose: t('INSIGHTS_PURPOSE_HIST_MIN')
        });

        var percentileValue = hp.historicalPercentile != null ? esc(Math.round(hp.historicalPercentile) + '%') : null;
        var percentileCalc = hp.historicalPercentile != null
            ? '(Count(P_hist < P_current) + 0.5 × Count(P_hist = P_current)) / N × 100 = <strong>' + Math.round(hp.historicalPercentile) + '%</strong>'
            : null;
        var percentileCard = card({
            label: t('INSIGHTS_PERCENTILE'),
            value: percentileValue,
            sub: flags.length ? flags.map(esc).join(' &middot; ') : null,
            whatItIs: t('INSIGHTS_WHAT_HIST_PERCENTILE'),
            calculation: percentileCalc,
            purpose: t('INSIGHTS_PURPOSE_HIST_PERCENTILE')
        });

        var persistent = data.persistentPosition;
        var persistentNote = '';
        if (persistent) {
            var persistentText = persistent.persistentlyHigh ? t('INSIGHTS_PERSISTENTLY_HIGH')
                : (persistent.persistentlyLow ? t('INSIGHTS_PERSISTENTLY_LOW') : t('INSIGHTS_NOT_PERSISTENT'));
            persistentNote = '<p class="insights-summary"><strong>' + esc(t('INSIGHTS_PERSISTENT_POSITION')) + ':</strong> ' + esc(persistentText) +
                ' (' + persistent.validPeriods + ' ' + esc(t('INSIGHTS_PERIOD')).toLowerCase() + 's)</p>';
        }

        return renderSparkline(data.eurHistoryForChart, ctx) +
            '<div class="insights-cards">' + peakCard + minCard + percentileCard + '</div>' +
            persistentNote;
    }

    // ---- development over time (momentum / cagr / reversal / volatility / seasonal) --------------

    function renderDevelopment(data) {
        var dev = data.development;
        if (!dev) return '';
        var ctx = data.context;
        var cards = '';

        if (dev.momentum) {
            var momentumKeyMap = {
                risingAccelerating: 'INSIGHTS_RISING_ACCELERATING', risingSlowing: 'INSIGHTS_RISING_SLOWING',
                fallingAccelerating: 'INSIGHTS_FALLING_ACCELERATING', fallingSlowing: 'INSIGHTS_FALLING_SLOWING',
                reversal: 'INSIGHTS_REVERSAL', stableYoy: 'INSIGHTS_STABLE_YOY'
            };
            cards += card({
                label: t('INSIGHTS_MOMENTUM'),
                value: esc(t(momentumKeyMap[dev.momentum.classification])),
                sub: esc(formatPercent(dev.momentum.latestYoyPct)) + ' &rarr; ' + esc(formatPercent(dev.momentum.previousYoyPct)) + ' ' + esc(t('INSIGHTS_YOY_CHANGE')).toLowerCase(),
                whatItIs: t('INSIGHTS_WHAT_MOMENTUM'),
                calculation: "YoY_latest (" + formatPercent(dev.momentum.latestYoyPct) + ") − YoY_prev (" + formatPercent(dev.momentum.previousYoyPct) + ")",
                purpose: t('INSIGHTS_PURPOSE_MOMENTUM')
            });
        }
        if (dev.cagr5 || dev.cagr2) {
            var cagr = dev.cagr5 || dev.cagr2;
            cards += card({
                label: dev.cagr5 ? t('INSIGHTS_CAGR_5Y') : t('INSIGHTS_CAGR_2Y'),
                value: esc(formatPercent(cagr.cagr)),
                sub: esc(cagr.basePeriod + ' &rarr; ' + cagr.latestPeriod),
                whatItIs: t('INSIGHTS_WHAT_CAGR'),
                calculation: '((' + formatRaw(cagr.latestValue, ctx) + ' / ' + formatRaw(cagr.baseValue, ctx) + ')<sup>1/' + cagr.years + '</sup> − 1) × 100 = <strong>' + esc(formatPercent(cagr.cagr)) + '</strong>',
                purpose: t('INSIGHTS_PURPOSE_CAGR')
            });
        }
        if (dev.volatility) {
            cards += card({
                label: t('INSIGHTS_VOLATILITY'),
                value: esc(formatNumber(dev.volatility.volatility, 1)) + ' pp',
                sub: esc(dev.volatility.n + ' ' + t('INSIGHTS_PERIOD').toLowerCase() + '-to-' + t('INSIGHTS_PERIOD').toLowerCase()),
                whatItIs: t('INSIGHTS_WHAT_VOLATILITY'),
                calculation: "Sqrt( Variance( semester % changes ) )",
                purpose: t('INSIGHTS_PURPOSE_VOLATILITY')
            });
        }
        if (dev.seasonalPattern) {
            var sp = dev.seasonalPattern;
            var seasonalNote = sp.deviation != null
                ? (Math.abs(sp.deviation) > 3 ? t('INSIGHTS_SEASONALLY_UNUSUAL') : t('INSIGHTS_SEASONALLY_TYPICAL'))
                : null;
            cards += card({
                label: t('INSIGHTS_TYPICAL_S2_PREMIUM'),
                value: esc(formatPercent(sp.typicalS2Premium)),
                sub: seasonalNote ? esc(seasonalNote) : esc(sp.sampleYears + ' years'),
                whatItIs: t('INSIGHTS_WHAT_SEASONAL'),
                calculation: "Median( (Price_S2 - Price_S1) / Price_S1 × 100 )",
                purpose: t('INSIGHTS_PURPOSE_SEASONAL')
            });
        }

        var movementNote = '';
        if (dev.consecutiveMovement && dev.consecutiveMovement.count > 1) {
            var moveKey = dev.consecutiveMovement.direction === 'increase' ? 'INSIGHTS_CONSECUTIVE_INCREASE' : 'INSIGHTS_CONSECUTIVE_DECREASE';
            movementNote += '<p class="insights-summary">' + dev.consecutiveMovement.count + ' ' + esc(t(moveKey)) + '.</p>';
        }
        if (dev.trendReversal && dev.trendReversal.reversal) {
            movementNote += '<p class="insights-summary"><i class="fas fa-arrow-right-arrow-left" aria-hidden="true"></i> ' + esc(t('INSIGHTS_TREND_REVERSAL')) + '.</p>';
        }

        return (cards ? '<div class="insights-cards">' + cards + '</div>' : '') + movementNote;
    }

    // ---- SVG Infographics (Doughnut Charts & Comparison Bar Charts) -----------------------------

    function renderDoughnutChart(components, latestPrice, ctx) {
        if (!components || !components.length) return '';
        var radius = 54;
        var circumference = 2 * Math.PI * radius;
        var offset = 0;

        var totalShare = components.reduce(function (acc, c) { return acc + (c.share || 0); }, 0) || 100;

        var circles = components.map(function (c) {
            var share = c.share || 0;
            var pct = share / totalShare;
            var dashLen = pct * circumference;
            var gapLen = circumference - dashLen;
            var color = (typeof colors !== 'undefined' && colors[c.code]) || '#0E47CB';

            var circleSvg = '<circle cx="72.5" cy="72.5" r="' + radius + '" fill="transparent" ' +
                'stroke="' + color + '" stroke-width="22" ' +
                'stroke-dasharray="' + dashLen.toFixed(2) + ' ' + gapLen.toFixed(2) + '" ' +
                'stroke-dashoffset="' + (-offset).toFixed(2) + '"></circle>';

            offset += dashLen;
            return circleSvg;
        }).join('');

        var priceText = latestPrice != null ? esc(formatPrice(latestPrice, ctx)) : '—';

        var legendItems = components.map(function (c) {
            var color = (typeof colors !== 'undefined' && colors[c.code]) || '#0E47CB';
            return '<div class="insights-donut-legend__item">' +
                '<span class="insights-donut-legend__badge">' +
                '<span class="insights-donut-legend__dot" style="background:' + color + '"></span>' +
                '<span>' + esc(t(c.code)) + '</span>' +
                '</span>' +
                '<strong>' + esc(formatNumber(c.share, 1)) + '%</strong>' +
                '</div>';
        }).join('');

        var svg = '<svg class="insights-donut-svg" viewBox="0 0 145 145" aria-hidden="true">' +
            '<circle cx="72.5" cy="72.5" r="' + radius + '" fill="transparent" stroke="#f1f5f9" stroke-width="22"></circle>' +
            circles +
            '</svg>';

        return '<div class="insights-donut-container">' +
            '<div class="insights-donut-chart">' +
            svg +
            '<div class="insights-donut-center">' +
            '<div class="insights-donut-center__val">' + priceText + '</div>' +
            '<div class="insights-donut-center__lbl">' + esc(t('INSIGHTS_TOTAL_PRICE') || 'Total') + '</div>' +
            '</div>' +
            '</div>' +
            '<div class="insights-donut-legend">' + legendItems + '</div>' +
            '</div>';
    }

    function renderEuropeDonut(snap) {
        if (!snap || !snap.reportingCountries) return '';
        var total = snap.reportingCountries;
        if (!total) return '';

        var radius = 54;
        var circumference = 2 * Math.PI * radius;

        var risingPct = snap.rising / total;
        var fallingPct = snap.falling / total;
        var stablePct = snap.stable / total;

        var risingDash = risingPct * circumference;
        var fallingDash = fallingPct * circumference;
        var stableDash = stablePct * circumference;

        var offset1 = risingDash;
        var offset2 = risingDash + fallingDash;

        var circleRising = '<circle cx="72.5" cy="72.5" r="' + radius + '" fill="transparent" stroke="#dc2626" stroke-width="20" stroke-dasharray="' + risingDash.toFixed(2) + ' ' + (circumference - risingDash).toFixed(2) + '" stroke-dashoffset="0"></circle>';
        var circleFalling = '<circle cx="72.5" cy="72.5" r="' + radius + '" fill="transparent" stroke="#16a34a" stroke-width="20" stroke-dasharray="' + fallingDash.toFixed(2) + ' ' + (circumference - fallingDash).toFixed(2) + '" stroke-dashoffset="' + (-offset1).toFixed(2) + '"></circle>';
        var circleStable = '<circle cx="72.5" cy="72.5" r="' + radius + '" fill="transparent" stroke="#2563eb" stroke-width="20" stroke-dasharray="' + stableDash.toFixed(2) + ' ' + (circumference - stableDash).toFixed(2) + '" stroke-dashoffset="' + (-offset2).toFixed(2) + '"></circle>';

        var svg = '<svg class="insights-donut-svg" viewBox="0 0 145 145" aria-hidden="true">' +
            '<circle cx="72.5" cy="72.5" r="' + radius + '" fill="transparent" stroke="#f1f5f9" stroke-width="20"></circle>' +
            circleRising + circleFalling + circleStable +
            '</svg>';

        var legendItems =
            '<div class="insights-donut-legend__item"><span class="insights-donut-legend__badge"><span class="insights-donut-legend__dot" style="background:#dc2626"></span><span>' + esc(t('INSIGHTS_RISING_COUNTRIES')) + '</span></span><strong>' + snap.rising + '</strong></div>' +
            '<div class="insights-donut-legend__item"><span class="insights-donut-legend__badge"><span class="insights-donut-legend__dot" style="background:#16a34a"></span><span>' + esc(t('INSIGHTS_FALLING_COUNTRIES')) + '</span></span><strong>' + snap.falling + '</strong></div>' +
            '<div class="insights-donut-legend__item"><span class="insights-donut-legend__badge"><span class="insights-donut-legend__dot" style="background:#2563eb"></span><span>' + esc(t('INSIGHTS_STABLE_COUNTRIES')) + '</span></span><strong>' + snap.stable + '</strong></div>';

        return '<div class="insights-donut-container">' +
            '<div class="insights-donut-chart">' +
            svg +
            '<div class="insights-donut-center">' +
            '<div class="insights-donut-center__val">' + snap.reportingCountries + '/' + snap.totalCountries + '</div>' +
            '<div class="insights-donut-center__lbl">Reporting</div>' +
            '</div>' +
            '</div>' +
            '<div class="insights-donut-legend">' + legendItems + '</div>' +
            '</div>';
    }

    function renderComparisonBarChart(cc, ctx) {
        if (!cc || cc.valA == null || cc.valB == null) return '';
        var maxVal = Math.max(cc.valA, cc.valB) || 1;

        var pctA = Math.max(5, (cc.valA / maxVal) * 100);
        var pctB = Math.max(5, (cc.valB / maxVal) * 100);

        return '<div class="insights-comparison-barchart">' +
            '<div class="insights-comparison-barchart__title">' + esc(t('INSIGHTS_DIRECT_COMPARISON')) + ' (' + unitLabel(ctx) + ')</div>' +
            '<div class="insights-comparison-barchart__row">' +
            '<span class="insights-comparison-barchart__label">' + esc(t(ctx.geo)) + '</span>' +
            '<div class="insights-comparison-barchart__track">' +
            '<div class="insights-comparison-barchart__fill" style="width:' + pctA.toFixed(1) + '%;background:var(--nav-color)"></div>' +
            '</div>' +
            '<span class="insights-comparison-barchart__value">' + esc(formatPrice(cc.valA, ctx)) + '</span>' +
            '</div>' +
            '<div class="insights-comparison-barchart__row">' +
            '<span class="insights-comparison-barchart__label">' + esc(t(cc.countryB)) + '</span>' +
            '<div class="insights-comparison-barchart__track">' +
            '<div class="insights-comparison-barchart__fill" style="width:' + pctB.toFixed(1) + '%;background:#06D7FF"></div>' +
            '</div>' +
            '<span class="insights-comparison-barchart__value">' + esc(formatPrice(cc.valB, ctx)) + '</span>' +
            '</div>' +
            '</div>';
    }

    // ---- composition ----------------------------------------------------------------------------

    function renderComposition(data) {
        var comp = data.composition;
        var ctx = data.context;
        if (!comp || !comp.hasData) {
            return '<p class="insights-no-prev">' + esc(t('INSIGHTS_NO_COMPONENT_DATA')) + '</p>';
        }

        var validComponents = comp.components.filter(function (c) { return c.latest != null; });
        var donut = renderDoughnutChart(validComponents, data.price.latestValue, ctx);
        var bar = renderCompositionBar(validComponents);

        var rows = validComponents.map(function (c) {
            var color = (typeof colors !== 'undefined' && colors[c.code]) || '#0E47CB';
            return '<div class="insights-mini-profile__item">' +
                '<span class="insights-mini-profile__label"><i class="fas fa-square" style="color:' + color + ';font-size:0.6rem;margin-right:0.3rem" aria-hidden="true"></i>' + esc(t(c.code)) + '</span>' +
                '<span class="insights-mini-profile__value">' + esc(formatPrice(c.latest, ctx)) +
                (c.share != null ? ' (' + esc(formatNumber(c.share, 1)) + '%)' : '') + '</span>' +
                '</div>';
        }).join('');

        var driverText = '';
        if (comp.dominant) {
            driverText = t(comp.dominant.deltaYoy >= 0 ? 'INSIGHTS_MAIN_UPWARD_DRIVER' : 'INSIGHTS_MAIN_DOWNWARD_DRIVER') + ': ' + t(comp.dominant.code);
        } else if (comp.mainUpward || comp.mainDownward) {
            var parts = [];
            if (comp.mainUpward) parts.push(t('INSIGHTS_MAIN_UPWARD_DRIVER') + ': ' + t(comp.mainUpward.code));
            if (comp.mainDownward) parts.push(t('INSIGHTS_MAIN_DOWNWARD_DRIVER') + ': ' + t(comp.mainDownward.code));
            driverText = parts.join(' · ');
        } else {
            driverText = t('INSIGHTS_MIXED_MOVEMENT');
        }

        var globalSummary = data.globalComponentSummary;
        var globalHtml = '';
        if (globalSummary && globalSummary.available && globalSummary.mostDivergent) {
            var g = globalSummary.mostDivergent;
            globalHtml = card({
                label: t('INSIGHTS_MOST_DIVERGENT_COMPONENT') + ' (' + t('INSIGHTS_GLOBAL_COMPONENT') + ')',
                value: esc(t(g.code)),
                sub: esc(formatNumber(g.focusShare, 1)) + '% ' + esc(t(ctx.geo)) + ' vs ' + esc(formatNumber(g.euShare, 1)) + '% ' + esc(t('EU27_2020')),
                whatItIs: "The price component showing the largest share percentage divergence from the EU27 average composition.",
                calculation: "Max( |Share_focus - Share_EU27| )",
                purpose: "Identifies unique national component cost drivers compared to Europe."
            });
            globalHtml = '<div class="insights-cards">' + globalHtml + '</div>';
        }

        return donut + bar +
            '<div class="insights-mini-profile">' + rows + '</div>' +
            '<p class="insights-summary" title="' + esc(t('INSIGHTS_EXPLAIN_MAIN_DRIVER')) + '">' + esc(driverText) + '</p>' +
            globalHtml;
    }

    // ---- fiscal effect ----------------------------------------------------------------------------

    function renderFiscalEffect(data) {
        var fe = data.fiscalEffect;
        var ctx = data.context;
        if (!fe || fe.classification === 'unavailable') {
            return '<p class="insights-no-prev">' + esc(t('INSIGHTS_FISCAL_UNAVAILABLE')) + '</p>';
        }

        var classificationKeyMap = {
            cushioned: 'INSIGHTS_FISCAL_CUSHIONED', amplified: 'INSIGHTS_FISCAL_AMPLIFIED',
            offsetDecrease: 'INSIGHTS_FISCAL_OFFSET_DECREASE', oppositeUp: 'INSIGHTS_FISCAL_OPPOSITE_UP',
            oppositeDown: 'INSIGHTS_FISCAL_OPPOSITE_DOWN', neutral: 'INSIGHTS_FISCAL_NEUTRAL'
        };

        var preTaxCard = card({
            label: t('INSIGHTS_PRETAX_CHANGE'),
            value: esc(formatPrice(fe.deltaPreTax, ctx)),
            whatItIs: t('INSIGHTS_WHAT_PRETAX'),
            calculation: "Price_preTax_latest − Price_preTax_prior = <strong>" + formatRaw(fe.deltaPreTax, ctx) + "</strong>",
            purpose: t('INSIGHTS_PURPOSE_PRETAX')
        });

        var finalCard = card({
            label: t('INSIGHTS_FINAL_CHANGE'),
            value: esc(formatPrice(fe.deltaFinal, ctx)),
            whatItIs: t('INSIGHTS_WHAT_FINAL'),
            calculation: "Price_final_latest − Price_final_prior = <strong>" + formatRaw(fe.deltaFinal, ctx) + "</strong>",
            purpose: t('INSIGHTS_PURPOSE_FINAL')
        });

        return '<div class="insights-cards">' + preTaxCard + finalCard + '</div>' +
            '<p class="insights-summary">' + esc(t(classificationKeyMap[fe.classification] || 'INSIGHTS_FISCAL_NEUTRAL')) + '</p>';
    }

    // ---- PPS perspective -----------------------------------------------------------------------------

    function renderPpsPerspective(data) {
        var rs = data.rankShift;
        if (!rs || !rs.available) {
            return '<p class="insights-no-prev">' + esc(t('INSIGHTS_PPS_UNAVAILABLE')) + '</p>';
        }
        var classificationKeyMap = { higherInPps: 'INSIGHTS_PPS_HIGHER', lowerInPps: 'INSIGHTS_PPS_LOWER', similar: 'INSIGHTS_PPS_SIMILAR' };

        var eurCard = card({
            label: t('INSIGHTS_EUR_RANK'),
            value: esc(rs.rankEur + ' / ' + rs.cohortSize),
            whatItIs: t('INSIGHTS_WHAT_EUR_RANK'),
            calculation: "Rank in EUR panel",
            purpose: t('INSIGHTS_PURPOSE_EUR_RANK')
        });

        var ppsCard = card({
            label: t('INSIGHTS_PPS_RANK'),
            value: esc(rs.rankPps + ' / ' + rs.cohortSize),
            whatItIs: t('INSIGHTS_WHAT_PPS_RANK'),
            calculation: "Rank in PPS panel",
            purpose: t('INSIGHTS_PURPOSE_PPS_RANK')
        });

        var shiftCard = card({
            label: t('INSIGHTS_RANK_SHIFT'),
            value: esc((rs.shift > 0 ? '+' : '') + rs.shift),
            whatItIs: t('INSIGHTS_WHAT_RANK_SHIFT'),
            calculation: "Rank_EUR (" + rs.rankEur + ") − Rank_PPS (" + rs.rankPps + ") = <strong>" + ((rs.shift > 0 ? '+' : '') + rs.shift) + "</strong>",
            purpose: t('INSIGHTS_PURPOSE_RANK_SHIFT')
        });

        return '<div class="insights-cards">' + eurCard + ppsCard + shiftCard + '</div>' +
            '<p class="insights-summary">' + esc(t(classificationKeyMap[rs.classification] || 'INSIGHTS_PPS_SIMILAR')) + '</p>';
    }

    // ---- Europe at a glance -----------------------------------------------------------------------------

    function renderEuropeSnapshot(data) {
        var snap = data.europeSnapshot;
        var ctx = data.context;
        if (!snap || !snap.reportingCountries) return '';

        var donut = renderEuropeDonut(snap);

        var directionCard = card({
            label: t('INSIGHTS_DISPERSION'),
            value: snap.dispersionChangePct != null ? esc(formatPercent(snap.dispersionChangePct)) : null,
            sub: snap.dispersionClassification !== 'unknown'
                ? esc(t(snap.dispersionClassification === 'converging' ? 'INSIGHTS_CONVERGING' : (snap.dispersionClassification === 'diverging' ? 'INSIGHTS_DIVERGING' : 'INSIGHTS_DISPERSION_STABLE')))
                : null,
            whatItIs: t('INSIGHTS_WHAT_DISPERSION'),
            calculation: "(IQR_latest − IQR_prior) / IQR_prior × 100",
            purpose: t('INSIGHTS_PURPOSE_DISPERSION')
        });

        var movers = snap.topRising.slice(0, 3).map(function (r) {
            return '<span class="insight-rank-item"><span class="insight-rank-up">▲</span> ' + esc(t(r.geo)) + ' ' + esc(formatPercent(r.yoyPct)) + '</span>';
        }).concat(snap.topFalling.slice(0, 3).map(function (r) {
            return '<span class="insight-rank-item"><span class="insight-rank-down">▼</span> ' + esc(t(r.geo)) + ' ' + esc(formatPercent(r.yoyPct)) + '</span>';
        })).join(' ');

        return donut +
            '<div class="insights-cards">' + directionCard + '</div>' +
            (movers ? '<div class="insights-rank-movement"><div class="insights-rank-movement__label">' + esc(t('INSIGHTS_TOP_MOVERS')) + '</div>' +
                '<div class="insights-rank-movement__items">' + movers + '</div></div>' : '');
    }

    // ---- consumption band ------------------------------------------------------------------------------

    function renderBandSection(data) {
        var bp = data.bandPattern;
        var ctx = data.context;
        if (!bp) return '';

        var patternKeyMap = { increasing: 'INSIGHTS_PATTERN_INCREASING', decreasing: 'INSIGHTS_PATTERN_DECREASING', flat: 'INSIGHTS_PATTERN_FLAT', mixed: 'INSIGHTS_PATTERN_MIXED' };
        var bars = renderBandBars(bp.bands, ctx.band, ctx);

        var premiumCard = (bp.referenceValue != null && bp.selectedBand !== bp.referenceBand) ? card({
            label: t('INSIGHTS_BAND_PREMIUM'),
            value: esc(formatPercent(bp.bandGapPct)),
            sub: esc(t(ctx.band) + ' vs ' + t(bp.referenceBand)),
            whatItIs: t('INSIGHTS_WHAT_BAND_PREMIUM'),
            calculation: '(' + formatRaw(bp.selectedValue, ctx) + ' − ' + formatRaw(bp.referenceValue, ctx) + ') / |' + formatRaw(bp.referenceValue, ctx) + '| × 100 = <strong>' + esc(formatPercent(bp.bandGapPct)) + '</strong>',
            purpose: t('INSIGHTS_PURPOSE_BAND_PREMIUM')
        }) : '';

        var patternCard = card({
            label: t('INSIGHTS_BAND_PATTERN'),
            value: esc(t(patternKeyMap[bp.pattern])),
            whatItIs: t('INSIGHTS_WHAT_BAND_PATTERN'),
            calculation: "Evaluation of monotonicity across ordered consumption bands",
            purpose: t('INSIGHTS_PURPOSE_BAND_PATTERN')
        });

        var spread = data.bandSpreadOverTime;
        var spreadHtml = '';
        if (spread) {
            var spreadKeyMap = { widened: 'INSIGHTS_SPREAD_WIDENED', narrowed: 'INSIGHTS_SPREAD_NARROWED', stable: 'INSIGHTS_SPREAD_STABLE' };
            spreadHtml = card({
                label: t('INSIGHTS_BAND_SPREAD_TITLE'),
                value: esc(formatPrice(spread.latestSpread, ctx)),
                sub: spread.classification !== 'unavailable' ? esc(t(spreadKeyMap[spread.classification])) : null,
                whatItIs: t('INSIGHTS_WHAT_BAND_PREMIUM'),
                calculation: "Price_highestBand − Price_lowestBand = <strong>" + formatRaw(spread.latestSpread, ctx) + "</strong>",
                purpose: t('INSIGHTS_PURPOSE_BAND_PREMIUM')
            });
        }

        return bars + '<div class="insights-cards">' + patternCard + premiumCard + spreadHtml + '</div>';
    }

    // ---- related context: inflation --------------------------------------------------------------------

    function renderInflationContext(data) {
        var ic = data.inflationComparison;
        if (!ic) return '';
        var energyCard = card({
            label: t('INSIGHTS_ENERGY_YOY'),
            value: esc(formatPercent(ic.energyYoyPct)),
            whatItIs: t('INSIGHTS_WHAT_HICP_ENERGY'),
            calculation: "Energy YoY %",
            purpose: t('INSIGHTS_PURPOSE_HICP_ENERGY')
        });
        var hicpCard = card({
            label: t('INSIGHTS_HICP_YOY'),
            value: esc(formatPercent(ic.hicpYoyPct)),
            sub: esc(ic.month),
            whatItIs: t('INSIGHTS_WHAT_HICP_ALL'),
            calculation: "HICP RCH_A series rate",
            purpose: t('INSIGHTS_PURPOSE_HICP_ALL')
        });
        var gapCard = card({
            label: t('INSIGHTS_INFLATION_CONTEXT'),
            value: esc(formatPercent(ic.gap)) + ' pp',
            whatItIs: t('INSIGHTS_WHAT_INFLATION_GAP'),
            calculation: "Energy_YoY% (" + formatPercent(ic.energyYoyPct) + ") − HICP_YoY% (" + formatPercent(ic.hicpYoyPct) + ") = <strong>" + formatPercent(ic.gap) + " pp</strong>",
            purpose: t('INSIGHTS_PURPOSE_INFLATION_GAP')
        });
        return '<div class="insights-cards">' + energyCard + hicpCard + gapCard + '</div>' +
            '<p class="insights-note"><i class="fas fa-circle-info" aria-hidden="true"></i> ' + esc(t('INSIGHTS_RELATED_CONTEXT_NOTE')) + '</p>';
    }

    // ---- data quality / freshness / anomalies -----------------------------------------------------------

    // ---- data quality / freshness / safeguards / provenance ---------------------------------------------

    function renderDataQuality(data) {
        var dq = data.dataQuality;
        var prov = dq.provenance;
        var ctx = data.context;

        var statusText = dq.isProvisional ? t('INSIGHTS_PROVISIONAL')
            : (dq.isEstimated ? t('INSIGHTS_ESTIMATED') : t('INSIGHTS_STATUS_NORMAL'));

        var statusCard = card({
            label: t('INSIGHTS_DATA_STATUS'),
            value: esc(dq.latestStatus ? 'Flag: [' + dq.latestStatus + ']' : 'Final'),
            sub: esc(statusText),
            explanation: t('INSIGHTS_PROVISIONAL')
        });

        var anomalyText = (dq.anomalies && dq.anomalies.length > 0)
            ? dq.anomalies.map(function (a) { return t('INSIGHTS_ANOMALY_' + a.toUpperCase()); }).join(', ')
            : t('INSIGHTS_SAFEGUARD_OK');

        var safeguardCard = card({
            label: t('INSIGHTS_ANOMALY_CHECK'),
            value: (dq.anomalies && dq.anomalies.length > 0) ? 'Flagged' : 'Passed',
            sub: esc(anomalyText),
            explanation: t('INSIGHTS_ANOMALY_CHECK')
        });

        var provSub = prov ? (
            esc(t('INSIGHTS_DATASET_PRICE_NOTE')) + ': <strong>' + esc(prov.priceDataset) + '</strong> (' + esc(prov.pricePeriod) + ') &bull; ' +
            esc(t('INSIGHTS_DATASET_COMPONENT_NOTE')) + ': <strong>' + esc(prov.componentDataset) + '</strong> (' + esc(prov.componentPeriod) + ')'
        ) : '—';

        var priceDs = prov ? prov.priceDataset : 'nrg_pc_204';
        var compDs = prov ? prov.componentDataset : 'nrg_pc_204_c';

        var provenanceCard = card({
            label: t('INSIGHTS_DATASET_PROVENANCE'),
            value: esc(priceDs + ' vs ' + compDs),
            sub: provSub,
            whatItIs: "Methodological reconciliation between bi-annual total prices (" + priceDs + ": S1 & S2) and annual disaggregated component breakdowns (" + compDs + ": Energy, Network, Taxes).",
            calculation: priceDs + " (Bi-annual total) vs " + compDs + " (Annual structural components: Energy + Network + Taxes)",
            purpose: "Guides proper cross-referencing between bi-annual trend tracking and annual structural cost driver analysis."
        });

        var datasetReconciliationBox = '<div class="insights-summary" style="margin-top:0.75rem">' +
            '<strong><i class="fas fa-database" aria-hidden="true"></i> Dataset Reconciliation (' + esc(priceDs) + ' vs ' + esc(compDs) + '):</strong> ' +
            '<span>' + esc(priceDs) + ' tracks bi-annual price trends (S1 & S2), while ' + esc(compDs) + ' disaggregates annual structural cost drivers (Energy, Network, Taxes). Use ' + esc(priceDs) + ' for short-term price momentum and ' + esc(compDs) + ' to explain structural tariff shifts. Minor discrepancies in component sums occur due to national volume weighting and policy support cost allocations.</span>' +
            '</div>';

        var consumerQualBox = '<div class="insights-summary" style="margin-top:0.5rem">' +
            '<strong><i class="fas fa-users" aria-hidden="true"></i> ' + esc(t('INSIGHTS_CONSUMER_QUALIFICATION')) + ' (' + esc(t(ctx.consumer)) + '):</strong> ' +
            esc(t('INSIGHTS_CONSUMER_QUALIFICATION_DESC')) +
            '</div>';

        return '<div class="insights-cards">' + statusCard + safeguardCard + provenanceCard + '</div>' + datasetReconciliationBox + consumerQualBox;
    }

    // ---- export toolbar & interactive consumer tools ---------------------------------------------------

    function renderToolbar() {
        return '<div class="insights-toolbar">' +
            '<div class="insights-toolbar__group">' +
            '<button type="button" class="insight-btn" onclick="insightsRenderNameSpace.copyText()"><i class="fas fa-copy" aria-hidden="true"></i> <span>' + esc(t('INSIGHTS_COPY_TEXT')) + '</span></button>' +
            '<button type="button" class="insight-btn" onclick="insightsRenderNameSpace.exportCsv()"><i class="fas fa-file-csv" aria-hidden="true"></i> <span>' + esc(t('INSIGHTS_EXPORT_CSV')) + '</span></button>' +
            '<button type="button" class="insight-btn" onclick="copyUrl()"><i class="fas fa-share-nodes" aria-hidden="true"></i> <span>' + esc(t('SHARE')) + '</span></button>' +
            '</div>' +
            '</div>';
    }

    function getDefaultConsumption(ctx) {
        if (ctx.consumer === 'N_HOUSEHOLD') {
            return ctx.unit === 'GJ_GCV' ? 5000 : (ctx.unit === 'MWH' ? 500 : 500000);
        }
        return ctx.unit === 'GJ_GCV' ? 50 : (ctx.unit === 'MWH' ? 3.5 : 3500);
    }

    function renderEstimatorAndBandFinder(data) {
        var ctx = data.context;
        var currentConsumption = userConsumption !== null ? userConsumption : getDefaultConsumption(ctx);
        var unitName = esc(t('S_' + ctx.unit));

        var cost = insightsDataNameSpace.computeAnnualCost(data.price.latestValue, currentConsumption);
        var costFormatted = cost !== null ? formatPrice(cost, ctx) : '—';
        var stepText = formatRaw(currentConsumption, ctx) + ' ' + unitName + ' &times; ' + formatRaw(data.price.latestValue, ctx) + ' ' + unitLabel(ctx);

        var estimatorCard = '<div class="insights-widget-card">' +
            '<div class="insights-widget-card__title"><i class="fas fa-calculator" aria-hidden="true"></i> ' + esc(t('INSIGHTS_COST_ESTIMATOR')) + '</div>' +
            '<div class="insights-input-group">' +
            '<label for="insightConsumptionInput" class="sr-only">' + esc(t('INSIGHTS_ANNUAL_CONSUMPTION')) + '</label>' +
            '<input type="number" id="insightConsumptionInput" class="insight-input" value="' + currentConsumption + '" step="any" min="0" onchange="insightsRenderNameSpace.onConsumptionChange(this.value)">' +
            '<span>' + unitName + ' / ' + esc(t('INSIGHTS_PERIOD').toLowerCase()) + '</span>' +
            '</div>' +
            '<div class="insights-widget-result">' + esc(t('INSIGHTS_ESTIMATED_COST')) + ': <strong>' + esc(costFormatted) + '</strong></div>' +
            '<div class="insights-widget-sub">' + stepText + '</div>' +
            '<p class="insight-card__note" style="margin-top:0.4rem">' + esc(t('INSIGHTS_COST_DISCLAIMER')) + '</p>' +
            '</div>';

        var bandRows = data.bandPattern ? data.bandPattern.bands : [];
        var matched = insightsDataNameSpace.findBandForConsumption(bandRows, currentConsumption);
        var finderSub = matched ? esc(t('INSIGHTS_MATCHING_BAND')) + ': <strong>' + esc(t(matched.band)) + '</strong>' : esc(t('INSIGHTS_NOT_AVAILABLE'));
        var isCurrent = matched && matched.band === ctx.band;

        var switchBtn = (matched && !isCurrent)
            ? '<button type="button" class="insight-btn insight-btn--sm" style="margin-top:0.4rem" onclick="insightsRenderNameSpace.switchBand(\'' + matched.band + '\')"><i class="fas fa-exchange-alt" aria-hidden="true"></i> ' + esc(t('INSIGHTS_SWITCH_BAND')) + '</button>'
            : (isCurrent ? '<span class="insight-badge insight-stable" style="margin-top:0.4rem"><i class="fas fa-check" aria-hidden="true"></i> ' + esc(t('INSIGHTS_BAND')) + ' ' + esc(t('INSIGHTS_STABLE')) + '</span>' : '');

        var finderCard = '<div class="insights-widget-card">' +
            '<div class="insights-widget-card__title"><i class="fas fa-filter" aria-hidden="true"></i> ' + esc(t('INSIGHTS_BAND_FINDER')) + '</div>' +
            '<div class="insights-widget-result" style="font-size:0.9rem">' + finderSub + '</div>' +
            switchBtn +
            '</div>';

        return '<div class="insights-widget-row">' + estimatorCard + finderCard + '</div>';
    }

    function renderCountryComparisonSection(data) {
        var ctx = data.context;
        var countryList = Object.keys(energyCountries).filter(function (g) {
            return g !== ctx.geo && g !== 'EU27_2020' && g !== 'EA';
        });

        var optionsHtml = countryList.map(function (g) {
            var selected = g === selectedCountryB ? ' selected' : '';
            return '<option value="' + g + '"' + selected + '>' + esc(t(g)) + ' (' + g + ')</option>';
        }).join('');

        var selectorHtml = '<div class="insights-input-group">' +
            '<label for="insightCountryBSelect" style="font-size:0.82rem;font-weight:600;color:#4c5563">' + esc(t('INSIGHTS_COMPARE_WITH')) + ':</label>' +
            '<select id="insightCountryBSelect" class="insight-select" onchange="insightsRenderNameSpace.onCountryBChange(this.value)">' +
            '<option value="">-- ' + esc(t('INSIGHTS_COMPARE_WITH')) + ' --</option>' +
            optionsHtml +
            '</select>' +
            '</div>';

        var cc = data.countryComparison;
        var comparisonBody = '';
        if (cc) {
            var barChart = renderComparisonBarChart(cc, ctx);
            var valACard = card({ label: t(ctx.geo), value: esc(formatPrice(cc.valA, ctx)) });
            var valBCard = card({ label: t(cc.countryB), value: esc(formatPrice(cc.valB, ctx)) });
            var gapCard = card({
                label: t('INSIGHTS_COUNTRY_GAP'),
                value: esc(formatPercent(cc.gapPct)),
                sub: esc(formatPrice(cc.gapAbs, ctx)) + ' (' + esc(cc.gapAbs > 0 ? t(ctx.geo) : t(cc.countryB)) + ' ' + esc(t('INSIGHTS_RISING').toLowerCase()) + ')'
            });

            var driverText = cc.mainDriver ? esc(t('INSIGHTS_MAIN_GAP_DRIVER')) + ': <strong>' + esc(t(cc.mainDriver.code)) + '</strong> (' + esc(formatPrice(cc.mainDriver.gap, ctx)) + ')' : '';

            comparisonBody = barChart + '<div class="insights-cards">' + valACard + valBCard + gapCard + '</div>' +
                (driverText ? '<p class="insights-summary">' + driverText + '</p>' : '');
        }

        return selectorHtml + comparisonBody;
    }

    // ---- top-level render -------------------------------------------------------------------------------

    var cachedData = null;
    var userConsumption = null;
    var selectedCountryB = null;

    function render(data) {
        cachedData = data;
        cardIdCounter = 0;

        var priceInfo = {
            whatItIs: t('INSIGHTS_EXPLAIN_LATEST_PRICE'),
            calculation: "Latest Price: Eurostat published dataset &bull; Semester Change: (P_S2 − P_S1) / P_S1 × 100 &bull; YoY Change: (P_t − P_t-1y) / P_t-1y × 100",
            purpose: t('INSIGHTS_PURPOSE_LATEST_PRICE')
        };

        var euInfo = {
            whatItIs: t('INSIGHTS_EXPLAIN_EU_COMPARISON'),
            calculation: "EU Gap %: (P_focus − P_EU27) / P_EU27 × 100 &bull; Country Rank: 1 + Count(P > P_focus) &bull; Median Gap: (P_focus − Median) / Median × 100",
            purpose: t('INSIGHTS_PURPOSE_EU_GAP')
        };

        var directInfo = {
            whatItIs: t('INSIGHTS_EXPLAIN_COUNTRY_COMPARISON'),
            calculation: "Price Gap: (P_A − P_B) / P_B × 100 &bull; YoY Growth: YoY_A vs YoY_B &bull; Main Driver: Max( |Component_A − Component_B| )",
            purpose: t('INSIGHTS_PURPOSE_RANK')
        };

        var historyInfo = {
            whatItIs: t('INSIGHTS_EXPLAIN_HISTORICAL'),
            calculation: "Peak: Max(P_t) &bull; Minimum: Min(P_t) &bull; Percentile: (Count(P_hist < P_current) + 0.5 × Count(P_hist = P_current)) / N × 100",
            purpose: t('INSIGHTS_PURPOSE_HIST_MAX')
        };

        var devInfo = {
            whatItIs: t('INSIGHTS_EXPLAIN_DEVELOPMENT'),
            calculation: "Momentum: YoY_t − YoY_t-1 &bull; 5Y CAGR: ((P_t / P_t-5y)^(1/5) − 1) × 100 &bull; Volatility: Standard deviation of 10-semester returns",
            purpose: t('INSIGHTS_PURPOSE_MOMENTUM')
        };

        var compInfo = {
            whatItIs: t('INSIGHTS_EXPLAIN_COMPOSITION'),
            calculation: "Component Shares: Component_val / Total_price × 100 &bull; Main Driver: Max( |Delta_Component| )",
            purpose: t('INSIGHTS_PURPOSE_PRETAX')
        };

        var fiscalInfo = {
            whatItIs: t('INSIGHTS_EXPLAIN_FISCAL'),
            calculation: "Fiscal Effect = Delta_FinalPrice − Delta_PreTaxPrice",
            purpose: t('INSIGHTS_PURPOSE_FINAL')
        };

        var ppsInfo = {
            whatItIs: t('INSIGHTS_EXPLAIN_PPS'),
            calculation: "PPS Rank Shift = Rank_EUR − Rank_PPS",
            purpose: t('INSIGHTS_PURPOSE_RANK_SHIFT')
        };

        var europeInfo = {
            whatItIs: t('INSIGHTS_EXPLAIN_EUROPE'),
            calculation: "Counts of rising/falling countries & Dispersion Change = (IQR_latest − IQR_prior) / IQR_prior × 100",
            purpose: t('INSIGHTS_PURPOSE_DISPERSION')
        };

        var bandInfo = {
            whatItIs: t('INSIGHTS_EXPLAIN_BAND'),
            calculation: "Band Premium = (P_band − P_ref) / P_ref × 100 &bull; Spread = P_highestBand − P_lowestBand",
            purpose: t('INSIGHTS_PURPOSE_BAND_PATTERN')
        };

        var inflationInfo = {
            whatItIs: t('INSIGHTS_EXPLAIN_HICP'),
            calculation: "Inflation Gap = Energy_YoY% − HICP_YoY%",
            purpose: t('INSIGHTS_PURPOSE_INFLATION_GAP')
        };

        var qualityInfo = {
            whatItIs: t('INSIGHTS_EXPLAIN_PROVENANCE'),
            calculation: "Status inspection ('p'/'e'), anomaly validation (P > 0, |YoY%| < 200%), and dataset mapping",
            purpose: t('INSIGHTS_PURPOSE_PROVENANCE')
        };

        var html = '<div class="insights-panel" tabindex="-1">' +
            renderToolbar() +
            renderContext(data.context, data.latestPeriod) +
            renderEstimatorAndBandFinder(data) +
            '<div class="insights-sections">' +
            section('fa-euro-sign', t('INSIGHTS_LATEST_PRICE'), renderPriceCards(data), priceInfo) +
            section('fa-globe-europe', t('INSIGHTS_EU_COMPARISON'), renderComparisonCards(data) + renderRankSensitivity(data), euInfo) +
            section('fa-exchange-alt', t('INSIGHTS_DIRECT_COMPARISON'), renderCountryComparisonSection(data), directInfo) +
            section('fa-history', t('INSIGHTS_HISTORICAL_POSITION'), renderHistoryCards(data), historyInfo) +
            section('fa-chart-line', t('INSIGHTS_DEVELOPMENT'), renderDevelopment(data), devInfo) +
            section('fa-chart-pie', t('INSIGHTS_COMPOSITION'), renderComposition(data), compInfo) +
            section('fa-balance-scale', t('INSIGHTS_FISCAL_EFFECT'), renderFiscalEffect(data), fiscalInfo) +
            section('fa-coins', t('INSIGHTS_PPS_PERSPECTIVE'), renderPpsPerspective(data), ppsInfo) +
            section('fa-globe-europe', t('INSIGHTS_EUROPE_SNAPSHOT'), renderEuropeSnapshot(data), europeInfo) +
            section('fa-bolt', t('INSIGHTS_BAND_PATTERN'), renderBandSection(data), bandInfo) +
            section('fa-chart-bar', t('INSIGHTS_INFLATION_CONTEXT'), renderInflationContext(data), inflationInfo) +
            section('fa-shield-alt', t('INSIGHTS_DATA_QUALITY_TITLE'), renderDataQuality(data), qualityInfo) +
            '</div>' +
            '</div>';

        $('#insightsViewBody').html(html);
    }

    function renderLoading() {
        $('#insightsViewBody').html('<p class="insights-no-prev"><i class="fas fa-spinner fa-spin" aria-hidden="true"></i> ' + esc(t('INSIGHTS_LOADING')) + '</p>');
    }

    function renderError() {
        $('#insightsViewBody').html('<p class="insights-no-prev"><i class="fas fa-triangle-exclamation" aria-hidden="true"></i> ' + esc(t('INSIGHTS_ERROR')) + '</p>');
    }

    function load() {
        var requestId = ++currentRequestId;
        renderLoading();

        insightsDataNameSpace.computeSelectedViewInsights({ countryB: selectedCountryB }).then(function (data) {
            if (requestId !== currentRequestId) return;
            render(data);
        }).catch(function (err) {
            if (requestId !== currentRequestId) return;
            console.error('[insights] failed to compute insights', err);
            renderError();
        });
    }

    function onConsumptionChange(val) {
        userConsumption = parseFloat(val);
        if (cachedData) render(cachedData);
    }

    function onCountryBChange(val) {
        selectedCountryB = val;
        load();
    }

    function switchBand(newBand) {
        if (typeof REF !== 'undefined') {
            REF.consoms = newBand;
            if (typeof populateConsumption !== 'undefined') {
                populateConsumption();
            }
            load();
        }
    }

    function exportCsv() {
        if (!cachedData) return;
        var d = cachedData;
        var rows = [
            ['Metric', 'Geography', 'Period', 'Value', 'Unit'],
            ['Latest Price', d.context.geo, d.latestPeriod, d.price.latestValue, d.context.unit],
            ['YoY Change %', d.context.geo, d.latestPeriod, d.price.yoyChangePct, '%'],
            ['Semester Change %', d.context.geo, d.latestPeriod, d.price.semesterChangePct, '%'],
            ['EU Gap %', d.context.geo, d.latestPeriod, d.crossCountry.euGapPct, '%'],
            ['Country Rank', d.context.geo, d.latestPeriod, d.crossCountry.rankHigh + '/' + d.crossCountry.n, 'rank'],
            ['Historical Max', d.context.geo, d.historicalPosition ? d.historicalPosition.peakPeriod : '', d.historicalPosition ? d.historicalPosition.max : '', d.context.unit],
            ['Historical Min', d.context.geo, d.latestPeriod, d.historicalPosition ? d.historicalPosition.min : '', d.context.unit]
        ];

        var csvContent = 'data:text/csv;charset=utf-8,' + rows.map(function (e) { return e.join(','); }).join('\n');
        var encodedUri = encodeURI(csvContent);
        var link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'insights_' + d.context.geo + '_' + d.latestPeriod + '.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function copyText() {
        if (!cachedData) return;
        var d = cachedData;
        var summary = 'ENPRICES Insights Summary (' + d.context.geo + ' - ' + d.latestPeriod + ')\n' +
            'Product: ' + t(d.context.product) + ' (' + t(d.context.consumer) + ')\n' +
            'Latest Price: ' + formatPrice(d.price.latestValue, d.context) + '\n' +
            'YoY Change: ' + formatPercent(d.price.yoyChangePct) + '\n' +
            'EU Comparison: ' + formatPercent(d.crossCountry.euGapPct) + ' vs EU27 average\n' +
            'Country Rank: ' + d.crossCountry.rankHigh + ' / ' + d.crossCountry.n + ' reporting countries\n';

        if (navigator.clipboard) {
            navigator.clipboard.writeText(summary).then(function () {
                alert(t('INSIGHTS_COPIED'));
            });
        }
    }

    var lastActiveElement = null;

    function openModal(btnElem) {
        if ($('#insightInfoPopup').length) {
            closeModal();
            if (lastActiveElement === btnElem) return;
        }

        lastActiveElement = btnElem || document.activeElement;
        var title = $(btnElem).attr('data-title') || t('INSIGHTS_HOW_CALCULATED');
        var what = $(btnElem).attr('data-what') || '';
        var calc = $(btnElem).attr('data-calc') || '';
        var purpose = $(btnElem).attr('data-purpose') || '';
        var closeText = t('CLOSE') || 'Close';

        var rect = btnElem ? btnElem.getBoundingClientRect() : { top: 100, left: 100, bottom: 120, right: 120 };
        var popoverWidth = Math.min(420, window.innerWidth - 32);
        
        var top = rect.bottom + window.scrollY + 6;
        var left = rect.left + window.scrollX - 10;

        if (left + popoverWidth > window.innerWidth + window.scrollX - 16) {
            left = window.innerWidth + window.scrollX - popoverWidth - 16;
        }
        if (left < window.scrollX + 16) {
            left = window.scrollX + 16;
        }

        var popoverStyle = 'top:' + Math.round(top) + 'px;left:' + Math.round(left) + 'px;width:' + Math.round(popoverWidth) + 'px;';

        var popupHtml =
            '<div class="insight-popover-card" id="insightInfoPopup" style="' + popoverStyle + '" role="region" aria-label="' + esc(title) + '" tabindex="-1">' +
            '<div class="insight-popover-card__header">' +
            '<h4 class="insight-popover-card__title"><i class="fas fa-info-circle" aria-hidden="true"></i> ' + esc(title) + '</h4>' +
            '<button type="button" class="insight-popover-card__close" onclick="insightsRenderNameSpace.closeModal()" aria-label="' + esc(closeText) + '">&times;</button>' +
            '</div>' +
            '<div class="insight-popover-card__body">' +
            (what ? '<div class="insight-popover-card__item"><strong><i class="fas fa-question-circle" aria-hidden="true"></i> ' + esc(t('INSIGHTS_WHAT_IT_IS')) + ':</strong> ' + esc(what) + '</div>' : '') +
            (calc ? '<div class="insight-popover-card__item"><strong><i class="fas fa-calculator" aria-hidden="true"></i> ' + esc(t('INSIGHTS_CALCULATION')) + ':</strong> <span>' + calc + '</span></div>' : '') +
            (purpose ? '<div class="insight-popover-card__item"><strong><i class="fas fa-bullseye" aria-hidden="true"></i> ' + esc(t('INSIGHTS_PURPOSE')) + ':</strong> ' + esc(purpose) + '</div>' : '') +
            '</div>' +
            '</div>';

        $('#insightInfoPopup').remove();
        $('body').append(popupHtml);

        var popupElem = $('#insightInfoPopup');
        popupElem.focus();

        setTimeout(function () {
            $(document).off('click.insightPopup').on('click.insightPopup', function (e) {
                if (!$(e.target).closest('#insightInfoPopup, .insight-card__info-btn').length) {
                    closeModal();
                }
            });
        }, 10);

        $(document).off('keydown.insightPopup').on('keydown.insightPopup', function (e) {
            if (e.key === 'Escape' || e.keyCode === 27) {
                e.preventDefault();
                e.stopPropagation();
                if (typeof e.stopImmediatePropagation === 'function') {
                    e.stopImmediatePropagation();
                }
                closeModal();
            }
        });
    }

    function closeModal() {
        var popup = $('#insightInfoPopup');
        if (popup.length) {
            popup.fadeOut(100, function () {
                popup.remove();
                if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
                    lastActiveElement.focus();
                }
            });
        }
        $(document).off('keydown.insightPopup click.insightPopup');
    }

    function handleModalOverlayClick(e) {
        if (e.target && e.target.id === 'insightInfoModal') {
            closeModal();
        }
    }

    return {
        load: load,
        onConsumptionChange: onConsumptionChange,
        onCountryBChange: onCountryBChange,
        switchBand: switchBand,
        exportCsv: exportCsv,
        copyText: copyText,
        openModal: openModal,
        closeModal: closeModal,
        handleModalOverlayClick: handleModalOverlayClick
    };
})();

function loadInsights() {
    insightsRenderNameSpace.load();
}

