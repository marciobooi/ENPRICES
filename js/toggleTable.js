function openVizTable() {
  $('#chart').hide();

  setTimeout(function () {
    const chart = $("#chart").highcharts();
    if (chart) {
      chart.viewData();

      const highchartsNumberElements = document.querySelectorAll('table .highcharts-number');

      highchartsNumberElements.forEach(element => {
        const originalValue = parseFloat(element.textContent);

        if (!isNaN(originalValue)) {
          const formattedValue = originalValue.toFixed(2);
          element.textContent = formattedValue;
        }
      });

      // Change the text of table highcharts-data-table-0 header summary to "Data Table"
      $(".highcharts-data-table > table").removeAttr("summary");

      $('button#tb-togle-table').focus()
      $('#toggleTableBtn').focus()

      }
  }, 100);
}

function closeTable() {
  $(".highcharts-data-table > table").hide();
  $("#chart").show();

  $(".highcharts-data-table").css('display', 'none')

  
}
