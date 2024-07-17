var log = console.log.bind(console);

var isMobile = /Mobi|Android/i.test(navigator.userAgent) || window.innerWidth < 850 || /Mobi|Android/i.test(navigator.userAgent) && (window.innerWidth < window.innerHeight);

formMessage = (/The ENPRICES tool is down since:     (.*)/)

// function to openMeta link when press the link btn
function openMeta() {
  		var metadata = "";
		if(REF.products == "4100") {
			metadata = "nrg_pc_202";
		} else {
			metadata = "nrg_pc_204";
		}
  window.open("https://ec.europa.eu/eurostat/cache/metadata/"+REF.language+"/"+metadata+"_sims.htm");	
}

 orderByPiles = (countriesAndValues, x, y) => {
  const categories = Object.values(x).map(country => languageNameSpace.labels[country]);
  const fuelTypes = Object.values(y).map(fuel => languageNameSpace.labels[fuel]);

  const mySeries = fuelTypes.map((fuel, i) => ({
    name: fuel,
    data: countriesAndValues[i].data.map(element => element)
  }));

  const categoriesAndPiles = categories.map((name, index) => ({
    name,
    piles: mySeries.map(serie => ({
      name: serie.name,
      value: serie.data[index]
    }))
  }));

  categoriesAndPiles.sort((a, b) => {
    const sumA = a.piles.reduce((sum, pile) => sum + pile.value, 0);
    const sumB = b.piles.reduce((sum, pile) => sum + pile.value, 0);
    return sumB - sumA;
  });

  const myXAxis = categoriesAndPiles.map(category => category.name);

  mySeries.forEach(serie => {
    serie.data = categoriesAndPiles.map(category => category.piles.find(pile => pile.name == serie.name).value);
  });

  return {
    myXAxis,
    mySeries
  };
};


 makeOrderedSeries = (categoriesAndStacks) => {
  const ordSeries = [];

  bardata = REF.chartId == "lineChart" ? linedata : bardata;

  for (let i = 0; i < categoriesAndStacks[0].y.length; i++) {
    const temp = categoriesAndStacks.map(category => category.y[i]);
    ordSeries.push({
      index: bardata[i].index,
      name: bardata[i].name,
      legendIndex: bardata[i].legendIndex,
      id: bardata[i].id,
      data: temp
    });
  }

  const [temp] = ordSeries.splice(1, 1);
  ordSeries.push(temp);

  return ordSeries;
};



   
function printChart() { $("#chart").highcharts().print()};
function exportPngChart() { $("#chart").highcharts().exportChart()};
function exportJpegChart() { $("#chart").highcharts().exportChart({type: 'image/jpeg'})};
function exportPdfChart() { $("#chart").highcharts().exportChart({type: 'application/pdf'})};
function exportSvgChart() { $("#chart").highcharts().exportChart({type: 'image/svg+xml'})};

function exportXlsChart() { $("#chart").highcharts().downloadXLS()};
function exportCsvChart() { $("#chart").highcharts().downloadCSV()};


function mailContact() {
  document.location = "mailto:ESTAT-ENERGY@ec.europa.eu?subject=ENERGY%20PRICES%20CONTACT&body=" +
  encodeURIComponent(window.location.href);
}

function exportTable() {
  window.open('data:application/vnd.ms-excel,' + encodeURIComponent($('.highcharts-data-table').html()));
}

function addAuxiliarBarGraphOptions() {
  const auxiliarBarGraphOptions = new ChartControls();
  auxiliarBarGraphOptions.addToDOM("#subnavbar-container"); 
}
function removeAuxiliarBarGraphOptions() {
  const auxiliarBarGraphOptions = new ChartControls();
  auxiliarBarGraphOptions.removeFromDOM(); 



  enprices()
}
function showMenuSwitch() {
  $("#menuSwitch > fieldset:nth-child(1)").css('display', "block") 
  $('#ChartOrder').css('display', "initial") 
  $("li#Agregates").css('display', "initial") 
  $("li#ChartOrder").css('display', "initial") 
  $("#toggleTable").css('display', "initial") 
  $("#togglePercentage").css('display', "initial") 
  $("#switchBtn > div:nth-child(1)").css('display', "initial") 
  $("#switchBtn > div:nth-child(2)").css('display', "initial") 

}

