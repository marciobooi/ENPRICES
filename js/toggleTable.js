function openVizTable() {
  $('#chart').hide();

  setTimeout(function() {
    const chart = $("#chart").highcharts();
    if (chart) {
      chart.viewData();
      $("table").removeAttr("summary");
    }
  }, 100);
}

function closeTable() {
  $(".highcharts-data-table").hide();
  $("#chart").show();
}
