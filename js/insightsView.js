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

    function card(opts) {
        var hasValue = opts.value !== null && opts.value !== undefined && opts.value !== '';
        var hasExplain = !!(opts.explanation || opts.calculation);
        var infoBtn = '';
        var calcPanel = '';

        if (hasExplain) {
            cardIdCounter += 1;
            var calcId = 'insight-calc-' + cardIdCounter;
            infoBtn = '<button type="button" class="insight-card__info-btn" aria-expanded="false" aria-controls="' + calcId +
                '" onclick="toggleInsightCalc(this)"><i class="fas fa-circle-info" aria-hidden="true"></i>' +
                '<span class="sr-only">' + esc(t('INSIGHTS_HOW_CALCULATED')) + '</span></button>';
            calcPanel = '<div class="insight-card__calc" id="' + calcId + '" hidden>' +
                (opts.explanation ? '<p class="insight-card__calc-explain">' + esc(opts.explanation) + '</p>' : '') +
                (opts.calculation ? '<p class="insight-card__calc-formula"><i class="fas fa-calculator" aria-hidden="true"></i><span>' + opts.calculation + '</span></p>' : '') +
                '</div>';
        }

        return '<div class="insight-card">' +
            '<div class="insight-card__label"><span>' + esc(opts.label) + '</span>' + infoBtn + '</div>' +
            '<div class="insight-card__value">' + (hasValue ? opts.value : esc(t('INSIGHTS_NOT_AVAILABLE'))) + '</div>' +
            (opts.sub ? '<div class="insight-card__sub">' + opts.sub + '</div>' : '') +
            (opts.note ? '<div class="insight-card__note">' + esc(opts.note) + '</div>' : '') +
            calcPanel +
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

    function section(titleIcon, titleText, bodyHtml) {
        if (!bodyHtml) return '';
        return '<section class="insights-section">' +
            '<h3 class="insights-section__title"><i class="fas ' + titleIcon + '" aria-hidden="true"></i> ' + esc(titleText) + '</h3>' +
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

    function renderSparkline(history) {
        if (!history || history.length < 2) return '';
        var width = 320, height = 90, padding = 8;
        var values = history.map(function (r) { return r.value; });
        var min = Math.min.apply(null, values);
        var max = Math.max.apply(null, values);
        var range = (max - min) || 1;
        var stepX = (width - padding * 2) / (history.length - 1);

        var points = history.map(function (r, i) {
            return {
                x: padding + i * stepX,
                y: height - padding - ((r.value - min) / range) * (height - padding * 2)
            };
        });

        var linePath = points.map(function (p, i) { return (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ');
        var lastX = points[points.length - 1].x.toFixed(1);
        var firstX = points[0].x.toFixed(1);
        var baseline = (height - padding).toFixed(1);
        var areaPath = linePath + ' L' + lastX + ',' + baseline + ' L' + firstX + ',' + baseline + ' Z';

        var peakIndex = values.indexOf(max);
        var markers = points.map(function (p, i) {
            var isLast = i === points.length - 1;
            var isPeak = i === peakIndex;
            if (!isLast && !isPeak) return '';
            var cls = isPeak && !isLast ? 'insights-sparkline__point insights-sparkline__point--peak' : 'insights-sparkline__point';
            var r = isLast ? 3.5 : 5;
            return '<circle class="' + cls + '" cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' + r + '"></circle>';
        }).join('');

        var svg = '<svg class="insights-sparkline__svg" viewBox="0 0 ' + width + ' ' + height + '" preserveAspectRatio="none" aria-hidden="true">' +
            '<path class="insights-sparkline__area" d="' + areaPath + '"></path>' +
            '<path class="insights-sparkline__line" d="' + linePath + '"></path>' + markers + '</svg>';

        var axis = '<div class="insights-sparkline__axis"><span>' + esc(history[0].period) + '</span><span>' + esc(history[history.length - 1].period) + '</span></div>';

        return '<div class="insights-history-trend">' +
            '<div class="insights-history-trend__title">' + esc(t('INSIGHTS_HISTORICAL_POSITION')) +
            '<span class="insights-history-trend__meta">(' + history.length + ')</span></div>' +
            '<div class="insights-sparkline">' + svg + axis + '</div>' +
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
            explanation: t('INSIGHTS_EXPLAIN_LATEST_PRICE'),
            calculation: latestCalc
        });

        var semesterCalc = (p.semesterChangePct != null && p.semesterValue != null)
            ? '(' + formatRaw(p.latestValue, ctx) + ' − ' + formatRaw(p.semesterValue, ctx) + ') / |' + formatRaw(p.semesterValue, ctx) + '| × 100 = <strong>' + esc(formatPercent(p.semesterChangePct)) + '</strong>'
            : null;
        var semesterCard = card({
            label: t('INSIGHTS_SEMESTER_CHANGE'),
            value: p.semesterChangePct != null ? esc(formatPercent(p.semesterChangePct)) : null,
            sub: changeSub(p.semesterChangePct, p.semesterChangeAbs, ctx),
            explanation: t('INSIGHTS_EXPLAIN_SEMESTER_CHANGE'),
            calculation: semesterCalc
        });

        var yoyCalc = (p.yoyChangePct != null && p.yoyValue != null)
            ? '(' + formatRaw(p.latestValue, ctx) + ' − ' + formatRaw(p.yoyValue, ctx) + ') / |' + formatRaw(p.yoyValue, ctx) + '| × 100 = <strong>' + esc(formatPercent(p.yoyChangePct)) + '</strong>'
            : null;
        var yoyCard = card({
            label: t('INSIGHTS_YOY_CHANGE'),
            value: p.yoyChangePct != null ? esc(formatPercent(p.yoyChangePct)) : null,
            sub: changeSub(p.yoyChangePct, p.yoyChangeAbs, ctx),
            explanation: t('INSIGHTS_EXPLAIN_YOY_CHANGE'),
            calculation: yoyCalc
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
            explanation: t('INSIGHTS_EXPLAIN_EU_COMPARISON'),
            calculation: euCalc
        }) : '';

        var rankCalc = cc.rankHigh != null ? esc(String(cc.rankHigh - 1)) + ' ' + esc(t('INSIGHTS_REPORTING_COUNTRIES')) + ' &gt; ' + esc(t(ctx.geo)) + ' &rarr; <strong>' + cc.rankHigh + ' / ' + cc.n + '</strong>' : null;
        var rankSub = cc.rankHigh != null
            ? esc(t('INSIGHTS_REPORTING_COUNTRIES')) + (cc.outlier === 'high' || cc.outlier === 'low' ? ' &middot; ' + esc(t(cc.outlier === 'high' ? 'INSIGHTS_OUTLIER_HIGH' : 'INSIGHTS_OUTLIER_LOW')) : '')
            : null;
        var rankCard = cc.rankHigh != null ? card({
            label: t('INSIGHTS_COUNTRY_RANK'),
            value: esc(cc.rankHigh + ' / ' + cc.n),
            sub: rankSub,
            explanation: t('INSIGHTS_EXPLAIN_COUNTRY_RANK'),
            calculation: rankCalc
        }) : '';

        var medianCalc = cc.median != null ? '(' + formatRaw(cc.focusValue, ctx) + ' − ' + formatRaw(cc.median, ctx) + ') / |' + formatRaw(cc.median, ctx) + '| × 100 = <strong>' + esc(formatPercent(cc.medianGapPct)) + '</strong>' : null;
        var medianCard = cc.median != null ? card({
            label: t('INSIGHTS_VS_MEDIAN'),
            value: esc(formatPercent(cc.medianGapPct)),
            sub: esc(formatPrice(cc.median, ctx)),
            explanation: t('INSIGHTS_EXPLAIN_MEDIAN'),
            calculation: medianCalc
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
            explanation: t('INSIGHTS_EXPLAIN_HISTORICAL')
        });

        var minCard = card({ label: t('INSIGHTS_HISTORICAL_MIN'), value: esc(formatPrice(hp.min, ctx)) });

        var percentileValue = hp.historicalPercentile != null ? esc(Math.round(hp.historicalPercentile) + '%') : null;
        var percentileCalc = hp.historicalPercentile != null
            ? esc(t('INSIGHTS_EXPLAIN_HISTORICAL')) : null;
        var percentileCard = card({
            label: t('INSIGHTS_PERCENTILE'),
            value: percentileValue,
            sub: flags.length ? flags.map(esc).join(' &middot; ') : null,
            explanation: hp.historicalPercentile != null ? t('INSIGHTS_EXPLAIN_HISTORICAL') : null
        });

        var persistent = data.persistentPosition;
        var persistentNote = '';
        if (persistent) {
            var persistentText = persistent.persistentlyHigh ? t('INSIGHTS_PERSISTENTLY_HIGH')
                : (persistent.persistentlyLow ? t('INSIGHTS_PERSISTENTLY_LOW') : t('INSIGHTS_NOT_PERSISTENT'));
            persistentNote = '<p class="insights-summary"><strong>' + esc(t('INSIGHTS_PERSISTENT_POSITION')) + ':</strong> ' + esc(persistentText) +
                ' (' + persistent.validPeriods + ' ' + esc(t('INSIGHTS_PERIOD')).toLowerCase() + 's)</p>';
        }

        return renderSparkline(data.eurHistoryForChart) +
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
                explanation: t('INSIGHTS_EXPLAIN_MOMENTUM')
            });
        }
        if (dev.cagr5 || dev.cagr2) {
            var cagr = dev.cagr5 || dev.cagr2;
            cards += card({
                label: dev.cagr5 ? t('INSIGHTS_CAGR_5Y') : t('INSIGHTS_CAGR_2Y'),
                value: esc(formatPercent(cagr.cagr)),
                sub: esc(cagr.basePeriod + ' &rarr; ' + cagr.latestPeriod),
                explanation: t('INSIGHTS_EXPLAIN_CAGR'),
                calculation: '((' + formatRaw(cagr.latestValue, ctx) + ' / ' + formatRaw(cagr.baseValue, ctx) + ')<sup>1/' + cagr.years + '</sup> − 1) × 100 = <strong>' + esc(formatPercent(cagr.cagr)) + '</strong>'
            });
        }
        if (dev.volatility) {
            cards += card({
                label: t('INSIGHTS_VOLATILITY'),
                value: esc(formatNumber(dev.volatility.volatility, 1)) + ' pp',
                sub: esc(dev.volatility.n + ' ' + t('INSIGHTS_PERIOD').toLowerCase() + '-to-' + t('INSIGHTS_PERIOD').toLowerCase()),
                explanation: t('INSIGHTS_EXPLAIN_VOLATILITY')
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
                explanation: t('INSIGHTS_EXPLAIN_SEASONAL')
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

    // ---- composition ----------------------------------------------------------------------------

    function renderComposition(data) {
        var comp = data.composition;
        var ctx = data.context;
        if (!comp || !comp.hasData) {
            return '<p class="insights-no-prev">' + esc(t('INSIGHTS_NO_COMPONENT_DATA')) + '</p>';
        }

        var validComponents = comp.components.filter(function (c) { return c.latest != null; });
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
                explanation: t('INSIGHTS_EXPLAIN_GLOBAL_COMPONENT')
            });
            globalHtml = '<div class="insights-cards">' + globalHtml + '</div>';
        }

        return bar +
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

        var preTaxCard = card({ label: t('INSIGHTS_PRETAX_CHANGE'), value: esc(formatPrice(fe.deltaPreTax, ctx)) });
        var finalCard = card({
            label: t('INSIGHTS_FINAL_CHANGE'),
            value: esc(formatPrice(fe.deltaFinal, ctx)),
            explanation: t('INSIGHTS_EXPLAIN_FISCAL_EFFECT'),
            calculation: esc(t('INSIGHTS_FINAL_CHANGE')) + ' (' + formatRaw(fe.deltaFinal, ctx) + ') vs ' + esc(t('INSIGHTS_PRETAX_CHANGE')).toLowerCase() + ' (' + formatRaw(fe.deltaPreTax, ctx) + ')'
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

        var eurCard = card({ label: t('INSIGHTS_EUR_RANK'), value: esc(rs.rankEur + ' / ' + rs.cohortSize) });
        var ppsCard = card({ label: t('INSIGHTS_PPS_RANK'), value: esc(rs.rankPps + ' / ' + rs.cohortSize) });
        var shiftCard = card({
            label: t('INSIGHTS_RANK_SHIFT'),
            value: esc((rs.shift > 0 ? '+' : '') + rs.shift),
            explanation: t('INSIGHTS_EXPLAIN_PPS'),
            calculation: esc(t('INSIGHTS_EUR_RANK')) + ' (' + rs.rankEur + ') − ' + esc(t('INSIGHTS_PPS_RANK')) + ' (' + rs.rankPps + ') = <strong>' + ((rs.shift > 0 ? '+' : '') + rs.shift) + '</strong>'
        });

        return '<div class="insights-cards">' + eurCard + ppsCard + shiftCard + '</div>' +
            '<p class="insights-summary">' + esc(t(classificationKeyMap[rs.classification] || 'INSIGHTS_PPS_SIMILAR')) + '</p>';
    }

    // ---- Europe at a glance -----------------------------------------------------------------------------

    function renderEuropeSnapshot(data) {
        var snap = data.europeSnapshot;
        var ctx = data.context;
        if (!snap || !snap.reportingCountries) return '';

        var directionCard = card({
            label: t('INSIGHTS_DISPERSION'),
            value: snap.dispersionChangePct != null ? esc(formatPercent(snap.dispersionChangePct)) : null,
            sub: snap.dispersionClassification !== 'unknown'
                ? esc(t(snap.dispersionClassification === 'converging' ? 'INSIGHTS_CONVERGING' : (snap.dispersionClassification === 'diverging' ? 'INSIGHTS_DIVERGING' : 'INSIGHTS_DISPERSION_STABLE')))
                : null,
            explanation: t('INSIGHTS_EXPLAIN_EUROPE_SNAPSHOT')
        });

        var countsCard = card({
            label: t('INSIGHTS_EUROPE_SNAPSHOT'),
            value: snap.reportingCountries + '/' + snap.totalCountries,
            sub: esc(snap.rising + ' ' + t('INSIGHTS_RISING_COUNTRIES') + ' &middot; ' + snap.falling + ' ' + t('INSIGHTS_FALLING_COUNTRIES') + ' &middot; ' + snap.stable + ' ' + t('INSIGHTS_STABLE_COUNTRIES'))
        });

        var movers = snap.topRising.slice(0, 3).map(function (r) {
            return '<span class="insight-rank-item"><span class="insight-rank-up">▲</span> ' + esc(t(r.geo)) + ' ' + esc(formatPercent(r.yoyPct)) + '</span>';
        }).concat(snap.topFalling.slice(0, 3).map(function (r) {
            return '<span class="insight-rank-item"><span class="insight-rank-down">▼</span> ' + esc(t(r.geo)) + ' ' + esc(formatPercent(r.yoyPct)) + '</span>';
        })).join(' ');

        return '<div class="insights-cards">' + countsCard + directionCard + '</div>' +
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
            explanation: t('INSIGHTS_EXPLAIN_BAND_PATTERN'),
            calculation: '(' + formatRaw(bp.selectedValue, ctx) + ' − ' + formatRaw(bp.referenceValue, ctx) + ') / |' + formatRaw(bp.referenceValue, ctx) + '| × 100 = <strong>' + esc(formatPercent(bp.bandGapPct)) + '</strong>'
        }) : '';

        var patternCard = card({
            label: t('INSIGHTS_BAND_PATTERN'),
            value: esc(t(patternKeyMap[bp.pattern])),
            explanation: t('INSIGHTS_EXPLAIN_BAND_PATTERN')
        });

        var spread = data.bandSpreadOverTime;
        var spreadHtml = '';
        if (spread) {
            var spreadKeyMap = { widened: 'INSIGHTS_SPREAD_WIDENED', narrowed: 'INSIGHTS_SPREAD_NARROWED', stable: 'INSIGHTS_SPREAD_STABLE' };
            spreadHtml = card({
                label: t('INSIGHTS_BAND_SPREAD_TITLE'),
                value: esc(formatPrice(spread.latestSpread, ctx)),
                sub: spread.classification !== 'unavailable' ? esc(t(spreadKeyMap[spread.classification])) : null,
                explanation: t('INSIGHTS_EXPLAIN_BAND_SPREAD')
            });
        }

        return bars + '<div class="insights-cards">' + patternCard + premiumCard + spreadHtml + '</div>';
    }

    // ---- related context: inflation --------------------------------------------------------------------

    function renderInflationContext(data) {
        var ic = data.inflationComparison;
        if (!ic) return '';
        var energyCard = card({ label: t('INSIGHTS_ENERGY_YOY'), value: esc(formatPercent(ic.energyYoyPct)) });
        var hicpCard = card({ label: t('INSIGHTS_HICP_YOY'), value: esc(formatPercent(ic.hicpYoyPct)), sub: esc(ic.month) });
        var gapCard = card({
            label: t('INSIGHTS_INFLATION_CONTEXT'),
            value: esc(formatPercent(ic.gap)) + ' pp',
            explanation: t('INSIGHTS_EXPLAIN_INFLATION')
        });
        return '<div class="insights-cards">' + energyCard + hicpCard + gapCard + '</div>' +
            '<p class="insights-note"><i class="fas fa-circle-info" aria-hidden="true"></i> ' + esc(t('INSIGHTS_RELATED_CONTEXT_NOTE')) + '</p>';
    }

    // ---- data quality / freshness / anomalies -----------------------------------------------------------

    function renderDataQuality(data) {
        var dq = data.dataQuality;
        var notes = [];
        if (dq.focusMissing) notes.push(t('INSIGHTS_QUALITY_FOCUS_MISSING'));
        if (dq.yoyMissing) notes.push(t('INSIGHTS_QUALITY_YOY_MISSING'));
        if (dq.benchmarkMissing) notes.push(t('INSIGHTS_QUALITY_BENCHMARK_MISSING'));
        if (dq.componentDataMissing) notes.push(t('INSIGHTS_QUALITY_COMPONENT_MISSING'));
        if (dq.insufficientHistory) notes.push(t('INSIGHTS_QUALITY_INSUFFICIENT_HISTORY'));
        if (dq.reconciliationGap != null && dq.reconciliationGap > 5) notes.push(t('INSIGHTS_QUALITY_RECONCILIATION'));
        if (dq.isProvisional) notes.push(t('INSIGHTS_PROVISIONAL'));
        if (dq.isEstimated) notes.push(t('INSIGHTS_ESTIMATED'));
        (dq.anomalies || []).forEach(function (a) {
            if (a === 'negativePrice') notes.push(t('INSIGHTS_ANOMALY_NEGATIVE'));
            if (a === 'zeroPrice') notes.push(t('INSIGHTS_ANOMALY_ZERO'));
            if (a === 'implausibleChange') notes.push(t('INSIGHTS_ANOMALY_IMPLAUSIBLE'));
        });
        if (!notes.length) notes.push(t('INSIGHTS_QUALITY_OK'));

        return notes.map(function (n) {
            return '<div class="insights-note"><i class="fas fa-circle-info" aria-hidden="true"></i> ' + esc(n) + '</div>';
        }).join('');
    }

    // ---- top-level render -------------------------------------------------------------------------------

    function render(data) {
        cardIdCounter = 0;
        var html = '<div class="insights-panel" tabindex="-1">' +
            renderContext(data.context, data.latestPeriod) +
            '<div class="insights-sections">' +
            section('fa-euro-sign', t('INSIGHTS_LATEST_PRICE'), renderPriceCards(data)) +
            section('fa-globe-europe', t('INSIGHTS_EU_COMPARISON'), renderComparisonCards(data) + renderRankSensitivity(data)) +
            section('fa-history', t('INSIGHTS_HISTORICAL_POSITION'), renderHistoryCards(data)) +
            section('fa-chart-line', t('INSIGHTS_DEVELOPMENT'), renderDevelopment(data)) +
            section('fa-chart-pie', t('INSIGHTS_COMPOSITION'), renderComposition(data)) +
            section('fa-balance-scale', t('INSIGHTS_FISCAL_EFFECT'), renderFiscalEffect(data)) +
            section('fa-coins', t('INSIGHTS_PPS_PERSPECTIVE'), renderPpsPerspective(data)) +
            section('fa-earth-europe', t('INSIGHTS_EUROPE_SNAPSHOT'), renderEuropeSnapshot(data)) +
            section('fa-bolt', t('INSIGHTS_BAND_PATTERN'), renderBandSection(data)) +
            section('fa-chart-simple', t('INSIGHTS_INFLATION_CONTEXT'), renderInflationContext(data)) +
            '</div>' +
            '<div class="insights-note-list">' + renderDataQuality(data) + '</div>' +
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

        insightsDataNameSpace.computeSelectedViewInsights().then(function (data) {
            if (requestId !== currentRequestId) return; // a newer request superseded this one
            render(data);
        }).catch(function (err) {
            if (requestId !== currentRequestId) return;
            console.error('[insights] failed to compute insights', err);
            renderError();
        });
    }

    return { load: load };
})();

function loadInsights() {
    insightsRenderNameSpace.load();
}