function hideMenuSwitch() {
  $("li#Agregates").css('display', "none") 
  $("li#ChartOrder").css('display', "none") 
  $(".form-check.form-switch.form-check-reverse").css('display', "none") 
  $("#toggleTable").css('display', "none") 
  $("#togglePercentage").css('display', "none") 
  $("#switchBtn > div:nth-child(1)").css('display', "none") 
  $("#switchBtn > div:nth-child(2)").css('display', "none") 

  
}


function sortArrayAlphabetically() {
  if (REF.detail == 1) {
    categoriesAndStacks.sort((a, b) => a.x.localeCompare(b.x));
  } else {
    bardata.sort((a, b) => a.name.localeCompare(b.name, undefined, { ignorePunctuation: true, sensitivity: 'base' }));
  }
}

function sortArrayByAscValues(arr) {
  if (REF.detail == 1) {
    arr.sort((a, b) => {
      const sumA = a.y.reduce((acc, val) => acc + val, 0);
      const sumB = b.y.reduce((acc, val) => acc + val, 0);
      return sumA - sumB;
    });
  } else {
    // arr.sort((a, b) => a.y % 2 - b.y % 2 || a.y - b.y);
    arr.sort((a, b) => b.y - a.y);
  }
}

function sortArrayByDescValues(arr) {
  if (REF.detail == 1) {
    arr.sort((a, b) => {
      const sumA = a.y.reduce((acc, val) => acc + val, 0);
      const sumB = b.y.reduce((acc, val) => acc + val, 0);
      return sumB - sumA;
    });
  } else {
    // arr.sort((a, b) => b.y % 2 - a.y % 2 || b.y - a.y);
    arr.sort((a, b) => b.y - a.y);
  }
}

function sortArrayByProtocolOrder(arr) {
  if (REF.detail == 1) {
    const energyCountriesCodes = REF.geos;
    arr.sort((a, b) => {     
      return energyCountriesCodes.indexOf(a.code) - energyCountriesCodes.indexOf(b.code);
    });
    orderedSeries = makeOrderedSeries(categoriesAndStacks);
  } else {
    barproto = [];
    bardata = barproto;
    const geosProto = REF.geos; // Ignore "all" in REF.geos

    geosProto.map((geop, gIdx) => {
      geos.map((geo, yIdx) => {
        if (geop == geo ) {
          values = tax.map((tax, cIdx) => {
            return (num = arr.value[cIdx * geos.length + yIdx]);
          });
        }
      });

      const taxValue = REF.component == 1
        ? parseFloat((values.reduce((a, b) => a + Number(b), 0) * factor).toFixed(dec))
        : parseFloat((values[0] * factor).toFixed(dec));

      barcateg.push(languageNameSpace.labels[geop]);

      const languageLabel = languageNameSpace.labels[geop];
      // const color = geop == "EU27_2020" ? '#14375a' : (geop == "EA" ? '#800000' : "#32afaf");
      const color = geop == "EU27_2020" ? '#CCA300' : (geop == "EA" ? '#208486' : "#0E47CB");

      barproto.push({ name: languageLabel, y: taxValue, color });
    });
  }
}



function chartNormalTooltip(points) {
  const value = Highcharts.numberFormat(points[0].y, 4);
  const unit = `${languageNameSpace.labels["S_" + REF.currency]}/${languageNameSpace.labels["S_" + REF.unit]}`;
  const na = languageNameSpace.labels['FLAG_NA'];
  const title = REF.chartId==="mainChart" ?  points[0].key : points[0].x

  const formatPointTooltip = function () {
    if (value == 0) {
      return `<td><b>${na}</b></td>`
    } else {
      return `<td><b>${value}</b> ${unit}</td>`
    }
    
  };

  const tooltipRows = formatPointTooltip();

  let html = "";

  html += `<table class="table_component"> 
  <thead class="">
    <tr class="">
        <th scope="cols" colspan="2">${title}</th>                
    </tr>
  </thead>
  <tbody>
    <tr class="">
      ${tooltipRows}
    </tr>
  </tbody>
</table>`;
  return html
}




function pieTolltip(point) {
  // Assuming there is a variable 'unit' representing the unit you want to display
  const unit = REF.unit; // Replace 'your_unit' with the actual unit
  const na = languageNameSpace.labels['FLAG_NA'];
 
  const formatPointTooltip = function () {
    return `<tr class="tooltipTableRow"><td><span style="color:${point.color}">\u25CF</span> ${point.name}:</td><td>${point.y} ${unit}</td></tr>`;
  };

  // Construct the complete tooltip content
  const tooltipRows = formatPointTooltip();

  // Create the HTML table structure
  const html = `<table id="tooltipTable" class="table_component"> 
    <thead class="">
      <tr class="">
        <th scope="col" colspan="2">${languageNameSpace.labels[REF.chartGeo]}</th>                
      </tr>
    </thead>
    <tbody>
      ${tooltipRows}
    </tbody>
  </table>`;

  return html;   
}


