function openInsightsView() {
    $('#charts').addClass('d-none');
    $('#insightsView').removeClass('d-none');
    $('#menu, #menuSwitch, .menuSwitch').addClass('d-none');

    $('#chartBtns').children().not('#closeInsightsWrapper').addClass('d-none');
    $('#closeInsightsWrapper').removeClass('d-none');

    const trigger = document.getElementById('insightsChart');
    if (trigger) {
        trigger.setAttribute('aria-expanded', 'true');
    }

    const closeBtn = document.getElementById('insightsCloseBtn');
    if (closeBtn) {
        closeBtn.focus();
    }

    $(document).on('keydown.insightsView', (event) => {
        if (event.key === 'Escape' || event.key === 'Esc') {
            if ($('#insightInfoPopup').length) {
                return; // Popover info card takes precedence on Escape
            }
            event.preventDefault();
            closeInsightsView();
        }
    });

    loadInsights();
}

function closeInsightsView() {
    $('#insightsView').addClass('d-none');
    $('#charts').removeClass('d-none');
    $('#menu, #menuSwitch, .menuSwitch').removeClass('d-none');

    $('#chartBtns').children().removeClass('d-none');
    $('#closeInsightsWrapper').addClass('d-none');

    const trigger = document.getElementById('insightsChart');
    if (trigger) {
        trigger.setAttribute('aria-expanded', 'false');
        trigger.focus();
    }

    $(document).off('keydown.insightsView');
}

function isInsightsViewOpen() {
    return $('#insightsView').length > 0 && !$('#insightsView').hasClass('d-none');
}

// Per-card "how is this calculated" disclosure. Global because it's wired via inline onclick on dynamically generated markup.
function toggleInsightCalc(btn) {
    const panelId = btn.getAttribute('aria-controls');
    const panel = document.getElementById(panelId);
    if (!panel) return;
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    if (expanded) {
        panel.setAttribute('hidden', '');
    } else {
        panel.removeAttribute('hidden');
    }
}

