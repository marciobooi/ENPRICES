function openVizTable() {
  $('#chart').hide();

  setTimeout(function() {
    const chart = $("#chart").highcharts();
    if (chart) {
      chart.viewData();

      // Change the text of table highcharts-data-table-0 header summary to "Data Table"
      $("table").removeAttr("summary");
      $("#menuSwitch > fieldset:nth-child(1)").hide();
      $("#ChartOrder").hide();
      $("#menuSwitch").css({
        "top": "14.2rem",
        "right": "1rem"
      });
    }
  }, 100);
}

function closeTable() {
  $("table").hide();
  $("#chart").show();

  if (REF.chartId === "mainChart") {
    showMenuSwitch();
  }

  if (!isMobile) {
    $("#menuSwitch").css({
      "top": "11rem",
      "right": "1rem"
    });
  }
}