function tooltipTable(points) {

  if(REF.percentage == 1 ){
    let html = "";
    html += `<table id="tooltipTable" class="table_component">                
                <thead>
                  <tr>
                    <th scope="cols">${points[0].x}</th>                    
                    <th scope="cols"></th>                    
                  </tr>
                </thead>`
      points.forEach(element => {
          const value = element.point.percentage.toFixed(0); // Limit decimals to three places
          const category = element.point.series.name; 
          const color = element.point.color;              
          html += `<tr>
                      <td><svg width="10" height="10" style="vertical-align: baseline;"><circle cx="5" cy="5" r="3" fill="${color}" /></svg> ${category}</td>
                      <td>${value} %</td>
                  </tr>` 
      });
    html += `</table>`;
    return `<div>${html}</div>`;
  } else {
    let html = "";
    let totalAdded = false; // Flag to track if the total row has been added
    let totalColor = "rgb(14, 71, 203)";

    
    // Sort the points so that the "Total" item is at the last place
    const sortedPoints = points.sort(function (a, b) {
      if (a.series.name == languageNameSpace.labels['TOTAL']) return 1;
      if (b.series.name == languageNameSpace.labels['TOTAL']) return -1;
      return 0;
    });
    
    html += `<table id="tooltipTable" class="table_component">                
      <thead>
        <tr>
          <th scope="cols">${sortedPoints[0].key}</th>                    
          <th scope="cols"></th>                    
        </tr>
      </thead>`;
    
    sortedPoints.forEach(function (point) {
      const color = point.series.color;
      const value = point.y.toFixed(dec); // Limit decimals to three places
      const category = point.series.name;    

      if(REF.details != 0) {
        html += `<tr>
        <td><svg width="10" height="10" style="vertical-align: baseline;"><circle cx="5" cy="5" r="3" fill="${color}" /></svg> ${category}</td>
        <td>${value}</td>
      </tr>`;
      }    
      // Check if point is "Total" and set the flag if found
      if (category == languageNameSpace.labels['total']) {
        totalAdded = true;
      }
    });
    
    // Check if all values are zero and display a message if they are
    const allValuesZero = sortedPoints.every(function (point) {
      return point.y === 0;
    });
   
    if (allValuesZero) {
      html = 
    `<table id="tooltipTable" class="table_component">                
    <thead>
      <tr>
        <th scope="cols">${sortedPoints[0].key}</th>                                    
      </tr>
    </thead><tr>      
    <td>${languageNameSpace.labels["FLAG_NA"]}</td>
  </tr></table>`;


    } else {
      // Add a row for the total if not already added
      if (!totalAdded) {
        // Calculate the total sum of all values
        const totalSum = sortedPoints.reduce(function (sum, point) {
          return sum + point.y;
        }, 0);
    
        // Format the total sum with three decimal places
        const totalValue = totalSum.toFixed(dec);
    
        // Add a row for the total
        html += `<tr>
          <td><svg width="10" height="10" style="vertical-align: baseline;"><circle cx="5" cy="5" r="3" fill="${totalColor}" /></svg> ${languageNameSpace.labels['TOTAL']}</td>
          <td>${totalValue}</td>
        </tr>`;
      }
    }    
    html += `</table>`; 
    return `<div>${html}</div>`;
    
  }
}

