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
    showInLegend: true,
    dataLabels: {
      enabled: true,
    },
  };


  const pieOpt = {  
    allowPointSelect: true,
    // size: "75%",
    innerSize: "75%",
    showInLegend: true,
    animation: true,
    cursor: "pointer",
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '.8rem',
        fontWeight: 'normal'
    },
    format: "<b>{point.name}</b>:<br>{point.percentage:.1f} %<br>"+ languageNameSpace.labels["VAL"] +" : {point.y:,.4f} " + languageNameSpace.labels["S_" + REF.currency] + "/" + languageNameSpace.labels["S_" + REF.unit],
    },
} 


  
  const fullChart = $(window).width() > 700;

  const legendBig = {
      align: 'right',
      verticalAlign: 'middle',
      layout: 'vertical',
      padding: 3,   
      itemMarginTop: 5,
      itemMarginBottom: 5,
      itemHiddenStyle: {
        color: '#767676'
      },
      itemStyle: {
        fontSize: '.9rem',
        fontWeight: 'light'
      }
  };
  
  const legendSmall = {     
      layout: 'horizontal',
      padding: 3,   
      itemMarginTop: 5,
      itemMarginBottom: 5,
      itemHiddenStyle: {
        color: '#767676'
      },
      itemStyle: {
        fontSize: '.9rem',
        fontWeight: 'light'
      }
  }


  const tooltipFormatter = function() {
    return pieTolltip(this.point);
  };

  const chartOptions = {
    containerId: "chart",
    type: "pie",
    title: chartTitle,
    subtitle: null,
    xAxis: null,
    yAxisFormat: "",
    tooltipFormatter: tooltipFormatter,
    creditsText: credits(),
    creditsHref: "",
    series: [
      {
        data: piedata.reverse().filter(arr => arr[1] > 0),
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
  piedata = []

  d = chartApiCall();

  const tax = REF.component == 1 ? d.Dimension('nrg_prc').id : d.Dimension('tax').id;
  dec = REF.unit == "MWH" ? 0 : 4;
  factor = REF.unit == "MWH" ? 1000 : 1;


  for (i = 0; i < tax.length; i++) {
    if (d.value[i] != null) {

      if (REF.component == 0) {
        const XVAT = d.value[2] - d.value[1];
        const XTAX = d.value[0];
        const REST = d.value[2] - (XTAX + XVAT);
        
        if (XVAT > 0 || XTAX > 0 || REST > 0) {
          piedata.push([
            languageNameSpace.labels[d.Dimension('tax').id[i]],
            i === 0 ? parseFloat((REST * factor).toFixed(dec)) :
            i === 1 ? parseFloat((XTAX * factor).toFixed(dec)) :
            i === 2 ? parseFloat((XVAT * factor).toFixed(dec)) :
            0
          ]);
      }
      } else {
        piedata.push([
          languageNameSpace.labels[tax[i]],
          d.value[i],colors[tax[i]]
        ]);

      }
    }
  }



}
