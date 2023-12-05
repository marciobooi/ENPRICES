function chartdata(d = null) {

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
  REF.nrg_prc = codesDataset[conditions[datasetKey]].nrg_prc
  REF.product = codesDataset[conditions[datasetKey]].product

  if(REF.geos == null || REF.geos == '') {
    REF.geos = defGeos
  } else {
    REF.geos = REF.geos
  }
  d = chartApiCall();

  geos = d.Dimension("geo").id;
  tax = REF.component == 1 ? d.Dimension('nrg_prc').id : REF.taxs;  
  dec = REF.unit == "MWH" ? 0 : 4;
  factor = REF.unit == "MWH" ? 1000 : 1;
  

  geo = d.Dimension("geo").id;

  barcateg = []
  bardata = [];

  const isEmpty = Object.values(d.value).every(x => x == null || x == '');

  if (isEmpty) { nullishChart(); return;}

  if (REF.detail == 1) {
    for (var item in tax) {
      data = [];
      for (var j = 0; j < geo.length; j++) {
        data.push(d.value[0]);
        d.value.shift();
        if (barcateg.length < geo.length) {
          barcateg.push(languageNameSpace.labels[geo[j]]);
        }
      }     
      barobj = {
        name: languageNameSpace.labels[tax[item]],
        data: data,
        color: colors[tax[item]]
      };
      bardata.push(barobj);
    }

    categoriesAndStacks = barcateg.map((el, i) => {
      if (i >= bardata[0].data.length) {
        return false;
      } else {
        let myObject = {};
        myObject.x = el;
        myObject.code = geo[i];
        myObject.y = [];

        // console.log(myObject)

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
        // console.log(myObject)
        return myObject;
      }
    });

   
  } else {
    bartotals = [];

    bardata = bartotals;

    val2 = geos.map((geo, yIdx) => {
      values = tax.map((tax, cIdx, tidx) => {
        num = d.value[cIdx * geos.length + yIdx];
        return parseFloat((num * factor).toFixed(dec));
      });
      const taxValue = REF.component == 1
      ? parseFloat((values.reduce((a, b) => a + Number(b), 0) * factor).toFixed(dec))
      : parseFloat((values[0] * factor).toFixed(dec));

      barcateg.push(languageNameSpace.labels[geo]);

      const languageLabel = languageNameSpace.labels[geo];
      const color = geo == "EU27_2020" ? '#CCA300' : (geo == "EA" ? '#208486' : "#0E47CB");
      bartotals.push({ name: languageLabel, y: taxValue, color }); 
    });
  }


  const detail = REF.detail;
  const order = REF.order;

  
  const makeOrderedSeriesFunc = () => makeOrderedSeries(categoriesAndStacks);
  
  const orderChange = {
    "1_ALPHA": () => { sortArrayAlphabetically(categoriesAndStacks); orderedSeries = makeOrderedSeriesFunc(); },
    "1_PROTO": () => { sortArrayByProtocolOrder(categoriesAndStacks); orderedSeries = makeOrderedSeriesFunc(); },
    "1_ASC": () => { sortArrayByAscValues(categoriesAndStacks); orderedSeries = makeOrderedSeriesFunc(); },
    "1_DESC": () => { sortArrayByDescValues(categoriesAndStacks); orderedSeries = makeOrderedSeriesFunc(); },
    "0_ALPHA": sortArrayAlphabetically,
    "0_PROTO": () => sortArrayByProtocolOrder(d),
    "0_ASC": () => sortArrayByAscValues(bardata),
    "0_DESC": () => sortArrayByDescValues(bardata),
  };
  
  const findOrder = `${detail}_${order}`;
  
  if (orderChange.hasOwnProperty(findOrder)) {
    orderChange[findOrder]();
  }
  
}


function enprices(d = null) {

  startLoadingAnimation()

  REF.chartId = "mainChart"

  // populateDropdownData()

  chartdata(d);

  getTitle()

const mainColors = (REF.detail == 0) ? totalColors : (REF.component == 1) ? componentColors : detailColors;

const tooltipFormatter = function() {
  return REF.detail == 1 ? tooltipTable(this.points) : chartNormalTooltip(this.points);
};

const xAxis =  REF.detail == 1 ? { reversedStacks: true, categories: categoriesAndStacks.map((e) => e.x) } : { type: "category" };
const series = REF.detail == 1 ? orderedSeries.reverse() : [{ name: "Total", data: bardata }];
const colors = REF.detail == 1 ? mainColors : "";
const legend = REF.detail == 1 ? {enabled:true} : {enabled:false};
const chartTitle = getTitle();
const yAxis = REF.percentage == 1? '{value}%' : '{value:.2f}';
const yAxisTitle =
  REF.percentage == 1
    ? languageNameSpace.labels["PRICE_" + REF.product] + " " + languageNameSpace.labels['%']
    : languageNameSpace.labels["PRICE_" + REF.product] + " [" + languageNameSpace.labels["S_" + REF.currency] + "/" + languageNameSpace.labels["S_" + REF.unit] + "]";


const chartOptions = {
  containerId: "chart",
  type: "column",
  title: chartTitle,
  subtitle: null,
  xAxis: xAxis,
  yAxisFormat: yAxis,
  yAxisTitle: yAxisTitle,
  tooltipFormatter: tooltipFormatter,
  creditsText: credits(),
  creditsHref: "",
  series: series,
  colors: colors,
  legend: legend,
  columnOptions: {
      stacking: REF.percentage == 0 ? "normal" : "percent",
      events: {
        mouseOver: function () {
          var point = this;
          var color = point.color;
          $('path.highcharts-label-box.highcharts-tooltip-box').css('stroke', color);
        }
      }
    },
  seriesOptions: {
      cursor: "pointer",
      point: {
        events: {
          click: function () {
            let country = (this.name == undefined) ? this.category : this.name;
            let geo = Object.keys(languageNameSpace.labels).find(key => languageNameSpace.labels[key] == country);
            REF.chartGeo = geo
            auxChartIni();
          },
        },
      },
    }
};

const chart = new Chart(chartOptions);

chart.createChart();

dataNameSpace.setRefURL();

enableScreenREader()

stopLoadingAnimation()

}

function auxChartIni() {  
  addAuxiliarBarGraphOptions()
  auxiliarBarGraph()
  hideMenuSwitch()
 }