function getTitle() {
  const geoLabel = languageNameSpace.labels[REF.chartGeo];
  const time = REF.time;
  const dataset = languageNameSpace.labels[REF.dataset];
  const consoms = languageNameSpace.labels[REF.consoms];
  const barText = languageNameSpace.labels["BAR_CHART_TITLE_CONSOMS"];
  const currencyLabel = languageNameSpace.labels["S_" + REF.currency];
  const unitLabel = languageNameSpace.labels["S_" + REF.unit];
  let title = ""
  let subtitle = ""

  let chartTitle = "";
  switch (REF.chartId) {
    case "lineChart":
      chartTitle = `${dataset} - ${geoLabel} - ${consoms} `;
      title = `${dataset}`;
      subtitle = `<span >${geoLabel} - ${consoms}</span>`;
      break;
    case "pieChart":
      chartTitle = `${dataset} - ${geoLabel} - ${time} - ${consoms}`;
      title = `${dataset}`;
      subtitle = `<span >${geoLabel} - ${time} - ${consoms}</span>`;
      break;
    case "barChart":
      chartTitle = `${dataset} - ${barText} - ${geoLabel} - ${time}`;
      title = `${dataset}`;
      subtitle = `<span >${barText} - ${geoLabel} - ${time}</span>`;
      break;
    default:    
    chartTitle = `${dataset} - ${time}, ${consoms}`;
    title = `${dataset} (${currencyLabel}/${unitLabel}) ${time}`;
    subtitle = `${consoms} - ${time}`;   
  }

  $("#title").html(title);
  $("#subtitle").html(subtitle);

  return chartTitle;
}

function credits() {
  const chartCredits = `<span style="font-size: .75rem;">${languageNameSpace.labels["EXPORT_FOOTER_TITLE"]} - </span>
  <a style="color:blue; text-decoration: underline; font-size: .75rem;"
  href="https://ec.europa.eu/eurostat/databrowser/view/${REF.dataset}/default/table?lang=${REF.language}">${languageNameSpace.labels['DB']}</a>,
  <span style="font-size: .875rem;">                           
</span>`;

  return chartCredits
}

// function chartApiCall() {
//   let url = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/" + REF.dataset + "?";
//   url += "format=JSON";
//   url += "&lang=" + REF.language;

//   switch (REF.chartId) {
//     case "lineChart":
//       url += (REF.component == 1? REF.nrg_prc.map(prc => "&nrg_prc=" + prc).join("") : REF.taxs.map(tax => "&tax=" + tax).join(""));
//       url += (!REF.component ? "&product=" + REF.product + "&unit=" + REF.unit : "");
//       url += "&nrg_cons=" + REF.consoms;
//       url += "&currency=" + REF.currency;
//       url += "&geo=" + REF.chartGeo;
//       break;
//     case "pieChart":
//       url += (REF.component == 1 ? REF.nrg_prc.map(prc => "&nrg_prc=" + prc).join("") : "&unit=" + REF.unit);
//       url += "&currency=" + REF.currency;
//       url += "&time=" + REF.time;
//       url += "&geo=" + REF.chartGeo;
//       url += "&nrg_cons=" + REF.consoms;
//       break;
//     case "barChart":
//       url += (REF.component == 1 ? REF.nrg_prc.map(prc => "&nrg_prc=" + prc).join("") : "&product=" + REF.product + "&unit=" + REF.unit);
//       url += "&currency=" + REF.currency;
//       url += "&time=" + REF.time;
//       url += "&geo=" + REF.chartGeo;
//       break;  
//     default:
//       url += REF.geos.map(geo => "&geo=" + geo).join("");
//       url += "&currency=" + REF.currency;
//       url += "&time=" + REF.time;
//       url += "&nrg_cons=" + REF.consoms;
//       url += (REF.component == 1 ? REF.nrg_prc.map(prc => "&nrg_prc=" + prc).join("") : "&product=" + REF.product + "&unit=" + REF.unit);
//       break;
//   }


//   const d = JSONstat(url).Dataset(0);
//   return d;
// }

