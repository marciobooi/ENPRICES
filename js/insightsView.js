function openInsightsView() {
    $('#charts').addClass('d-none');
    $('#insightsView').removeClass('d-none');

    $('#chartBtns').children().not('#closeInsightsWrapper').addClass('d-none');
    $('#closeInsightsWrapper').removeClass('d-none');

    var trigger = document.getElementById('insightsChart');
    if (trigger) {
        trigger.setAttribute('aria-expanded', 'true');
    }

    var closeBtn = document.getElementById('btnCloseModalChart');
    if (closeBtn) {
        closeBtn.focus();
    }

    $(document).on('keydown.insightsView', function (event) {
        if (event.key === 'Escape' || event.key === 'Esc') {
            event.preventDefault();
            closeInsightsView();
        }
    });
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
