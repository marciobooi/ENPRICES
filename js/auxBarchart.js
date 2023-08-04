function auxiliarBarGraph() {
  startLoadingAnimation()
  REF.chartId = "barChart";

  const conditions = {
    "4100_HOUSEHOLD_1": "nrg_pc_202_c",
    "4100_HOUSEHOLD_0": "nrg_pc_202",
    "4100_N_HOUSEHOLD_1": "nrg_pc_203_c",
    "4100_N_HOUSEHOLD_0": "nrg_pc_203",
    "6000_HOUSEHOLD_1": "nrg_pc_204_c",
    "6000_HOUSEHOLD_0": "nrg_pc_204",
    "6000_N_HOUSEHOLD_1": "nrg_pc_205_c",
    "6000_N_HOUSEHOLD_0": "nrg_pc_205"
  };

  const datasetKey = `${REF.product}_${REF.consumer}_${REF.component}`;
  REF.dataset = conditions[datasetKey];
  REF.nrg_prc = codesDataset[conditions[datasetKey]].nrg_prc;

  auxBarCateg = [];
  auxBarTotals = [];
  bardata = [];

  const d = chartApiCall();

  const dimension = REF.component == 1 ? "nrg_prc" : "tax";
  const consoms = d.Dimension("nrg_cons").id;
  const taxs = d.Dimension(dimension).id;
  dec = REF.unit == "MWH" ? 0 : 4;
  factor = REF.unit == "MWH" ? 1000 : 1;

  if (REF.chartInDetails == 1) {
    values = taxs.map((tax, cIdx) => {
      val2 = consoms.map((consom, yIdx) => {
        if (auxBarCateg.length < consoms.length) {
          auxBarCateg.push(languageNameSpace.labels[consom]);
        }
        return REF.component
          ? d.value[cIdx * consoms.length + yIdx]
          : d.value[yIdx * taxs.length + cIdx];
      });
      bardata.push({ name: languageNameSpace.labels[tax], data: val2 });
    });

    categoriesAndStacks = auxBarCateg.map((el, i) => {
      if (i >= bardata[0].data.length) {
        return false;
      } else {
        let myObject = {};
        myObject.x = el;
        myObject.code = consoms[i];
        myObject.y = [];

        bardata.forEach((bdEl) => {
          myObject.y.push(bdEl.data[i]);
        });

        if (REF.component == 0) {
          const myXTAX = myObject.y[1];
          const myXVAT = myObject.y[0] - myObject.y[2];
          const rest = myObject.y[0] - (myXTAX + myXVAT);

          myObject.y[0] = parseFloat((rest * factor).toFixed(dec));
          myObject.y[1] = parseFloat((myXTAX * factor).toFixed(dec));
          myObject.y[2] = parseFloat((myXVAT * factor).toFixed(dec));
        }
        return myObject;
      }
    });

    orderedSeries = makeOrderedSeries(categoriesAndStacks);
  } else {
    val2 = consoms.map((consom, yIdx) => {
      const values = taxs.map((tax, cIdx) => d.value[yIdx * taxs.length + cIdx]);
      const tax = REF.component == 1 ? parseFloat((values.reduce((a, b) => a + Number(b), 0) * factor).toFixed(dec)) : parseFloat((values[0] * factor).toFixed(dec));
      auxBarCateg.push(languageNameSpace.labels[consom]);
      auxBarTotals.push([tax]);
    });
  }

  barColors = REF.chartInDetails == 1 ? (REF.component == 1 ? componentColors : detailColors) : ["#7cb5ec"];

  const chartTitle = getTitle();

  const tooltipFormatter = function() {
    return REF.chartInDetails == 1 ? tooltipTable(this.points) : chartNormalTooltip(this.points);
  };

  const xAxis = REF.chartInDetails == 1 ? { reversedStacks: true, categories: categoriesAndStacks.map((e) => e.x) } : { categories: auxBarCateg };
  const series = REF.chartInDetails == 1 ? orderedSeries.reverse() : [{ name: "Total", data: auxBarTotals }];
  const colors = REF.chartInDetails == 1 ? barColors : ["#32afaf"];
  const legend = REF.chartInDetails == 1 ? {enabled:true} : {enabled:false};


  const chartOptions = {
    containerId: "chart",
    type: "column",
    title: chartTitle,
    subtitle: null,
    xAxis: xAxis,
    yAxisFormat: "{value:.2f}",
    tooltipFormatter: tooltipFormatter,
    creditsText: credits(),
    creditsHref: "",
    series: series,
    colors:  colors,
    legend: legend,
    columnOptions: {
      stacking: "normal",
      events: {
        mouseOver: function () {
          var point = this;
          var color = point.color;
          $('path.highcharts-label-box.highcharts-tooltip-box').css('stroke', color);
        }
      }
    },
    seriesOptions: ""
  };
    
  const chart = new Chart(chartOptions);
  chart.createChart();
  stopLoadingAnimation()
}
