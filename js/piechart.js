function createPieChart() {
  startLoadingAnimation()
  REF.chartId = "pieChart";

  piechartdata()
 
  const chartTitle = getTitle()

  const pieColors = (REF.component == 1) ?  piecomponentColors : detailColors;
    

  const emptyResponse = d==null || Object.values(d.value).some(x => (x == null && x == ''))


  if (emptyResponse) {
    nullishChart();
    return
  }
  
  const seriesOpt = {
    innerSize: "75%",
    showInLegend: true,
    dataLabels: {
      enabled: true,
    },
  };

  const pieOpt = {  
      allowPointSelect: true,
      animation: true,
      cursor: "pointer",
      dataLabels: {
        enabled: true,
        format: "<b>{point.name}</b>:<br>{point.percentage:.1f} %<br>value: {point.y:,.4f} " +
          languageNameSpace.labels["S_" + REF.currency] +
          "/" +
          languageNameSpace.labels["S_" + REF.unit],
      },
  } 
  
  const fullChart = $(window).width() > 700;

  const legendBig = {
      align: 'right',
      verticalAlign: 'middle',
      layout: 'vertical'
  };
  
  const legendSmall = {     
      layout: 'horizontal'
  }

  const chartOptions = {
    containerId: "chart",
    type: "pie",
    title: chartTitle,
    subtitle: null,
    xAxis: null,
    yAxisFormat: "",
    tooltipFormatter: "",
    creditsText: credits(),
    creditsHref: "",
    series: [
      {
        data: piedata.reverse(),
        name: languageNameSpace.labels["S_" + REF.currency] +"/" +languageNameSpace.labels["S_" + REF.unit],
      },
    ],
    colors: pieColors,
    legend: fullChart? legendBig : legendSmall,
    pieOptions: pieOpt,
    columnOptions: null,
    seriesOptions: seriesOpt,
  
  };
  
  const chart = new Chart(chartOptions);
  chart.createChart();
  stopLoadingAnimation()

}


function piechartdata() {
  piedata = [];

  d = chartApiCall();

  const tax = REF.component == 1 ? d.Dimension('nrg_prc').id : d.Dimension('tax').id;
  dec = REF.unit == "MWH" ? 0 : 4;
  factor = REF.unit == "MWH" ? 1000 : 1;

  log(tax)

  for (i = 0; i < tax.length; i++) {
    if (d.value[i] != null) {
      const XVAT = d.value[2] - d.value[1];
      const XTAX = d.value[0];
      const REST = d.value[2] - (XTAX + XVAT);

      if (REF.component == 0) {
        piedata.push([
          languageNameSpace.labels[d.Dimension('tax').id[i]],
          i === 0 ? parseFloat((REST * factor).toFixed(dec)) :
          i === 1 ? parseFloat((XTAX * factor).toFixed(dec)) :
          i === 2 ? parseFloat((XVAT * factor).toFixed(dec)) :
          0
        ]);
      } else {
        piedata.push([
          languageNameSpace.labels[tax[i]],
          d.value[i],colors[tax[i]]
        ]);

        log(languageNameSpace.labels[tax[i]],tax[i], colors[tax[i]])
      }
    }
  }
}