const insightsRenderNameSpace = (function () {

    let currentRequestId = 0;
    let cardIdCounter = 0;

    function t(key) {
        return (typeof languageNameSpace !== 'undefined' && languageNameSpace.labels[key]) || key;
    }

    function locale() {
        const map = { EN: 'en', DE: 'de', FR: 'fr' };
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
        const n = formatNumber(value, priceDecimals(ctx));
        return n === null ? null : n + ' ' + unitLabel(ctx);
    }

    function formatRaw(value, ctx) {
        const n = formatNumber(value, priceDecimals(ctx));
        return n === null ? '—' : n;
    }

    function formatPercent(value) {
        const n = formatNumber(value === null || value === undefined ? null : Math.abs(value), 1);
        if (n === null) return null;
        const sign = value > 0 ? '+' : (value < 0 ? '−' : '');
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

    // ---- card primitive: label + value + context + expandable calc (What it is, Calculation, Purpose) -------------

    function card(opts) {
        const hasValue = opts.value !== null && opts.value !== undefined && opts.value !== '';
        return '<div class="insight-card">' +
            '<div class="insight-card__label"><span>' + esc(opts.label) + '</span></div>' +
            '<div class="insight-card__value">' + (hasValue ? opts.value : esc(t('INSIGHTS_NOT_AVAILABLE'))) + '</div>' +
            (opts.sub ? '<div class="insight-card__sub">' + opts.sub + '</div>' : '') +
            (opts.note ? '<div class="insight-card__note">' + esc(opts.note) + '</div>' : '') +
            '</div>';
    }

    function changeSub(pct, abs, ctx) {
        const pctText = formatPercent(pct);
        if (pctText === null) return null;
        const absText = formatPrice(abs, ctx);
        const dir = pct > 0 ? 'rising' : (pct < 0 ? 'falling' : 'stable');
        return '<i class="fas ' + directionIcon(dir) + '" aria-hidden="true"></i> ' + esc(directionLabel(dir)) +
            (absText ? ' (' + esc(absText) + ')' : '');
    }

    function togglePopover(btn, e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const popover = $(btn).closest('.ecl-popover');
        const container = popover.find('.ecl-popover__container');
        const isHidden = container.is('[hidden]') || container.css('display') === 'none';

        // Close any other open popovers
        $('.ecl-popover__container').attr('hidden', '').css('display', 'none');
        $('.ecl-popover__toggle').attr('aria-expanded', 'false');

        if (isHidden) {
            container.removeAttr('hidden').css('display', 'block');
            $(btn).attr('aria-expanded', 'true');
        } else {
            container.attr('hidden', '').css('display', 'none');
            $(btn).attr('aria-expanded', 'false');
        }
    }

    function closePopover(btn, e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const container = $(btn).closest('.ecl-popover__container');
        const popover = $(btn).closest('.ecl-popover');
        container.attr('hidden', '').css('display', 'none');
        popover.find('.ecl-popover__toggle').attr('aria-expanded', 'false');
    }

    function section(titleIcon, titleText, bodyHtml, info) {
        if (!bodyHtml) return '';
        cardIdCounter++;
        const popoverId = 'insight-popover-' + cardIdCounter;

        let popoverHtml = '';
        if (info) {
            const whatHtml = info.whatItIs ? '<div class="insight-popover-card__item" style="margin-bottom:0.75rem;line-height:1.5;font-size:0.875rem;color:#334155"><strong><i class="fas fa-question-circle" aria-hidden="true" style="color:#0284c7"></i> ' + esc(t('INSIGHTS_WHAT_IT_IS')) + ':</strong> ' + esc(info.whatItIs) + '</div>' : '';
            const calcHtml = info.calculation ? '<div class="insight-popover-card__item" style="margin-bottom:0.75rem;line-height:1.5;font-size:0.875rem;color:#334155"><strong><i class="fas fa-calculator" aria-hidden="true" style="color:#0284c7"></i> ' + esc(t('INSIGHTS_CALCULATION')) + ':</strong> <span>' + info.calculation + '</span></div>' : '';
            const purposeHtml = info.purpose ? '<div class="insight-popover-card__item" style="line-height:1.5;font-size:0.875rem;color:#334155"><strong><i class="fas fa-bullseye" aria-hidden="true" style="color:#0284c7"></i> ' + esc(t('INSIGHTS_PURPOSE')) + ':</strong> ' + esc(info.purpose) + '</div>' : '';

            popoverHtml = '<div class="ecl-popover" style="position:relative;display:inline-flex;margin-left:0.5rem;vertical-align:middle">' +
                '<button class="ecl-button ecl-button--tertiary ecl-popover__toggle" type="button" aria-controls="' + popoverId + '" aria-expanded="false" title="' + esc(t('INSIGHTS_HOW_CALCULATED')) + '" aria-label="' + esc(t('INSIGHTS_HOW_CALCULATED')) + ': ' + esc(titleText) + '" onclick="insightsRenderNameSpace.togglePopover(this, event)">' +
                '<span class="ecl-button__container">' +
                '<span class="wt-icon--information-outline ecl-icon ecl-icon--m ecl-button__icon ecl-icon--information-outline" aria-hidden="true" data-ecl-icon></span>' +
                '</span>' +
                '</button>' +
                '<div id="' + popoverId + '" class="ecl-popover__container" hidden style="display:none">' +
                '<div class="ecl-popover__scrollable">' +
                '<button class="ecl-button ecl-button--tertiary ecl-button--neutral ecl-popover__close ecl-button--icon-only" type="button" aria-label="' + esc(t('CLOSE') || 'Close') + '" onclick="insightsRenderNameSpace.closePopover(this, event)">' +
                '<span class="ecl-button__container">' +
                '<span class="sr-only ecl-u-sr-only" data-ecl-label="true">' + esc(t('CLOSE') || 'Close') + '</span>' +
                '<span class="wt-icon--close ecl-icon ecl-icon--m ecl-button__icon ecl-icon--close" aria-hidden="true" data-ecl-icon></span>' +
                '</span>' +
                '</button>' +
                '<div class="ecl-popover__content">' +
                '<h4 class="insight-popover-card__title" style="margin-top:0;margin-bottom:0.85rem;font-size:0.95rem;font-weight:700;color:#0f172a;border-bottom:1px solid #e2e8f0;padding-bottom:0.5rem"><i class="fas fa-info-circle" aria-hidden="true" style="color:#0284c7"></i> ' + esc(titleText) + '</h4>' +
                whatHtml + calcHtml + purposeHtml +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>';
        }

        return '<section class="insights-section" aria-label="' + esc(titleText) + '">' +
            '<h3 class="insights-section__title"><span style="display:flex;align-items:center;gap:0.45rem"><i class="fas ' + titleIcon + '" aria-hidden="true"></i> ' + esc(titleText) + popoverHtml + '</span></h3>' +
            bodyHtml +
            '</section>';
    }

    // ---- context strip --------------------------------------------------------------------

    const svgArrow = '<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" viewBox="0 0 24 24" enable-background="new 0 0 24 24" focusable="false" aria-hidden="true" class="ecl-icon ecl-icon--s ecl-select__icon-shape ecl-icon--rotate-180"><path d="M18.2 17.147c.2.2.4.3.7.3.3 0 .5-.1.7-.3.4-.4.4-1 0-1.4l-7.1-7.1c-.4-.4-1-.4-1.4 0l-7 7c-.3.4-.3 1 .1 1.4.4.4 1 .4 1.4 0l6.2-6.2 6.4 6.3z"></path></svg>';

    function renderEclSelect(opts) {
        const id = opts.id;
        const label = opts.label;
        const optionsHtml = opts.optionsHtml;
        const onChange = opts.onChange;
        const containerClass = opts.containerClass || 'ecl-select__container--l ecl-select__container--checked';
        const name = opts.name || id;

        return '<div class="insights-meta__item">' +
            '<div class="ecl-form-group">' +
            '<label for="' + esc(id) + '" id="' + esc(id) + '-label" class="ecl-form-label">' + esc(label) + '</label>' +
            '<div class="ecl-select__container ' + esc(containerClass) + '">' +
            '<p class="sr-only">Your selection will automatically update the view</p>' +
            '<select class="ecl-select" id="' + esc(id) + '" name="' + esc(name) + '" required="" onchange="' + esc(onChange) + '">' +
            optionsHtml +
            '</select>' +
            '<div class="ecl-select__icon">' +
            svgArrow +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>';
    }

    function renderContext(ctx, latestPeriod) {
        function item(label, value) {
            if (!value) return '';
            return '<div class="insights-meta__item"><span class="insights-meta__label">' + esc(label) + '</span>' +
                '<span class="insights-meta__value">' + esc(value) + '</span></div>';
        }

        const countryList = Object.keys(typeof energyCountries !== 'undefined' ? energyCountries : {});
        const countryOptions = countryList.map((g) => {
            const selected = g === ctx.geo ? ' selected' : '';
            return '<option value="' + g + '"' + selected + '>' + esc(t(g)) + ' (' + g + ')</option>';
        }).join('');

        const focusCountrySelector = renderEclSelect({
            id: 'insightFocusCountrySelect',
            name: 'focusCountry',
            label: t('INSIGHTS_FOCUS_COUNTRY'),
            optionsHtml: countryOptions,
            onChange: 'insightsRenderNameSpace.switchFocusCountry(this.value)',
            containerClass: 'ecl-select__container--m'
        });

        return '<div class="insights-meta" role="region" aria-label="' + esc(t('INSIGHTS_GEOGRAPHY')) + ' ' + esc(t('INSIGHTS_CONTEXT')) + '">' +
            focusCountrySelector +
            item(t('INSIGHTS_PERIOD'), latestPeriod) +
            item(t('INSIGHTS_PRODUCT'), t(ctx.product)) +
            item(t('INSIGHTS_CONSUMER'), t(ctx.consumer)) +
            item(t('INSIGHTS_BAND'), t(ctx.band)) +
            item(t('INSIGHTS_PRICE_EXPRESSION'), unitLabel(ctx)) +
            '</div>';
    }

    // ---- SVG sparkline (historical trend) --------------------------------------------------

    function renderSparkline(history, ctx) {
        if (!history || history.length < 2) return '';
        const width = 800, height = 320;
        const paddingX = 40, paddingY = 28;

        const values = history.map((r) => r.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const range = (max - min) || 1;

        const stepX = (width - paddingX * 2) / (history.length - 1);
        const yScale = (val) => paddingY + (1 - (val - min) / range) * (height - paddingY * 2);

        const points = history.map((r, i) => ({
            x: paddingX + i * stepX,
            y: yScale(r.value),
            value: r.value,
            period: r.period
        }));

        const linePath = points.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ');

        const lastX = points[points.length - 1].x.toFixed(1);
        const firstX = points[0].x.toFixed(1);
        const baseline = (height - paddingY).toFixed(1);
        const areaPath = linePath + ' L' + lastX + ',' + baseline + ' L' + firstX + ',' + baseline + ' Z';

        const yMax = yScale(max);
        const yMin = yScale(min);
        const yAvg = yScale(avg);

        const peakPoint = points[values.indexOf(max)];
        const minPoint = points[values.indexOf(min)];
        const lastPoint = points[points.length - 1];

        const maxLine = '<line class="insights-sparkline__ref-line insights-sparkline__ref-line--max" x1="' + paddingX + '" y1="' + yMax.toFixed(1) + '" x2="' + (width - paddingX) + '" y2="' + yMax.toFixed(1) + '"></line>';
        const avgLine = '<line class="insights-sparkline__ref-line insights-sparkline__ref-line--avg" x1="' + paddingX + '" y1="' + yAvg.toFixed(1) + '" x2="' + (width - paddingX) + '" y2="' + yAvg.toFixed(1) + '"></line>';
        const minLine = '<line class="insights-sparkline__ref-line insights-sparkline__ref-line--min" x1="' + paddingX + '" y1="' + yMin.toFixed(1) + '" x2="' + (width - paddingX) + '" y2="' + yMin.toFixed(1) + '"></line>';

        const maxMarker = '<circle class="insights-sparkline__marker insights-sparkline__marker--max" cx="' + peakPoint.x.toFixed(1) + '" cy="' + peakPoint.y.toFixed(1) + '" r="6"></circle>';
        const minMarker = '<circle class="insights-sparkline__marker insights-sparkline__marker--min" cx="' + minPoint.x.toFixed(1) + '" cy="' + minPoint.y.toFixed(1) + '" r="6"></circle>';
        const lastMarker = '<circle class="insights-sparkline__marker insights-sparkline__marker--latest" cx="' + lastPoint.x.toFixed(1) + '" cy="' + lastPoint.y.toFixed(1) + '" r="6"></circle>';

        const maxText = '<text class="insights-sparkline__label insights-sparkline__label--max" x="' + Math.min(width - 80, Math.max(80, peakPoint.x)).toFixed(1) + '" y="' + Math.max(16, yMax - 8).toFixed(1) + '" text-anchor="middle">Max: ' + esc(formatPrice(max, ctx)) + '</text>';
        const minText = '<text class="insights-sparkline__label insights-sparkline__label--min" x="' + Math.min(width - 80, Math.max(80, minPoint.x)).toFixed(1) + '" y="' + Math.min(height - 6, yMin + 18).toFixed(1) + '" text-anchor="middle">Min: ' + esc(formatPrice(min, ctx)) + '</text>';
        const avgText = '<text class="insights-sparkline__label insights-sparkline__label--avg" x="' + (width - paddingX - 6) + '" y="' + (yAvg - 6).toFixed(1) + '" text-anchor="end">Avg: ' + esc(formatPrice(avg, ctx)) + '</text>';

        const svg = '<svg class="insights-sparkline__svg" viewBox="0 0 ' + width + ' ' + height + '" preserveAspectRatio="none" aria-hidden="true" role="img">' +
            '<path class="insights-sparkline__area" d="' + areaPath + '"></path>' +
            maxLine + avgLine + minLine +
            '<path class="insights-sparkline__line" d="' + linePath + '"></path>' +
            maxMarker + minMarker + lastMarker +
            maxText + minText + avgText +
            '</svg>';

        const legend = '<div class="insights-sparkline__legend">' +
            '<span><span class="insights-sparkline__legend-dot" style="background:#b91c1c"></span><strong>Max:</strong> ' + esc(formatPrice(max, ctx)) + ' (' + esc(peakPoint.period) + ')</span>' +
            '<span><span class="insights-sparkline__legend-dot" style="background:#1d4ed8;border-top:1px dashed #1d4ed8"></span><strong>Avg:</strong> ' + esc(formatPrice(avg, ctx)) + '</span>' +
            '<span><span class="insights-sparkline__legend-dot" style="background:#15803d"></span><strong>Min:</strong> ' + esc(formatPrice(min, ctx)) + ' (' + esc(minPoint.period) + ')</span>' +
            '</div>';

        const axis = '<div class="insights-sparkline__axis"><span>' + esc(history[0].period) + '</span><span>' + esc(history[history.length - 1].period) + '</span></div>';

        return '<div class="insights-history-trend" role="region" aria-label="' + esc(t('INSIGHTS_HISTORICAL_POSITION')) + ' ' + esc(t('INSIGHTS_TREND')) + '">' +
            '<div class="insights-history-trend__title">' + esc(t('INSIGHTS_HISTORICAL_POSITION')) +
            '<span class="insights-history-trend__meta">(' + history.length + ' ' + esc(t('INSIGHTS_PERIOD')).toLowerCase() + 's)</span></div>' +
            '<div class="insights-sparkline">' + svg + axis + legend + '</div>' +
            '</div>';
    }

    // ---- country distribution position bar -------------------------------------------------

    function renderDistribution(cc, ctx) {
        if (!cc || cc.focusValue == null || cc.min == null || cc.max == null || cc.max === cc.min) return '';
        const pct = (v) => Math.max(0, Math.min(100, ((v - cc.min) / (cc.max - cc.min)) * 100));

        const isEuFocus = ctx.geo === 'EU27_2020';
        const focusPct = pct(cc.focusValue);
        const focusMarker = '<div class="insights-distribution__marker insights-distribution__marker--focus" style="left:' + focusPct.toFixed(1) + '%" title="' + esc(t(ctx.geo)) + ': ' + esc(formatPrice(cc.focusValue, ctx)) + '"></div>';

        let euMarker = '';
        if (cc.euValue != null && !isEuFocus) {
            const euPct = pct(cc.euValue);
            euMarker = '<div class="insights-distribution__marker insights-distribution__marker--eu" style="left:' + euPct.toFixed(1) + '%" title="' + esc(t('EU27_2020')) + ': ' + esc(formatPrice(cc.euValue, ctx)) + '"></div>';
        }

        const minGeoLabel = cc.minGeo ? ' (' + esc(t(cc.minGeo)) + ')' : '';
        const maxGeoLabel = cc.maxGeo ? ' (' + esc(t(cc.maxGeo)) + ')' : '';

        const legendHtml = isEuFocus ? (
            '<span><span class="insights-distribution__legend-dot" style="background:var(--nav-color)"></span>' + esc(t('EU27_2020')) + ' (' + esc(formatPrice(cc.euValue || cc.focusValue, ctx)) + ')</span>'
        ) : (
            '<span><span class="insights-distribution__legend-dot" style="background:var(--nav-color)"></span>' + esc(t(ctx.geo)) + ' (' + esc(formatPrice(cc.focusValue, ctx)) + ')</span>' +
            (cc.euValue != null ? '<span><span class="insights-distribution__legend-dot" style="background:#92400e"></span>' + esc(t('EU27_2020')) + ' (' + esc(formatPrice(cc.euValue, ctx)) + ')</span>' : '')
        );

        return '<div class="insights-distribution" role="region" aria-label="' + esc(t('INSIGHTS_EU_COMPARISON')) + ' ' + esc(t('INSIGHTS_DISTRIBUTION')) + '">' +
            '<div class="insights-distribution__track">' + focusMarker + euMarker + '</div>' +
            '<div class="insights-distribution__labels">' +
            '<span>Min: ' + esc(formatPrice(cc.min, ctx)) + minGeoLabel + '</span>' +
            '<span>Max: ' + esc(formatPrice(cc.max, ctx)) + maxGeoLabel + '</span>' +
            '</div>' +
            '<div class="insights-distribution__legend">' +
            legendHtml +
            '</div>' +
            '</div>';
    }

    // ---- price composition stacked bar ------------------------------------------------------

    function renderCompositionBar(components) {
        if (!components || !components.length) return '';
        const total = components.reduce((sum, c) => sum + (c.latest || 0), 0);
        if (total <= 0) return '';

        const segments = components.map((c) => {
            const pct = ((c.latest || 0) / total) * 100;
            const color = (typeof colors !== 'undefined' && colors[c.code]) || '#0E47CB';
            return '<div class="insights-composition-bar__segment" style="width:' + pct.toFixed(1) + '%;background:' + color + '" title="' + esc(t(c.code)) + ': ' + pct.toFixed(1) + '%"></div>';
        }).join('');

        return '<div class="insights-composition-bar" aria-hidden="true">' + segments + '</div>';
    }

    // ---- consumption-band bar chart ---------------------------------------------------------

    function renderBandBars(bands, selectedBand, ctx) {
        if (!bands || !bands.length) return '';
        const values = bands.map((b) => b.value).filter((v) => v !== null && v !== undefined);
        if (!values.length) return '';
        const max = Math.max(...values);
        if (max <= 0) return '';

        const bars = bands.map((b) => {
            const isSel = b.band === selectedBand;
            const isRef = b.isReference;
            const pct = b.value != null ? (b.value / max) * 100 : 0;
            let barClass = 'insights-band-bar__fill';
            if (isSel) barClass += ' insights-band-bar__fill--selected';
            else if (isRef) barClass += ' insights-band-bar__fill--reference';

            const priceText = b.value != null ? formatPrice(b.value, ctx) : '—';
            const labelText = t(b.band);

            return '<div class="insights-band-bar" title="' + esc(labelText) + ': ' + esc(priceText) + '">' +
                '<div class="insights-band-bar__val">' + esc(b.value != null ? formatNumber(b.value, priceDecimals(ctx)) : '') + '</div>' +
                '<div class="insights-band-bar__track"><div class="' + barClass + '" style="height:' + pct.toFixed(1) + '%"></div></div>' +
                '<div class="insights-band-bar__label' + (isSel ? ' insights-band-bar__label--selected' : '') + '">' + esc(labelText) + '</div>' +
                '</div>';
        }).join('');

        return '<div class="insights-band-bars" role="region" aria-label="' + esc(t('INSIGHTS_BAND_PATTERN')) + '">' + bars + '</div>';
    }

    // ---- key price highlights (latest price / 6m change / 1y change) ----------------------

    function renderPriceCards(data) {
        const p = data.price;
        const ctx = data.context;
        if (!p) return '';

        const latestCalc = p.latestValue != null
            ? esc(t(ctx.geo)) + ', ' + esc(data.latestPeriod) + ' = <strong>' + formatRaw(p.latestValue, ctx) + '</strong> ' + unitLabel(ctx)
            : null;
        const latestCard = card({
            label: t('INSIGHTS_LATEST_PRICE'),
            value: p.latestValue != null ? esc(formatPrice(p.latestValue, ctx)) : null,
            sub: esc(contextPhrase(ctx)),
            whatItIs: t('INSIGHTS_WHAT_LATEST_PRICE'),
            calculation: latestCalc,
            purpose: t('INSIGHTS_PURPOSE_LATEST_PRICE')
        });

        const semesterCalc = (p.semesterChangePct != null && p.semesterValue != null)
            ? '(' + formatRaw(p.latestValue, ctx) + ' − ' + formatRaw(p.semesterValue, ctx) + ') / |' + formatRaw(p.semesterValue, ctx) + '| × 100 = <strong>' + esc(formatPercent(p.semesterChangePct)) + '</strong>'
            : null;
        const semesterCard = card({
            label: t('INSIGHTS_SEMESTER_CHANGE'),
            value: p.semesterChangePct != null ? esc(formatPercent(p.semesterChangePct)) : null,
            sub: changeSub(p.semesterChangePct, p.semesterChangeAbs, ctx),
            whatItIs: t('INSIGHTS_WHAT_SEMESTER_CHANGE'),
            calculation: semesterCalc,
            purpose: t('INSIGHTS_PURPOSE_SEMESTER_CHANGE')
        });

        const yoyCalc = (p.yoyChangePct != null && p.yoyValue != null)
            ? '(' + formatRaw(p.latestValue, ctx) + ' − ' + formatRaw(p.yoyValue, ctx) + ') / |' + formatRaw(p.yoyValue, ctx) + '| × 100 = <strong>' + esc(formatPercent(p.yoyChangePct)) + '</strong>'
            : null;
        const yoyCard = card({
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
        const ctx = data.context;
        const cc = data.crossCountry;
        if (!cc || cc.focusValue == null) return '';

        const isEuFocus = ctx.geo === 'EU27_2020';

        const euCalc = (cc.euValue != null && !isEuFocus) ? '(' + formatRaw(cc.focusValue, ctx) + ' − ' + formatRaw(cc.euValue, ctx) + ') / |' + formatRaw(cc.euValue, ctx) + '| × 100 = <strong>' + esc(formatPercent(cc.euGapPct)) + '</strong>' : null;
        const euCard = (cc.euValue != null && !isEuFocus) ? card({
            label: t('INSIGHTS_EU_COMPARISON'),
            value: esc(formatPercent(cc.euGapPct)),
            sub: esc(cc.euGapPct > 0 ? t('INSIGHTS_ABOVE_EU') : (cc.euGapPct < 0 ? t('INSIGHTS_BELOW_EU') : t('INSIGHTS_IN_LINE_EU'))),
            whatItIs: t('INSIGHTS_WHAT_EU_GAP'),
            calculation: euCalc,
            purpose: t('INSIGHTS_PURPOSE_EU_GAP')
        }) : '';

        const rankCalc = cc.rankHigh != null ? esc(String(cc.rankHigh - 1)) + ' ' + esc(t('INSIGHTS_REPORTING_COUNTRIES')) + ' &gt; ' + esc(t(ctx.geo)) + ' &rarr; <strong>' + cc.rankHigh + ' / ' + cc.n + '</strong>' : null;
        const rankSub = cc.rankHigh != null
            ? esc(t('INSIGHTS_REPORTING_COUNTRIES')) + (cc.outlier === 'high' || cc.outlier === 'low' ? ' &middot; ' + esc(t(cc.outlier === 'high' ? 'INSIGHTS_OUTLIER_HIGH' : 'INSIGHTS_OUTLIER_LOW')) : '')
            : null;
        const rankCard = (cc.rankHigh != null && !isEuFocus) ? card({
            label: t('INSIGHTS_COUNTRY_RANK'),
            value: esc(cc.rankHigh + ' / ' + cc.n),
            sub: rankSub,
            whatItIs: t('INSIGHTS_WHAT_RANK'),
            calculation: rankCalc,
            purpose: t('INSIGHTS_PURPOSE_RANK')
        }) : '';

        const medianLabel = isEuFocus ? 'EU27 vs. Country Median' : t('INSIGHTS_VS_MEDIAN');
        const medianSub = isEuFocus
            ? esc(t('EU27_2020')) + ' (' + formatPrice(cc.euValue || cc.focusValue, ctx) + ') vs. Median (' + formatPrice(cc.median, ctx) + ')'
            : esc(formatPrice(cc.median, ctx));
        const medianCalc = cc.median != null ? '(' + formatRaw(cc.focusValue, ctx) + ' − ' + formatRaw(cc.median, ctx) + ') / |' + formatRaw(cc.median, ctx) + '| × 100 = <strong>' + esc(formatPercent(cc.medianGapPct)) + '</strong>' : null;
        const medianCard = cc.median != null ? card({
            label: medianLabel,
            value: esc(formatPercent(cc.medianGapPct)),
            sub: medianSub,
            whatItIs: t('INSIGHTS_WHAT_MEDIAN_GAP'),
            calculation: medianCalc,
            purpose: t('INSIGHTS_PURPOSE_MEDIAN_GAP')
        }) : '';

        const cardsHtml = (euCard || rankCard || medianCard) ? '<div class="insights-cards">' + euCard + rankCard + medianCard + '</div>' : '';
        return renderDistribution(cc, ctx) + cardsHtml;
    }

    function renderRankSensitivity(data) {
        const rs = data.rankSensitivity;
        if (!rs || !rs.available) return '';
        const ctx = data.context;
        const items = [];
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
        const ctx = data.context;
        const hp = data.historicalPosition;
        if (!hp) return '';

        const flags = [];
        if (hp.isNewHigh) flags.push(t('INSIGHTS_NEW_HIGH'));
        else if (hp.nearHigh) flags.push(t('INSIGHTS_NEAR_HIGH'));
        if (hp.isNewLow) flags.push(t('INSIGHTS_NEW_LOW'));
        else if (hp.nearLow) flags.push(t('INSIGHTS_NEAR_LOW'));

        const peakCard = card({
            label: t('INSIGHTS_HISTORICAL_MAX'),
            value: esc(formatPrice(hp.max, ctx)),
            sub: esc(t('INSIGHTS_PEAK_PERIOD') + ': ' + hp.peakPeriod + (hp.periodsSincePeak != null ? ' (' + hp.periodsSincePeak + ')' : '')),
            whatItIs: t('INSIGHTS_WHAT_HIST_MAX'),
            calculation: "Max(Price_t over all available semesters)",
            purpose: t('INSIGHTS_PURPOSE_HIST_MAX')
        });

        const minCard = card({
            label: t('INSIGHTS_HISTORICAL_MIN'),
            value: esc(formatPrice(hp.min, ctx)),
            whatItIs: t('INSIGHTS_WHAT_HIST_MIN'),
            calculation: "Min(Price_t over all available semesters)",
            purpose: t('INSIGHTS_PURPOSE_HIST_MIN')
        });

        const percentileValue = hp.historicalPercentile != null ? esc(Math.round(hp.historicalPercentile) + '%') : null;
        const percentileCalc = hp.historicalPercentile != null
            ? '(Count(P_hist < P_current) + 0.5 × Count(P_hist = P_current)) / N × 100 = <strong>' + Math.round(hp.historicalPercentile) + '%</strong>'
            : null;
        const percentileCard = card({
            label: t('INSIGHTS_PERCENTILE'),
            value: percentileValue,
            sub: flags.length ? flags.map(esc).join(' &middot; ') : null,
            whatItIs: t('INSIGHTS_WHAT_HIST_PERCENTILE'),
            calculation: percentileCalc,
            purpose: t('INSIGHTS_PURPOSE_HIST_PERCENTILE')
        });

        const persistent = data.persistentPosition;
        let persistentNote = '';
        if (persistent) {
            const persistentText = persistent.persistentlyHigh ? t('INSIGHTS_PERSISTENTLY_HIGH')
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
        const dev = data.development;
        if (!dev) return '';
        const ctx = data.context;
        let cards = '';

        if (dev.momentum) {
            const momentumKeyMap = {
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
            const cagr = dev.cagr5 || dev.cagr2;
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
            const sp = dev.seasonalPattern;
            const seasonalNote = sp.deviation != null
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

        let movementNote = '';
        if (dev.consecutiveMovement && dev.consecutiveMovement.count > 1) {
            const moveKey = dev.consecutiveMovement.direction === 'increase' ? 'INSIGHTS_CONSECUTIVE_INCREASE' : 'INSIGHTS_CONSECUTIVE_DECREASE';
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
        const radius = 54;
        const circumference = 2 * Math.PI * radius;
        let offset = 0;

        const totalShare = components.reduce((acc, c) => acc + (c.share || 0), 0) || 100;

        const circles = components.map((c) => {
            const share = c.share || 0;
            const pct = share / totalShare;
            const dashLen = pct * circumference;
            const gapLen = circumference - dashLen;
            const color = (typeof colors !== 'undefined' && colors[c.code]) || '#0E47CB';

            const circleSvg = '<circle cx="72.5" cy="72.5" r="' + radius + '" fill="transparent" ' +
                'stroke="' + color + '" stroke-width="22" ' +
                'stroke-dasharray="' + dashLen.toFixed(2) + ' ' + gapLen.toFixed(2) + '" ' +
                'stroke-dashoffset="' + (-offset).toFixed(2) + '"></circle>';

            offset += dashLen;
            return circleSvg;
        }).join('');

        const priceText = latestPrice != null ? esc(formatPrice(latestPrice, ctx)) : '—';

        const legendItems = components.map((c) => {
            const color = (typeof colors !== 'undefined' && colors[c.code]) || '#0E47CB';
            return '<div class="insights-donut-legend__item">' +
                '<span class="insights-donut-legend__badge">' +
                '<span class="insights-donut-legend__dot" style="background:' + color + '"></span>' +
                '<span>' + esc(t(c.code)) + '</span>' +
                '</span>' +
                '<strong>' + esc(formatNumber(c.share, 1)) + '%</strong>' +
                '</div>';
        }).join('');

        const svg = '<svg class="insights-donut-svg" viewBox="0 0 145 145" aria-hidden="true" role="img">' +
            '<circle cx="72.5" cy="72.5" r="' + radius + '" fill="transparent" stroke="#f1f5f9" stroke-width="22"></circle>' +
            circles +
            '</svg>';

        return '<div class="insights-donut-container" role="region" aria-label="' + esc(t('INSIGHTS_COMPOSITION')) + '">' +
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
        const total = snap.reportingCountries;
        if (!total) return '';

        const radius = 54;
        const circumference = 2 * Math.PI * radius;

        const risingPct = snap.rising / total;
        const fallingPct = snap.falling / total;
        const stablePct = snap.stable / total;

        const risingDash = risingPct * circumference;
        const fallingDash = fallingPct * circumference;
        const stableDash = stablePct * circumference;

        const offset1 = risingDash;
        const offset2 = risingDash + fallingDash;

        const circleRising = '<circle cx="72.5" cy="72.5" r="' + radius + '" fill="transparent" stroke="#b91c1c" stroke-width="20" stroke-dasharray="' + risingDash.toFixed(2) + ' ' + (circumference - risingDash).toFixed(2) + '" stroke-dashoffset="0"></circle>';
        const circleFalling = '<circle cx="72.5" cy="72.5" r="' + radius + '" fill="transparent" stroke="#15803d" stroke-width="20" stroke-dasharray="' + fallingDash.toFixed(2) + ' ' + (circumference - fallingDash).toFixed(2) + '" stroke-dashoffset="' + (-offset1).toFixed(2) + '"></circle>';
        const circleStable = '<circle cx="72.5" cy="72.5" r="' + radius + '" fill="transparent" stroke="#1d4ed8" stroke-width="20" stroke-dasharray="' + stableDash.toFixed(2) + ' ' + (circumference - stableDash).toFixed(2) + '" stroke-dashoffset="' + (-offset2).toFixed(2) + '"></circle>';

        const svg = '<svg class="insights-donut-svg" viewBox="0 0 145 145" aria-hidden="true" role="img">' +
            '<circle cx="72.5" cy="72.5" r="' + radius + '" fill="transparent" stroke="#f1f5f9" stroke-width="20"></circle>' +
            circleRising + circleFalling + circleStable +
            '</svg>';

        const legendItems =
            '<div class="insights-donut-legend__item"><span class="insights-donut-legend__badge"><span class="insights-donut-legend__dot" style="background:#b91c1c"></span><span>' + esc(t('INSIGHTS_RISING_COUNTRIES')) + '</span></span><strong>' + snap.rising + '</strong></div>' +
            '<div class="insights-donut-legend__item"><span class="insights-donut-legend__badge"><span class="insights-donut-legend__dot" style="background:#15803d"></span><span>' + esc(t('INSIGHTS_FALLING_COUNTRIES')) + '</span></span><strong>' + snap.falling + '</strong></div>' +
            '<div class="insights-donut-legend__item"><span class="insights-donut-legend__badge"><span class="insights-donut-legend__dot" style="background:#1d4ed8"></span><span>' + esc(t('INSIGHTS_STABLE_COUNTRIES')) + '</span></span><strong>' + snap.stable + '</strong></div>';

        return '<div class="insights-donut-container" role="region" aria-label="' + esc(t('INSIGHTS_EUROPE_SNAPSHOT')) + '">' +
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
        const maxVal = Math.max(cc.valA, cc.valB) || 1;

        const pctA = Math.max(5, (cc.valA / maxVal) * 100);
        const pctB = Math.max(5, (cc.valB / maxVal) * 100);

        return '<div class="insights-comparison-barchart" role="region" aria-label="' + esc(t('INSIGHTS_DIRECT_COMPARISON')) + '">' +
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
            '<div class="insights-comparison-barchart__fill" style="width:' + pctB.toFixed(1) + '%;background:#0284c7"></div>' +
            '</div>' +
            '<span class="insights-comparison-barchart__value">' + esc(formatPrice(cc.valB, ctx)) + '</span>' +
            '</div>' +
            '</div>';
    }

    // ---- composition ----------------------------------------------------------------------------

    function renderComposition(data) {
        const comp = data.composition;
        const ctx = data.context;
        if (!comp || !comp.hasData) {
            return '<p class="insights-no-prev">' + esc(t('INSIGHTS_NO_COMPONENT_DATA')) + '</p>';
        }

        const validComponents = comp.components.filter((c) => c.latest != null);
        const donut = renderDoughnutChart(validComponents, data.price.latestValue, ctx);
        const bar = renderCompositionBar(validComponents);

        const rows = validComponents.map((c) => {
            const color = (typeof colors !== 'undefined' && colors[c.code]) || '#0E47CB';
            return '<div class="insights-mini-profile__item">' +
                '<span class="insights-mini-profile__label"><i class="fas fa-square" style="color:' + color + ';font-size:0.6rem;margin-right:0.3rem" aria-hidden="true"></i>' + esc(t(c.code)) + '</span>' +
                '<span class="insights-mini-profile__value">' + esc(formatPrice(c.latest, ctx)) +
                (c.share != null ? ' (' + esc(formatNumber(c.share, 1)) + '%)' : '') + '</span>' +
                '</div>';
        }).join('');

        let driverText = '';
        if (comp.dominant) {
            driverText = t(comp.dominant.deltaYoy >= 0 ? 'INSIGHTS_MAIN_UPWARD_DRIVER' : 'INSIGHTS_MAIN_DOWNWARD_DRIVER') + ': ' + t(comp.dominant.code);
        } else if (comp.mainUpward || comp.mainDownward) {
            const parts = [];
            if (comp.mainUpward) parts.push(t('INSIGHTS_MAIN_UPWARD_DRIVER') + ': ' + t(comp.mainUpward.code));
            if (comp.mainDownward) parts.push(t('INSIGHTS_MAIN_DOWNWARD_DRIVER') + ': ' + t(comp.mainDownward.code));
            driverText = parts.join(' · ');
        } else {
            driverText = t('INSIGHTS_MIXED_MOVEMENT');
        }

        const globalSummary = data.globalComponentSummary;
        let globalHtml = '';
        if (globalSummary && globalSummary.available && globalSummary.mostDivergent) {
            const g = globalSummary.mostDivergent;
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
        const fe = data.fiscalEffect;
        const ctx = data.context;
        if (!fe || fe.classification === 'unavailable') {
            return '<p class="insights-no-prev">' + esc(t('INSIGHTS_FISCAL_UNAVAILABLE')) + '</p>';
        }

        const classificationKeyMap = {
            cushioned: 'INSIGHTS_FISCAL_CUSHIONED', amplified: 'INSIGHTS_FISCAL_AMPLIFIED',
            offsetDecrease: 'INSIGHTS_FISCAL_OFFSET_DECREASE', oppositeUp: 'INSIGHTS_FISCAL_OPPOSITE_UP',
            oppositeDown: 'INSIGHTS_FISCAL_OPPOSITE_DOWN', neutral: 'INSIGHTS_FISCAL_NEUTRAL'
        };

        const preTaxCard = card({
            label: t('INSIGHTS_PRETAX_CHANGE'),
            value: esc(formatPrice(fe.deltaPreTax, ctx)),
            whatItIs: t('INSIGHTS_WHAT_PRETAX'),
            calculation: "Price_preTax_latest − Price_preTax_prior = <strong>" + formatRaw(fe.deltaPreTax, ctx) + "</strong>",
            purpose: t('INSIGHTS_PURPOSE_PRETAX')
        });

        const finalCard = card({
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
        const rs = data.rankShift;
        if (!rs || !rs.available) {
            return '<p class="insights-no-prev">' + esc(t('INSIGHTS_PPS_UNAVAILABLE')) + '</p>';
        }
        const classificationKeyMap = { higherInPps: 'INSIGHTS_PPS_HIGHER', lowerInPps: 'INSIGHTS_PPS_LOWER', similar: 'INSIGHTS_PPS_SIMILAR' };

        const eurCard = card({
            label: t('INSIGHTS_EUR_RANK'),
            value: esc(rs.rankEur + ' / ' + rs.cohortSize),
            whatItIs: t('INSIGHTS_WHAT_EUR_RANK'),
            calculation: t('INSIGHTS_CALC_RANK_EUR'),
            purpose: t('INSIGHTS_PURPOSE_EUR_RANK')
        });

        const ppsCard = card({
            label: t('INSIGHTS_PPS_RANK'),
            value: esc(rs.rankPps + ' / ' + rs.cohortSize),
            whatItIs: t('INSIGHTS_WHAT_PPS_RANK'),
            calculation: t('INSIGHTS_CALC_RANK_PPS'),
            purpose: t('INSIGHTS_PURPOSE_PPS_RANK')
        });

        const shiftCard = card({
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
        const snap = data.europeSnapshot;
        const ctx = data.context;
        if (!snap || !snap.reportingCountries) return '';

        const donut = renderEuropeDonut(snap);

        const directionCard = card({
            label: t('INSIGHTS_DISPERSION'),
            value: snap.dispersionChangePct != null ? esc(formatPercent(snap.dispersionChangePct)) : null,
            sub: snap.dispersionClassification !== 'unknown'
                ? esc(t(snap.dispersionClassification === 'converging' ? 'INSIGHTS_CONVERGING' : (snap.dispersionClassification === 'diverging' ? 'INSIGHTS_DIVERGING' : 'INSIGHTS_DISPERSION_STABLE')))
                : null,
            whatItIs: t('INSIGHTS_WHAT_DISPERSION'),
            calculation: "(IQR_latest − IQR_prior) / IQR_prior × 100",
            purpose: t('INSIGHTS_PURPOSE_DISPERSION')
        });

        const movers = snap.topRising.slice(0, 3).map((r) => {
            return '<span class="insight-rank-item"><span class="insight-rank-up">▲</span> ' + esc(t(r.geo)) + ' ' + esc(formatPercent(r.yoyPct)) + '</span>';
        }).concat(snap.topFalling.slice(0, 3).map((r) => {
            return '<span class="insight-rank-item"><span class="insight-rank-down">▼</span> ' + esc(t(r.geo)) + ' ' + esc(formatPercent(r.yoyPct)) + '</span>';
        })).join(' ');

        return donut +
            '<div class="insights-cards">' + directionCard + '</div>' +
            (movers ? '<div class="insights-rank-movement"><div class="insights-rank-movement__label">' + esc(t('INSIGHTS_TOP_MOVERS')) + '</div>' +
                '<div class="insights-rank-movement__items">' + movers + '</div></div>' : '');
    }

    // ---- consumption band ------------------------------------------------------------------------------

    function renderBandSection(data) {
        const bp = data.bandPattern;
        const ctx = data.context;
        if (!bp) return '';

        const patternKeyMap = { increasing: 'INSIGHTS_PATTERN_INCREASING', decreasing: 'INSIGHTS_PATTERN_DECREASING', flat: 'INSIGHTS_PATTERN_FLAT', mixed: 'INSIGHTS_PATTERN_MIXED' };
        const bars = renderBandBars(bp.bands, ctx.band, ctx);

        const premiumCard = (bp.referenceValue != null && bp.selectedBand !== bp.referenceBand) ? card({
            label: t('INSIGHTS_BAND_PREMIUM'),
            value: esc(formatPercent(bp.bandGapPct)),
            sub: esc(t(ctx.band) + ' vs ' + t(bp.referenceBand)),
            whatItIs: t('INSIGHTS_WHAT_BAND_PREMIUM'),
            calculation: '(' + formatRaw(bp.selectedValue, ctx) + ' − ' + formatRaw(bp.referenceValue, ctx) + ') / |' + formatRaw(bp.referenceValue, ctx) + '| × 100 = <strong>' + esc(formatPercent(bp.bandGapPct)) + '</strong>',
            purpose: t('INSIGHTS_PURPOSE_BAND_PREMIUM')
        }) : '';

        const patternCard = card({
            label: t('INSIGHTS_BAND_PATTERN'),
            value: esc(t(patternKeyMap[bp.pattern])),
            whatItIs: t('INSIGHTS_WHAT_BAND_PATTERN'),
            calculation: "Evaluation of monotonicity across ordered consumption bands",
            purpose: t('INSIGHTS_PURPOSE_BAND_PATTERN')
        });

        const spread = data.bandSpreadOverTime;
        let spreadHtml = '';
        if (spread) {
            const spreadKeyMap = { widened: 'INSIGHTS_SPREAD_WIDENED', narrowed: 'INSIGHTS_SPREAD_NARROWED', stable: 'INSIGHTS_SPREAD_STABLE' };
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
        const ic = data.inflationComparison;
        if (!ic) return '';
        const energyCard = card({
            label: t('INSIGHTS_ENERGY_YOY'),
            value: esc(formatPercent(ic.energyYoyPct)),
            whatItIs: t('INSIGHTS_WHAT_HICP_ENERGY'),
            calculation: "Energy YoY %",
            purpose: t('INSIGHTS_PURPOSE_HICP_ENERGY')
        });
        const hicpCard = card({
            label: t('INSIGHTS_HICP_YOY'),
            value: esc(formatPercent(ic.hicpYoyPct)),
            sub: esc(ic.month),
            whatItIs: t('INSIGHTS_WHAT_HICP_ALL'),
            calculation: "HICP RCH_A series rate",
            purpose: t('INSIGHTS_PURPOSE_HICP_ALL')
        });
        const gapCard = card({
            label: t('INSIGHTS_INFLATION_CONTEXT'),
            value: esc(formatPercent(ic.gap)) + ' pp',
            whatItIs: t('INSIGHTS_WHAT_INFLATION_GAP'),
            calculation: "Energy_YoY% (" + formatPercent(ic.energyYoyPct) + ") − HICP_YoY% (" + formatPercent(ic.hicpYoyPct) + ") = <strong>" + formatPercent(ic.gap) + " pp</strong>",
            purpose: t('INSIGHTS_PURPOSE_INFLATION_GAP')
        });
        return '<div class="insights-cards">' + energyCard + hicpCard + gapCard + '</div>' +
            '<p class="insights-note"><i class="fas fa-circle-info" aria-hidden="true"></i> ' + esc(t('INSIGHTS_RELATED_CONTEXT_NOTE')) + '</p>';
    }

    // ---- data quality / freshness / safeguards / provenance ---------------------------------------------

    function renderDataQuality(data) {
        const dq = data.dataQuality;
        const prov = dq.provenance;
        const ctx = data.context;

        const statusText = dq.isProvisional ? t('INSIGHTS_PROVISIONAL')
            : (dq.isEstimated ? t('INSIGHTS_ESTIMATED') : t('INSIGHTS_STATUS_NORMAL'));

        const statusCard = card({
            label: t('INSIGHTS_DATA_STATUS'),
            value: esc(dq.latestStatus ? 'Flag: [' + dq.latestStatus + ']' : 'Final'),
            sub: esc(statusText),
            explanation: t('INSIGHTS_PROVISIONAL')
        });

        const anomalyText = (dq.anomalies && dq.anomalies.length > 0)
            ? dq.anomalies.map((a) => t('INSIGHTS_ANOMALY_' + a.toUpperCase())).join(', ')
            : t('INSIGHTS_SAFEGUARD_OK');

        const safeguardCard = card({
            label: t('INSIGHTS_ANOMALY_CHECK'),
            value: (dq.anomalies && dq.anomalies.length > 0) ? 'Flagged' : 'Passed',
            sub: esc(anomalyText),
            explanation: t('INSIGHTS_ANOMALY_CHECK')
        });

        const provSub = prov ? (
            esc(t('INSIGHTS_DATASET_PRICE_NOTE')) + ': <strong>' + esc(prov.priceDataset) + '</strong> (' + esc(prov.pricePeriod) + ') &bull; ' +
            esc(t('INSIGHTS_DATASET_COMPONENT_NOTE')) + ': <strong>' + esc(prov.componentDataset) + '</strong> (' + esc(prov.componentPeriod) + ')'
        ) : '—';

        const priceDs = prov ? prov.priceDataset : 'nrg_pc_204';
        const compDs = prov ? prov.componentDataset : 'nrg_pc_204_c';

        const provenanceCard = card({
            label: t('INSIGHTS_DATASET_PROVENANCE'),
            value: esc(priceDs + ' vs ' + compDs),
            sub: provSub,
            whatItIs: "Methodological reconciliation between bi-annual total prices (" + priceDs + ": S1 & S2) and annual disaggregated component breakdowns (" + compDs + ": Energy, Network, Taxes).",
            calculation: priceDs + " (Bi-annual total) vs " + compDs + " (Annual structural components: Energy + Network + Taxes)",
            purpose: "Guides proper cross-referencing between bi-annual trend tracking and annual structural cost driver analysis."
        });

        const datasetReconciliationBox = '<div class="insights-summary" style="margin-top:0.75rem">' +
            '<strong><i class="fas fa-database" aria-hidden="true"></i> Dataset Reconciliation (' + esc(priceDs) + ' vs ' + esc(compDs) + '):</strong> ' +
            '<span>' + esc(priceDs) + ' tracks bi-annual price trends (S1 & S2), while ' + esc(compDs) + ' disaggregates annual structural cost drivers (Energy, Network, Taxes). Use ' + esc(priceDs) + ' for short-term price momentum and ' + esc(compDs) + ' to explain structural tariff shifts. Minor discrepancies in component sums occur due to national volume weighting and policy support cost allocations.</span>' +
            '</div>';

        const consumerQualBox = '<div class="insights-summary" style="margin-top:0.5rem">' +
            '<strong><i class="fas fa-users" aria-hidden="true"></i> ' + esc(t('INSIGHTS_CONSUMER_QUALIFICATION')) + ' (' + esc(t(ctx.consumer)) + '):</strong> ' +
            esc(t('INSIGHTS_CONSUMER_QUALIFICATION_DESC')) +
            '</div>';

        return '<div class="insights-cards">' + statusCard + safeguardCard + provenanceCard + '</div>' + datasetReconciliationBox + consumerQualBox;
    }

    // ---- export toolbar & interactive consumer tools ---------------------------------------------------

    function renderToolbar() {
        return '<div class="insights-toolbar" role="toolbar" aria-label="' + esc(t('INSIGHTS_TOOLBAR') || 'Insights Actions') + '">' +
            '<div class="insights-toolbar__group">' +
            '<button type="button" class="insight-btn" onclick="insightsRenderNameSpace.copyText()" aria-label="' + esc(t('INSIGHTS_COPY_TEXT')) + '"><i class="fas fa-copy" aria-hidden="true"></i> <span>' + esc(t('INSIGHTS_COPY_TEXT')) + '</span></button>' +
            '<button type="button" class="insight-btn" onclick="insightsRenderNameSpace.exportCsv()" aria-label="' + esc(t('INSIGHTS_EXPORT_CSV')) + '"><i class="fas fa-file-csv" aria-hidden="true"></i> <span>' + esc(t('INSIGHTS_EXPORT_CSV')) + '</span></button>' +
            '<button type="button" class="insight-btn" onclick="copyUrl()" aria-label="' + esc(t('SHARE')) + '"><i class="fas fa-share-nodes" aria-hidden="true"></i> <span>' + esc(t('SHARE')) + '</span></button>' +
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
        const ctx = data.context;
        const currentConsumption = userConsumption !== null ? userConsumption : getDefaultConsumption(ctx);
        const unitName = esc(t('S_' + ctx.unit));

        const cost = insightsDataNameSpace.computeAnnualCost(data.price.latestValue, currentConsumption);
        const costFormatted = cost !== null ? formatPrice(cost, ctx) : '—';
        const stepText = formatRaw(currentConsumption, ctx) + ' ' + unitName + ' &times; ' + formatRaw(data.price.latestValue, ctx) + ' ' + unitLabel(ctx);

        const estimatorCard = '<div class="insights-widget-card" role="region" aria-label="' + esc(t('INSIGHTS_COST_ESTIMATOR')) + '">' +
            '<div class="insights-widget-card__title"><i class="fas fa-calculator" aria-hidden="true"></i> ' + esc(t('INSIGHTS_COST_ESTIMATOR')) + '</div>' +
            '<div class="insights-input-group">' +
            '<label for="insightConsumptionInput" class="insights-input-label">' + esc(t('INSIGHTS_ANNUAL_CONSUMPTION')) + ':</label>' +
            '<input type="number" id="insightConsumptionInput" class="insight-input" value="' + currentConsumption + '" step="any" min="0" onchange="insightsRenderNameSpace.onConsumptionChange(this.value)" aria-label="' + esc(t('INSIGHTS_ANNUAL_CONSUMPTION')) + '">' +
            '<span>' + unitName + ' / ' + esc(t('INSIGHTS_PERIOD').toLowerCase()) + '</span>' +
            '</div>' +
            '<div class="insights-widget-result">' + esc(t('INSIGHTS_ESTIMATED_COST')) + ': <strong>' + esc(costFormatted) + '</strong></div>' +
            '<div class="insights-widget-sub">' + stepText + '</div>' +
            '<p class="insight-card__note" style="margin-top:0.4rem">' + esc(t('INSIGHTS_COST_DISCLAIMER')) + '</p>' +
            '</div>';

        const bandRows = data.bandPattern ? data.bandPattern.bands : [];
        const matched = insightsDataNameSpace.findBandForConsumption(bandRows, currentConsumption);
        const finderSub = matched ? esc(t('INSIGHTS_MATCHING_BAND')) + ': <strong>' + esc(t(matched.band)) + '</strong>' : esc(t('INSIGHTS_NOT_AVAILABLE'));
        const isCurrent = matched && matched.band === ctx.band;

        const switchBtn = (matched && !isCurrent)
            ? '<button type="button" class="insight-btn insight-btn--sm" style="margin-top:0.4rem" onclick="insightsRenderNameSpace.switchBand(\'' + matched.band + '\')" aria-label="' + esc(t('INSIGHTS_SWITCH_BAND')) + '"><i class="fas fa-exchange-alt" aria-hidden="true"></i> ' + esc(t('INSIGHTS_SWITCH_BAND')) + '</button>'
            : (isCurrent ? '<span class="insight-badge insight-stable" style="margin-top:0.4rem"><i class="fas fa-check" aria-hidden="true"></i> ' + esc(t('INSIGHTS_BAND')) + ' ' + esc(t('INSIGHTS_STABLE')) + '</span>' : '');

        const finderCard = '<div class="insights-widget-card" role="region" aria-label="' + esc(t('INSIGHTS_BAND_FINDER')) + '">' +
            '<div class="insights-widget-card__title"><i class="fas fa-filter" aria-hidden="true"></i> ' + esc(t('INSIGHTS_BAND_FINDER')) + '</div>' +
            '<div class="insights-widget-result" style="font-size:0.9rem">' + finderSub + '</div>' +
            switchBtn +
            '</div>';

        return '<div class="insights-widget-row">' + estimatorCard + finderCard + '</div>';
    }

    function renderCountryComparisonSection(data) {
        const ctx = data.context;
        const countryList = Object.keys(energyCountries).filter((g) => {
            return g !== ctx.geo && g !== 'EU27_2020' && g !== 'EA';
        });

        // Set default partner country if none selected yet
        if (!selectedCountryB && countryList.length > 0) {
            selectedCountryB = countryList.includes('BE') ? 'BE' : countryList[0];
        }

        const optionsHtml = '<option value="">-- ' + esc(t('INSIGHTS_COMPARE_WITH')) + ' --</option>' +
            countryList.map((g) => {
                const selected = g === selectedCountryB ? ' selected' : '';
                return '<option value="' + g + '"' + selected + '>' + esc(t(g)) + ' (' + g + ')</option>';
            }).join('');

        const selectorHtml = renderEclSelect({
            id: 'insightCountryBSelect',
            name: 'countryB',
            label: t('INSIGHTS_COMPARE_WITH') + ' (' + t(ctx.geo) + ' vs.)',
            optionsHtml: optionsHtml,
            onChange: 'insightsRenderNameSpace.onCountryBChange(this.value)',
            containerClass: 'ecl-select__container--m'
        });

        const cc = data.countryComparison;
        let comparisonBody = '';
        if (cc) {
            const barChart = renderComparisonBarChart(cc, ctx);
            const valACard = card({ label: t('INSIGHTS_FOCUS_COUNTRY') + ': ' + t(ctx.geo), value: esc(formatPrice(cc.valA, ctx)) });
            const valBCard = card({ label: t('INSIGHTS_PARTNER_COUNTRY') + ': ' + t(cc.countryB), value: esc(formatPrice(cc.valB, ctx)) });
            const gapCard = card({
                label: t('INSIGHTS_COUNTRY_GAP'),
                value: esc(formatPercent(cc.gapPct)),
                sub: esc(formatPrice(cc.gapAbs, ctx)) + ' (' + esc(cc.gapAbs > 0 ? t(ctx.geo) : t(cc.countryB)) + ' ' + esc(t('INSIGHTS_RISING').toLowerCase()) + ')'
            });

            const driverText = cc.mainDriver ? esc(t('INSIGHTS_MAIN_GAP_DRIVER')) + ': <strong>' + esc(t(cc.mainDriver.code)) + '</strong> (' + esc(formatPrice(cc.mainDriver.gap, ctx)) + ')' : '';

            comparisonBody = barChart + '<div class="insights-cards">' + valACard + valBCard + gapCard + '</div>' +
                (driverText ? '<p class="insights-summary">' + driverText + '</p>' : '');
        }

        return selectorHtml + comparisonBody;
    }

    // ---- top-level render -------------------------------------------------------------------------------

    let cachedData = null;
    let userConsumption = null;
    let selectedCountryB = null;

    function render(data) {
        cachedData = data;
        cardIdCounter = 0;

        const priceInfo = {
            whatItIs: t('INSIGHTS_EXPLAIN_LATEST_PRICE'),
            calculation: t('INSIGHTS_CALC_LATEST_PRICE'),
            purpose: t('INSIGHTS_PURPOSE_LATEST_PRICE')
        };

        const euInfo = {
            whatItIs: t('INSIGHTS_EXPLAIN_EU_COMPARISON'),
            calculation: t('INSIGHTS_CALC_EU_COMPARISON'),
            purpose: t('INSIGHTS_PURPOSE_EU_GAP')
        };

        const directInfo = {
            whatItIs: t('INSIGHTS_EXPLAIN_COUNTRY_COMPARISON'),
            calculation: t('INSIGHTS_CALC_COUNTRY_COMPARISON'),
            purpose: t('INSIGHTS_PURPOSE_RANK')
        };

        const historyInfo = {
            whatItIs: t('INSIGHTS_EXPLAIN_HISTORICAL'),
            calculation: t('INSIGHTS_CALC_HISTORICAL'),
            purpose: t('INSIGHTS_PURPOSE_HIST_MAX')
        };

        const devInfo = {
            whatItIs: t('INSIGHTS_EXPLAIN_DEVELOPMENT'),
            calculation: t('INSIGHTS_CALC_DEVELOPMENT'),
            purpose: t('INSIGHTS_PURPOSE_MOMENTUM')
        };

        const compInfo = {
            whatItIs: t('INSIGHTS_EXPLAIN_COMPOSITION'),
            calculation: t('INSIGHTS_CALC_COMPOSITION'),
            purpose: t('INSIGHTS_PURPOSE_PRETAX')
        };

        const fiscalInfo = {
            whatItIs: t('INSIGHTS_EXPLAIN_FISCAL'),
            calculation: t('INSIGHTS_CALC_FISCAL'),
            purpose: t('INSIGHTS_PURPOSE_FINAL')
        };

        const ppsInfo = {
            whatItIs: t('INSIGHTS_EXPLAIN_PPS'),
            calculation: t('INSIGHTS_CALC_PPS'),
            purpose: t('INSIGHTS_PURPOSE_RANK_SHIFT')
        };

        const europeInfo = {
            whatItIs: t('INSIGHTS_EXPLAIN_EUROPE'),
            calculation: t('INSIGHTS_CALC_EUROPE'),
            purpose: t('INSIGHTS_PURPOSE_DISPERSION')
        };

        const bandInfo = {
            whatItIs: t('INSIGHTS_EXPLAIN_BAND'),
            calculation: t('INSIGHTS_CALC_BAND'),
            purpose: t('INSIGHTS_PURPOSE_BAND_PATTERN')
        };

        const inflationInfo = {
            whatItIs: t('INSIGHTS_EXPLAIN_HICP'),
            calculation: t('INSIGHTS_CALC_HICP'),
            purpose: t('INSIGHTS_PURPOSE_INFLATION_GAP')
        };

        const qualityInfo = {
            whatItIs: t('INSIGHTS_EXPLAIN_PROVENANCE'),
            calculation: t('INSIGHTS_CALC_PROVENANCE'),
            purpose: t('INSIGHTS_PURPOSE_PROVENANCE')
        };

        const html = '<div class="insights-panel" tabindex="-1">' +
            renderToolbar() +
            renderContext(data.context, data.latestPeriod) +
            renderEstimatorAndBandFinder(data) +
            '<div class="insights-sections">' +
            section('fa-exchange-alt', t('INSIGHTS_DIRECT_COMPARISON'), renderCountryComparisonSection(data), directInfo) +
            section('fa-euro-sign', t('INSIGHTS_LATEST_PRICE'), renderPriceCards(data), priceInfo) +
            section('fa-globe-europe', t('INSIGHTS_EU_COMPARISON'), renderComparisonCards(data) + renderRankSensitivity(data), euInfo) +
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
        if (typeof ECL !== 'undefined' && typeof ECL.autoInit === 'function') {
            try {
                ECL.autoInit();
            } catch (e) {
                console.warn('[insights] ECL autoInit warning', e);
            }
        }
    }

    function renderLoading() {
        $('#insightsViewBody').html('<p class="insights-no-prev"><i class="fas fa-spinner fa-spin" aria-hidden="true"></i> ' + esc(t('INSIGHTS_LOADING')) + '</p>');
    }

    function renderError() {
        $('#insightsViewBody').html('<p class="insights-no-prev"><i class="fas fa-triangle-exclamation" aria-hidden="true"></i> ' + esc(t('INSIGHTS_ERROR')) + '</p>');
    }

    function load() {
        const requestId = ++currentRequestId;
        renderLoading();

        insightsDataNameSpace.computeSelectedViewInsights({ countryB: selectedCountryB }).then((data) => {
            if (requestId !== currentRequestId) return;
            render(data);
        }).catch((err) => {
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
        const d = cachedData;
        const rows = [
            ['Metric', 'Geography', 'Period', 'Value', 'Unit'],
            ['Latest Price', d.context.geo, d.latestPeriod, d.price.latestValue, d.context.unit],
            ['YoY Change %', d.context.geo, d.latestPeriod, d.price.yoyChangePct, '%'],
            ['Semester Change %', d.context.geo, d.latestPeriod, d.price.semesterChangePct, '%'],
            ['EU Gap %', d.context.geo, d.latestPeriod, d.crossCountry.euGapPct, '%'],
            ['Country Rank', d.context.geo, d.latestPeriod, d.crossCountry.rankHigh + '/' + d.crossCountry.n, 'rank'],
            ['Historical Max', d.context.geo, d.historicalPosition ? d.historicalPosition.peakPeriod : '', d.historicalPosition ? d.historicalPosition.max : '', d.context.unit],
            ['Historical Min', d.context.geo, d.latestPeriod, d.historicalPosition ? d.historicalPosition.min : '', d.context.unit]
        ];

        const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'insights_' + d.context.geo + '_' + d.latestPeriod + '.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function copyText() {
        if (!cachedData) return;
        const d = cachedData;
        const summary = 'ENPRICES Insights Summary (' + d.context.geo + ' - ' + d.latestPeriod + ')\n' +
            'Product: ' + t(d.context.product) + ' (' + t(d.context.consumer) + ')\n' +
            'Latest Price: ' + formatPrice(d.price.latestValue, d.context) + '\n' +
            'YoY Change: ' + formatPercent(d.price.yoyChangePct) + '\n' +
            'EU Comparison: ' + formatPercent(d.crossCountry.euGapPct) + ' vs EU27 average\n' +
            'Country Rank: ' + d.crossCountry.rankHigh + ' / ' + d.crossCountry.n + ' reporting countries\n';

        if (navigator.clipboard) {
            navigator.clipboard.writeText(summary).then(() => {
                alert(t('INSIGHTS_COPIED'));
            });
        }
    }

    let lastActiveElement = null;

    function openModal(btnElem) {
        if ($('#insightInfoPopup').length) {
            closeModal();
            if (lastActiveElement === btnElem) return;
        }

        lastActiveElement = btnElem || document.activeElement;
        if (lastActiveElement && typeof lastActiveElement.setAttribute === 'function') {
            lastActiveElement.setAttribute('aria-expanded', 'true');
        }

        const title = $(btnElem).attr('data-title') || t('INSIGHTS_HOW_CALCULATED');
        const what = $(btnElem).attr('data-what') || '';
        const calc = $(btnElem).attr('data-calc') || '';
        const purpose = $(btnElem).attr('data-purpose') || '';
        const closeText = t('CLOSE') || 'Close';

        const rect = btnElem ? btnElem.getBoundingClientRect() : { top: 100, left: 100, bottom: 120, right: 120 };
        const popoverWidth = Math.min(440, window.innerWidth - 32);

        // Always open to the right side of the info button (or left if near right screen edge)
        let left = rect.right + window.scrollX + 10;
        if (left + popoverWidth > window.innerWidth + window.scrollX - 16) {
            left = rect.left + window.scrollX - popoverWidth - 10;
        }
        if (left < window.scrollX + 16) {
            left = window.scrollX + 16;
        }

        let top = rect.top + window.scrollY - 4;
        if (top < window.scrollY + 16) {
            top = window.scrollY + 16;
        }

        const popoverStyle = 'position:absolute;top:' + Math.round(top) + 'px;left:' + Math.round(left) + 'px;width:' + Math.round(popoverWidth) + 'px;z-index:999999;box-shadow:0 10px 25px -5px rgba(0,0,0,0.25), 0 8px 10px -6px rgba(0,0,0,0.1);';

        const popupHtml =
            '<div class="ecl-popover__container insight-popover-card" id="insightInfoPopup" style="' + popoverStyle + '" role="dialog" aria-modal="true" aria-labelledby="insightInfoTitle" tabindex="-1">' +
            '<div class="ecl-popover__scrollable">' +
            '<button type="button" class="ecl-button ecl-button--tertiary ecl-button--neutral ecl-popover__close ecl-button--icon-only" onclick="insightsRenderNameSpace.closeModal()" aria-label="' + esc(closeText) + '">' +
            '<span class="ecl-button__container">' +
            '<span class="ecl-button__label" data-ecl-label="true">' + esc(closeText) + '</span>' +
            '<span class="wt-icon--close ecl-icon ecl-icon--m ecl-button__icon ecl-icon--close" aria-hidden="true" data-ecl-icon></span>' +
            '</span>' +
            '</button>' +
            '<div class="ecl-popover__content">' +
            '<h4 class="insight-popover-card__title" id="insightInfoTitle" style="margin-top:0;margin-bottom:0.75rem;font-size:0.95rem;font-weight:700;color:#1e293b"><i class="fas fa-info-circle" aria-hidden="true"></i> ' + esc(title) + '</h4>' +
            (what ? '<div class="insight-popover-card__item" style="margin-bottom:0.6rem"><strong><i class="fas fa-question-circle" aria-hidden="true"></i> ' + esc(t('INSIGHTS_WHAT_IT_IS')) + ':</strong> ' + esc(what) + '</div>' : '') +
            (calc ? '<div class="insight-popover-card__item" style="margin-bottom:0.6rem"><strong><i class="fas fa-calculator" aria-hidden="true"></i> ' + esc(t('INSIGHTS_CALCULATION')) + ':</strong> <span>' + calc + '</span></div>' : '') +
            (purpose ? '<div class="insight-popover-card__item"><strong><i class="fas fa-bullseye" aria-hidden="true"></i> ' + esc(t('INSIGHTS_PURPOSE')) + ':</strong> ' + esc(purpose) + '</div>' : '') +
            '</div>' +
            '</div>' +
            '</div>';

        $('#insightInfoPopup').remove();
        $('body').append(popupHtml);

        const popupElem = $('#insightInfoPopup');
        popupElem.focus();

        setTimeout(() => {
            $(document).off('click.insightPopup').on('click.insightPopup', (e) => {
                if (!$(e.target).closest('#insightInfoPopup, .ecl-popover__toggle, .insight-card__info-btn').length) {
                    closeModal();
                }
            });
        }, 10);

        $(document).off('keydown.insightPopup').on('keydown.insightPopup', (e) => {
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
        const popup = $('#insightInfoPopup');
        if (popup.length) {
            popup.fadeOut(100, () => {
                popup.remove();
                if (lastActiveElement) {
                    if (typeof lastActiveElement.setAttribute === 'function') {
                        lastActiveElement.setAttribute('aria-expanded', 'false');
                    }
                    if (typeof lastActiveElement.focus === 'function') {
                        lastActiveElement.focus();
                    }
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

    function switchFocusCountry(newGeo) {
        if (typeof REF !== 'undefined') {
            REF.geo = newGeo;
            if (typeof populateCountries !== 'undefined') {
                populateCountries();
            }
            if (typeof updateChart !== 'undefined') {
                updateChart();
            }
            load();
        }
    }

    return {
        load,
        onConsumptionChange,
        onCountryBChange,
        switchFocusCountry,
        switchBand,
        exportCsv,
        copyText,
        togglePopover,
        closePopover,
        openModal,
        closeModal,
        handleModalOverlayClick
    };
})();

function loadInsights() {
    insightsRenderNameSpace.load();
}
