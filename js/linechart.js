
function lineData() {

  d = chartApiCall();

  const taxs = REF.component == 1 ?  d.Dimension('nrg_prc').id  : d.Dimension('tax').id;

  lineCat = []
  linedata = [];
  
  const year = d.Dimension("time").id;
  dec = REF.unit == "MWH" ? 0 : 4;
  factor = REF.unit == "MWH" ? 1000 : 1;

  const total_data = year.map(() => { return null });

    for (var item in taxs) {
      data = [];
      for (var j = 0; j < year.length; j++) {
        data.push(d.value[0]);

        if (d.value[0] > 0) {
          total_data[j] += d.value[0];
        }

        d.value.shift();

        if (lineCat.length < year.length) {
          lineCat.push(year[j]);
        }
      }
      obj = {
        name: languageNameSpace.labels[taxs[item]],
        data: data,
        id: item,
        index: item,
        // legendIndex: item,
        color: colors[taxs[item]]
      };
      linedata.push(obj);
    } 

    // linedata.push({
    //     name: languageNameSpace.labels['TOTAL'],
    //     index: taxs.length.toString(),
    //     legendIndex: taxs.length.toString(),
    //     id: taxs.length.toString(),
    //     data: REF.component == 1 ? total_data : [],      
    //     color: colors['TOTAL']  
    //   });

    categoriesAndStacks = lineCat.map((el, i) => {
      if (i >= linedata[0].data.length) {
        return false;
      } else {
        let myObject = {};
        myObject.x = el;
        myObject.code = year[i];
        myObject.y = [];

        linedata.forEach((bdEl) => {
          myObject.y.push(bdEl.data[i]);
        });

        if (!REF.component) {
          const myXTAX = myObject.y[1];
          const myXVAT = myObject.y[0] - myObject.y[2];
          const rest = myObject.y[0] - (myXTAX + myXVAT);

          myObject.y[0] = parseFloat((rest * factor).toFixed(dec));
          myObject.y[1] = parseFloat((myXTAX * factor).toFixed(dec));
          myObject.y[2] = parseFloat((myXVAT * factor).toFixed(dec));
          myObject.y[3] = parseFloat(((myXTAX + myXVAT + rest) * factor).toFixed(dec));
        }
        return myObject;
      }
    });

  orderedSeries = makeOrderedSeries(categoriesAndStacks);
  
}

function createLineChart() {

  startLoadingAnimation()

  REF.chartId = "lineChart";

  lineData()

    lineColors = (REF.component == 1) ?  componentColors : lineColors;

    const lineTitle = getTitle() 

    const emptyResponse = d==null || Object.values(d.value).some(x => (x == null && x == '')) 
    if (emptyResponse) {nullishChart(); return }

   
    const tooltipFormatter = function () { return tooltipTable(this.points);}; 

                                // log(orderedSeries)
                                // log(orderedSeries.sort((a, b) => a.name.localeCompare(b.name)))
     
  
      const chartOptions = {
        containerId: "chart",
        type: "spline",
        title: lineTitle,
        subtitle: null,
        xAxis: {"categories": categoriesAndStacks.map((e) => e.x),},
        yAxisFormat: "{value:.2f}",
        tooltipFormatter: tooltipFormatter,
        creditsText: credits(),
        creditsHref: 'https://ec.europa.eu/eurostat/databrowser/view/'+REF.dataset+'/default/table?lang=EN',
        series: orderedSeries.sort((a, b) => a.name.localeCompare(b.name)),
        colors: lineColors,
        legend: {
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
        },        
        columnOptions: {
            stacking: "normal",
            events: {
              mouseOver: function () {
                var point = this;
                // var color = point.color;
                // $('path.highcharts-label-box.highcharts-tooltip-box').css('stroke', color);
              }
            }
          },
        seriesOptions: ""      
      };
      
      const chart = new Chart(chartOptions);
      chart.createChart();    
      stopLoadingAnimation()
}