function chartApiCall() {
  let url = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/" + REF.dataset + "?";
  url += "format=JSON";
  url += "&lang=" + REF.language;

  const unitChange = REF.unit == "MWH" ? "KWH" : REF.unit
 

  switch (REF.chartId) {
    case "lineChart":
      url += (REF.component == 1? REF.nrg_prc.map(prc => "&nrg_prc=" + prc).join("") : REF.taxs.map(tax => "&tax=" + tax).join(""));
      url += (!REF.component ? "&product=" + REF.product + "&unit=" + unitChange : "");
      url += "&nrg_cons=" + REF.consoms;
      url += "&currency=" + REF.currency;
      url += "&geo=" + REF.chartGeo;
      break;
    case "pieChart":
      url += (REF.component == 1 ? REF.nrg_prc.map(prc => "&nrg_prc=" + prc).join("") : "&unit=" + unitChange);
      url += "&currency=" + REF.currency;
      url += "&time=" + REF.time;
      url += "&geo=" + REF.chartGeo;
      url += "&nrg_cons=" + REF.consoms;
      break;
    case "barChart":
      url += (REF.component == 1 ? REF.nrg_prc.map(prc => "&nrg_prc=" + prc).join("") : "&product=" + REF.product + "&unit=" + unitChange);
      url += "&currency=" + REF.currency;
      url += "&time=" + REF.time;
      url += "&geo=" + REF.chartGeo;
      break;  
    default:
      url += REF.geos.map(geo => "&geo=" + geo).join("");
      url += "&currency=" + REF.currency;
      url += "&time=" + REF.time;
      url += "&nrg_cons=" + REF.consoms;
      url += (REF.component == 1 ? REF.nrg_prc.map(prc => "&nrg_prc=" + prc).join("") : "&product=" + REF.product + "&unit=" + unitChange);
      break;
  }

  const request = new XMLHttpRequest();
  request.open("GET", url, false); // Setting the third parameter to 'false' makes it synchronous
  request.send();

  if (request.status === 500 || request.status === 503) {
    // submitFormDown();
  }

  if (request.status !== 200) {
    // submitFormDown();
  }

  const data = JSON.parse(request.responseText);
  const d = JSONstat(data).Dataset(0);
  return d;
}

function startLoadingAnimation() {
  $('#loader').css('display', 'flex')
}
function stopLoadingAnimation() {
  $('#loader').css('display', 'none')
}

function agregateIcon() {
  const iconHTML = `
  <span class="agregates fa-stack fa-rotate-180" style=" position: absolute; top: 8px;">
    <i class="fa fa-square fa-stack-1x" style="top: .0em; left: .0em; color: white;"></i>
    <i class="fa fa-square fa-stack-1x" style="top: .2em; left: .2em; color: #0a328e;"></i>
    <i class="fa fa-square fa-stack-1x" style="top: .2em; left: .2em; color: transparent;"></i>
    <i class="fa fa-square fa-stack-1x" style="top: .3em; left: .3em; color: white;"></i>
    <i class="fa fa-square fa-stack-1x" style="top: .5em; left: .5em; color: #0a328e;"></i>
    <i class="fa fa-square fa-stack-1x" style="top: .5em; left: .5em; color: transparent;"></i>
    <i class="fa fa-square fa-stack-1x" style="top: .6em; left: .6em; color: white;"></i>
    <i class="fa fa-square fa-stack-1x" style="top: .8em; left: .8em; color: #0a328e;"></i>
    <i class="fa fa-square fa-stack-1x" style="top: .8em; left: .8em; color: transparent;"></i>
    <i class="fa fa-square fa-stack-1x" style="top: .9em; left: .9em; color: white;"></i>
  </span>
`;
return iconHTML;
}

function nonagregateIcon() {
  const iconHTML = `
      <span class="nonAgregates fa-stack fa-rotate-180" style="position: absolute;top: 4px;">
        <i class="fa fa-square fa-stack-1x" style="top: .0em;left: .0em;color: white;"></i>
        <i class="fa fa-square fa-stack-1x" style="top: .2em;left: .2em;color: #0a328e;"></i>
        <i class="fa fa-square fa-stack-1x" style="top: .2em;left: .2em;color: transparent;"></i>
        <i class="fa fa-square fa-stack-1x" style="top: .3em;left: .3em;color: white;"></i>
      </span>`;
return iconHTML;
}

function chartToDisplay(d) { 

  if(REF.chartId == "mainChart") {
    enprices(d)  
  }
  if(REF.chartId == "pieChart") {
    createPieChart();
  }
  if(REF.chartId == "barChart") {
    auxiliarBarGraph();
  }
  if(REF.chartId == "lineChart") {
    createLineChart();
  }

}


function enableScreenREader(params) {
	const titleElement = document.querySelector("text.highcharts-title")
	if (titleElement) {
	  titleElement.setAttribute('aria-hidden', 'false');
	}
  
	// Find and update the subtitle element
	const subtitleElement = document.querySelector('text.highcharts-subtitle');
	if (subtitleElement) {
	  subtitleElement.setAttribute('aria-hidden', 'false');
	}

	const container = document.querySelector(".highcharts-root")

	container.removeAttribute('aria-hidden');




    // Select all <i> elements with the Font Awesome class
    var fontAwesomeIcons = document.querySelectorAll('i.fas');

    // Loop through each icon and add the aria-hidden attribute
    fontAwesomeIcons.forEach(function(icon) {
        icon.setAttribute('aria-hidden', 'true');
    });




  }


