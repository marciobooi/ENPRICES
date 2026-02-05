class ChartControls {
	constructor() {
	  this.controls = document.createElement("div");
  
	  const select = document.createElement("select");
	  // select.id = REF.chartId;
	  select.classList.add("form-select", "mx-2");
	  select.setAttribute("aria-label", "Select flow");
  
	  const notMobileContent = `
		<div class="">
		  <nav aria-label="Chart controls" id="chartControls" class="navbar navbar-expand-sm navbar-light bg-light navChartControls">
			<div class="container-fluid">
			  <div id="auxChartTitle">
				<h2 id="title" class="title">title</h2>
			<h3 id="subtitle" class="subtitle">subtitle</h3>
			  </div>
			  <div class="menu">
				<div id="chartBtns" role="toolbar" aria-label="options graph toolbox" class="navbar-nav ms-auto my-2 my-lg-0 navbar-nav-scroll" style="--bs-scroll-height: 50vw;">
				  <div class="nav-item button px-1" id="toggleBarChart"></div>
				  <div class="nav-item button px-1" id="togglePieChart"></div>
				  <div class="nav-item button px-1" id="toggleLineChart"></div>
				  <div class="nav-item button px-1" id="toggleAuxTable" style="margin-right: 2rem;"></div>

				  <div class="nav-item button px-1" id="printChart"></div>
				  <div class="nav-item dropdown px-1" id="downloadChart"></div>
				  <div class="nav-item button px-1" id="downloadExcel"></div>
				  <div class="nav-item button px-1" id="embebedChart" style="margin-right: 2rem;"></div>
				  <div class="nav-item button px-1" id="closeChart"></div>
				</div>
			  </div>
			</div>
		  </nav>
		</div>`;
  
	  const mobileContent = `
		<div id="chartOptions">
		  <div class="col-12 subNavOne auxChartbtn">
			<button id="tools" class="btnGroup pe-2" type="button" data-i18n-label="TOOLS" data-i18n-title="TOOLS" aria-haspopup="true">
			<i class="fas fa-ellipsis-h"></i>
			<span class="iconText" data-i18n="TOOLS"></span>
			</button>
			<div class="menu d-none">
			  <div id="chartBtns" role="toolbar" data-i18n-label="OPTIONS_GRAPH_TOOLBOX" class="navbar-nav ms-auto my-2 my-lg-0 navbar-nav-scroll" style="--bs-scroll-height: 50vw;">
				<div class="nav-item button px-1" id="toggleBarChart"></div>
				<div class="nav-item button px-1" id="togglePieChart"></div>
				<div class="nav-item button px-1" id="toggleLineChart"></div>
				<div class="nav-item button px-1" id="toggleAuxTable"></div>

				<div class="nav-item button px-1" id="printChart"></div>
				<div class="nav-item dropdown px-1" id="downloadChart"></div>
				<div class="nav-item button px-1" id="downloadExcel"></div>
				<div class="nav-item button px-1" id="embebedChart"></div>
				<div class="nav-item button px-1" id="closeChart"></div>
			  </div>
			</div>
		  </div>
		  <div class="col-12 subNavTwo">
			<div id="auxChartTitle">
			  <h2 id="title" class="title">title</h2>
			  <h6 id="subtitle" class="subtitle">subtitle</h6>
			</div>
		  </div>
		</div>`;	
		
  
	  if (isMobile) {
		this.controls.innerHTML = mobileContent;
		this.toolsButton = this.controls.querySelector("#tools");
		this.chartToolsMenu = this.controls.querySelector(".menu");
  
		this.toolsButton.addEventListener("click", () => {
		  this.chartToolsMenu.classList.toggle("d-none");
		  this.toolsButton.style.display = "none";
		});
	  } else {
		this.controls.innerHTML = notMobileContent;
	  }
	}
  
	addToDOM(targetElement) {
	  $("#menuToolbar").toggle();	
	  const container = document.querySelector(targetElement);
	  container.insertBefore(this.controls, container.firstChild);

	    // Create the button instances
		const barChart = new Button("barChart", ["ecl-button", "ecl-button--primary", "round-btn"], "SHOW_BAR_CHART", "barChart", "true");
		const pieChart = new Button("pieChart", ["ecl-button", "ecl-button--primary", "round-btn"], "SHOW_PIE_CHART", "pieChart", "false");
		const lineChart = new Button("lineChart", ["ecl-button", "ecl-button--primary", "round-btn"], "SHOW_LINE_CHART", "lineChart", "false");

		const table = new Button("toggleTableBtn", ["ecl-button", "ecl-button--primary", "round-btn"], "SHOW_TABLE", "table", "false");
		const createprintChart = new Button("printBtn", ["ecl-button", "ecl-button--primary", "round-btn"], "PRINT_CHART", "false");
		const downloadChart = new Button("downloadBtn", ["ecl-button", "ecl-button--primary", "round-btn"], "DOWNLOAD_CHART_IMAGE", "false");
		const downloadExcel = new Button("excelBtn", ["ecl-button", "ecl-button--primary", "round-btn"], "DOWNLOAD_XLS", "false");
		const embebedeChart = new Button("embebedBtn", ["ecl-button", "ecl-button--primary", "round-btn"], "EMBEDDED", "false");
		const closeChart = new Button("btnCloseModalChart", ["ecl-button", "ecl-button--primary", "round-btn", "close-chart-menu-btn"], "CLOSE", "false");
	
		// Set inner HTML content for each button
		barChart.setInnerHtml('<i class="fas fa-chart-bar"></i>');
		pieChart.setInnerHtml('<i class="fas fa-chart-pie"></i>');
		lineChart.setInnerHtml('<i class="fas fa-chart-line"></i>');
		table.setInnerHtml('<i class="fas fa-table"></i>');
		createprintChart.setInnerHtml('<i class="fas fa-print"></i>');
		downloadChart.setInnerHtml('<i class="fas fa-download"></i>');
		downloadExcel.setInnerHtml('<i class="fas fa-file-excel"></i>');
		embebedeChart.setInnerHtml('<i class="fas fa-code"></i>');
		closeChart.setInnerHtml('<i class="fas fa-times"></i>');
	
		// Set click handlers for each button
		barChart.setClickHandler(function(e) {
		  const button = e.currentTarget;
		  if (button.getAttribute('aria-disabled') === 'true') {
			e.preventDefault();
			return;
		  }
		  disableChatOptionsBtn(this.value);
		  auxiliarBarGraph();
		});
		pieChart.setClickHandler(function(e) {
		  const button = e.currentTarget;
		  if (button.getAttribute('aria-disabled') === 'true') {
			e.preventDefault();
			return;
		  }
		  disableChatOptionsBtn(this.value);
		  createPieChart();
		});
		lineChart.setClickHandler(function(e) {
		  const button = e.currentTarget;
		  if (button.getAttribute('aria-disabled') === 'true') {
			e.preventDefault();
			return;
		  }
		  disableChatOptionsBtn(this.value);
		  createLineChart();
		});
		table.setClickHandler(function() {

			const tableBtn = document.querySelector("#toggleTableBtn");
			const tableIcon = document.querySelector("#toggleTableBtn > i");
			
			if (tableIcon.classList.contains("fa-table")) {
				tableIcon.classList.remove("fa-table");
				tableIcon.classList.add("fa-chart-bar");
			
				tableBtn.setAttribute('aria-label', 'Toggle chart');
				tableBtn.setAttribute('title', 'Toggle chart');
				tableBtn.setAttribute('aria-pressed', 'true');

				const charts = ["barChart", "pieChart", "lineChart"];  
				charts.forEach(chart => {
					$("#" + chart).attr("disabled", "disabled");
					$("#" + chart).attr("aria-disabled", "true");
				})		

				$("#"+REF.chartId).addClass('highlighDisbleBtn');

				$('.ecl-button').not('button#tb-togle-table').not('#toggleTableBtn').prop('disabled', true);
				$('.ecl-button').not('button#tb-togle-table').not('#toggleTableBtn').each(function() {
					$(this).attr('aria-disabled', 'true');
				});
				$('#menu').prop('disabled', true);		
			
				openVizTable();

				tableBtn.focus();
			} else {
				tableIcon.classList.remove("fa-chart-bar");
				tableIcon.classList.add("fa-table");
			
				tableBtn.setAttribute('aria-label', 'Toggle table');
				tableBtn.setAttribute('title', 'Toggle table');
				tableBtn.setAttribute('aria-pressed', 'false');
			
				closeTable();

				$("#"+REF.chartId).removeClass('highlighDisbleBtn');
				
				$('.ecl-button').not('button#tb-togle-table').prop('disabled', false);
				$('.ecl-button').not('button#tb-togle-table').not('#toggleTableBtn').each(function() {
					$(this).attr('aria-disabled', 'false');
				});
				$('#menu').prop('disabled', false);		
				disableChatOptionsBtn(REF.chartId)
				tableBtn.focus();
			}			
		});
		createprintChart.setClickHandler(function() {
		  printChart();
		});
		downloadChart.setClickHandler(function() {
		  exportPngChart();
		});
		downloadExcel.setClickHandler(function() {
		  exportXlsChart();
		});
		embebedeChart.setClickHandler(function() {
			exportIframe();
		});
		closeChart.setClickHandler(function() {
		  closeTable();
		  removeAuxiliarBarGraphOptions();
		});

	  	  // Create the button elements
			const barChartElement = barChart.createButton();
			const pieChartElement = pieChart.createButton();
			const lineChartElement = lineChart.createButton();
			const tableChartElement = table.createButton();
			// const printChartElement = createprintChart.createButton();
			const downloadChartElement = downloadChart.createButton();
			const downloadExcelElement = downloadExcel.createButton();
			const embebedeChartElement = embebedeChart.createButton();
			const closeChartElement = closeChart.createButton();

		
			// Append the button elements to the document
			document.getElementById("toggleBarChart").appendChild(barChartElement);
			document.getElementById("togglePieChart").appendChild(pieChartElement);
			document.getElementById("toggleLineChart").appendChild(lineChartElement);
			document.getElementById("toggleAuxTable").appendChild(tableChartElement);
			// document.getElementById("printChart").appendChild(printChartElement);
			document.getElementById("downloadChart").appendChild(downloadChartElement);
			document.getElementById("downloadExcel").appendChild(downloadExcelElement);
			document.getElementById("embebedChart").appendChild(embebedeChartElement);
			document.getElementById("closeChart").appendChild(closeChartElement);

			barChart.setDisabled(true);
			
			// Initialize aria attributes
			barChartElement.setAttribute('aria-disabled', 'true');
			barChartElement.setAttribute('aria-pressed', 'true');
			pieChartElement.setAttribute('aria-disabled', 'false');
			pieChartElement.setAttribute('aria-pressed', 'false');
			lineChartElement.setAttribute('aria-disabled', 'false');
			lineChartElement.setAttribute('aria-pressed', 'false');
			tableChartElement.setAttribute('aria-disabled', 'false');
			tableChartElement.setAttribute('aria-pressed', 'false');

			languageNameSpace.initLanguage(REF.language);
	}
  
	removeFromDOM() {
	  let navElement;
	  if (isMobile) {
		navElement = document.querySelector("#chartOptions");
	  } else {
		navElement = document.querySelector("div > nav.navChartControls");
	  }
  
	  if (navElement) {
		const parentContainer = navElement.closest("#subnavbar-container > div");
		if (parentContainer) {
		  parentContainer.parentNode.removeChild(parentContainer);
		}
	  }
	  $("#menuToolbar").toggle();
	  showMenuSwitch();
	}
  }
  




  function disableChatOptionsBtn(chart) {
	REF.chartId = chart;  
	log('here')
	const charts = ["barChart", "pieChart", "lineChart"];  
	charts.forEach(chart => {
	  if (REF.chartId == chart) {
		$("#" + chart).attr("disabled", "disabled");
		$("#" + chart).attr("aria-disabled", "true");
		$("#" + chart).attr("aria-pressed", "true");
	  } else {
		$("#" + chart).removeAttr("disabled");
		$("#" + chart).attr("aria-disabled", "false");
		$("#" + chart).attr("aria-pressed", "false");
	  }
	});
  }