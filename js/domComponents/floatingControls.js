class FloatingChartControls {
  constructor() {
    this.chartControls = document.createElement('div');
    this.chartControls.className = 'menuSwitch col-6';
    this.chartControls.id = 'menuSwitch';

    this.chartControls.innerHTML = /*html*/`
      

    <div id="switchBtn">
    <div>
      <label id="hideDetailsLabel" class="form-check-label" for="switchDetails" data-i18n="HIDE_DETAILS"></label>
      <div class="form-check form-switch d-inline-block">
        <input class="form-check-input focus-ring" type="checkbox" value="${REF.detail == 1 ? 1 : 0}" role="switch" id="switchDetails" ${REF.detail == 1 ? 'checked' : ''}>
        <label id="showDetailsLabel" class="form-check-label" for="switchDetails" data-i18n="DETAILS"></label>
      </div>
    </div>

    <div>
      <label id="hideComponentsLabel" class="form-check-label" for="switchComponents" data-i18n="COMPONENTS_HIDE"></label>
      <div class="form-check form-switch d-inline-block">
        <input class="form-check-input focus-ring" type="checkbox" value="${REF.components == 1 ? 1 : 0}" role="switch" id="switchComponents" ${REF.components == 1 ? 'checked' : ''}>
        <label id="showComponentsLabel" class="form-check-label" for="switchComponents" data-i18n="COMPONENTS_SHOW"></label>
      </div>
    </div>
  </div>

  </div>      
      <div id="footerBtns">  
        <ul id="floatingMenu">   
          <li class="nav-item px-1" id="togglePercentage" role="none" style="display:${REF.detail == 1 ? "" : "none"}"></li>
          
          
          <li class="nav-item px-1" id="Agregates" role="none"></li>			  
            <li class="nav-item dropdown px-1" id="ChartOrder" role="none">
            <ul class="dropdown-menu dropdown-menu-end" role="menu" data-i18n-labelledby="SELECT_ORDER_OF_CHART">
                <li>
                <a href="#" id="DESC" class="dropdown-item ecl-link notLink ${REF.order == "DESC" ? "selected" : ""}" role="menuitem" aria-label="SORT_DESC" value="DESC" data-i18n="SORT_DESC"></a>
              </li>					
              <li>
                <a href="#" id="ASC" class="dropdown-item ecl-link notLink ${REF.order == "ASC" ? "selected" : ""}" aria-selected="true" role="menuitem" aria-label="SORT_ASC" value="ASC" data-i18n="SORT_ASC"></a>
              </li>
              <li>
                <a href="#" id="ALPHA" class="dropdown-item ecl-link notLink ${REF.order == "ALPHA" ? "selected" : ""}" role="menuitem" aria-label="SORT_ALPHABETICAL" value="ALPHA" data-i18n="SORT_ALPHABETICAL"></a>
              </li> 
              <li>
                <a href="#" id="PROTO" class="dropdown-item ecl-link notLink ${REF.order == "PROTO" ? "selected" : ""}" role="menuitem" aria-label="SORT_PROTOCOL" value="PROTO" data-i18n="SORT_PROTOCOL"></a>
              </li>
              </ul>
            </li>
            
            <li class="nav-item px-1" id="toggleTable" role="none"></li>
        </ul>
      </div>
      
      
      
      
      
      

      
      
      
      
      
      `;


    this.dopdownListSelect();

    // Get all the switch elements
    const switchElements = this.chartControls.querySelectorAll('[role="switch"]');

    // Add event listeners for keyboard navigation
    switchElements.forEach(switchElement => {
      switchElement.addEventListener('keyup', e => {


        const isChecked = switchElement.checked;
        switchElement.value = isChecked ? '1' : '0';

        const label = switchElement.id === 'switchDetails'
          ? isChecked
            ? 'Hide details'
            : 'Show details'
          : isChecked
            ? 'Hide components'
            : 'Show components';

        switchElement.setAttribute('aria-label', label);

        if (e.keyCode === 13 || e.keyCode === 32) {
          // Prevent scrolling when the spacebar or enter key is pressed
          e.preventDefault();

          // Toggle the switch when Space or Enter is released
          switchElement.checked = !switchElement.checked;
          switchElement.value = switchElement.value === '1' ? '0' : '1';

          if (switchElement.id === 'switchDetails') {
            REF.detail = switchElement.value === '1' ? 1 : 0;
            REF.chartInDetails= switchElement.value === '1' ? 1 : 0;
            REF.detail = isChecked ? 1 : 0;
            REF.chartInDetails = isChecked ? 1 : 0;
          } else if (switchElement.id === 'switchComponents') {
            REF.component = switchElement.value === '1' ? 1 : 0;
            REF.component = isChecked ? 1 : 0;
          }

          enprices()     

          
        }
      });


      switchElement.addEventListener('click', () => {        
        // Toggle the switch value between 1 and 0 when clicked
        switchElement.value = switchElement.value === '1' ? '0' : '1';    
        const isChecked = switchElement.checked;
        switchElement.value = isChecked ? '1' : '0';

        const label = switchElement.id === 'switchDetails'
          ? isChecked
            ? 'Hide details'
            : 'Show details'
          : isChecked
            ? 'Hide components'
            : 'Show components';

        switchElement.setAttribute('aria-label', label);


        if (switchElement.id === 'switchDetails') {
          REF.detail = switchElement.value === '1' ? 1 : 0;
          REF.chartInDetails= switchElement.value === '1' ? 1 : 0;

          REF.detail = isChecked ? 1 : 0;
          REF.chartInDetails = isChecked ? 1 : 0;


          const hideD = document.getElementById('hideDetailsLabel');
          const showD = document.getElementById('showDetailsLabel');
          hideD.style.fontWeight = switchElement.value == 0 ? 'bold' : 'normal';
          showD.style.fontWeight = switchElement.value == 1 ? 'bold' : 'normal';
        } else if (switchElement.id === 'switchComponents') {
          REF.component = isChecked ? 1 : 0;
          REF.component = switchElement.value === '1' ? 1 : 0;
          const hideC = document.getElementById('hideComponentsLabel');
          const showC = document.getElementById('showComponentsLabel');
          hideC.style.fontWeight = switchElement.value == 0 ? 'bold' : 'normal';
          showC.style.fontWeight = switchElement.value == 1 ? 'bold' : 'normal';
          populateYearsData();  
          populateDropdownData();
          languageNameSpace.initLanguage(REF.language);
          ECL.autoInit();
        }       

        const percentageButton = this.chartControls.querySelector('#togglePercentage');
        percentageButton.style.display = REF.details == 1 ? '' : 'none';
        REF.percentage = 0
       
   
        enprices()

      });
    });
  }

  setSelectedOrder() {
    const dropdownItems = this.chartControls.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
      item.classList.remove('selected');
      if (item.getAttribute('value') === REF.order) {
        item.classList.add('selected');
      }
    });
  }

  dopdownListSelect() {
    const dropdownItems = this.chartControls.querySelectorAll('.dropdown-item');

    dropdownItems.forEach(item => {
      item.addEventListener('click', () => {
        // Remove 'selected' class from all items
        dropdownItems.forEach(item => {
          item.classList.remove('selected');
        });

        // Add 'selected' class to the clicked item
        item.classList.add('selected');

        // Set the aria-selected attribute
        dropdownItems.forEach(item => {
          item.setAttribute('aria-selected', 'false');
        });
        item.setAttribute('aria-selected', 'true');

        const selectedValue = item.getAttribute('value');
        REF.order = selectedValue; // Update REF.order with the selected value

        this.setSelectedOrder();
        enprices()

      });
    });
  }

  toggleChartPercentage() {
    REF.percentage = REF.percentage == 0 ? 1 : 0;
    enprices()
  }

  toggleChartAgregates() {
    const query = ['EU27_2020', 'EA'];

    const toggleAgregates = this.chartControls.querySelector('#toggleAgregates');
   
  
  
    const hasQuery = query.every(item => REF.geos.includes(item));
    if (hasQuery) {
      REF.geos = REF.geos.filter(item => !query.includes(item));
      toggleAgregates.innerHTML = nonagregateIcon();
    } else {
      REF.geos = REF.geos.concat(query);
      toggleAgregates.innerHTML = agregateIcon();
    }
    enprices();
  }

  toggleIcons() {
    const tableIcon = this.chartControls.querySelector('#table-icon');
    const chartIcon = this.chartControls.querySelector('#chart-icon');
    const toggleButton = this.chartControls.querySelector('#tb-togle-table');
    const percentage = this.chartControls.querySelector('#togglePercentage');
    const Agregates = this.chartControls.querySelector('#Agregates');
    const ChartOrder = this.chartControls.querySelector('#ChartOrder');
    // const menuSwitch = this.chartControls.querySelector('#menuSwitch div');
  
  
    tableIcon.style.display = tableIcon.style.display === 'none' ? '' : 'none';
    chartIcon.style.display = chartIcon.style.display === 'none' ? '' : 'none';
    if (REF.detail === 1) {
      percentage.style.display = percentage.style.display === 'none' ? '' : 'none';
    }
    Agregates.style.display = Agregates.style.display === 'none' ? '' : 'none';
    ChartOrder.style.display = ChartOrder.style.display === 'none' ? '' : 'none';
    // menuSwitch.style.display = menuSwitch.style.display === 'none' ? '' : 'none';
  
    if (tableIcon.style.display === 'none') {
      toggleButton.setAttribute('aria-label', 'Toggle chart');
      toggleButton.title = 'Toggle chart';
      $('.ecl-button').not('button#tb-togle-table').not('#toggleTableBtn').prop('disabled', true);		
      $('#menu').prop('disabled', true);		
      openVizTable()
    } else {
      toggleButton.setAttribute('aria-label', 'Toggle table');
      toggleButton.title = 'Toggle table';      
      $('.ecl-button').not('button#tb-togle-table').prop('disabled', false);		
      $('#menu').prop('disabled', false);		
      closeTable()
    }
  }


  
  addToDOM(targetElement) {
    const container = document.querySelector(targetElement);
    container.appendChild(this.chartControls);

    const self = this; 

		const percentageButton = new Button("tb-togle-percentage", ["ecl-button", "ecl-button--primary", "round-btn"], "SHOW_PERCENTAGE", "", "true");
		const agregatesButton = new Button("toggleAgregates", ["ecl-button", "ecl-button--primary", "round-btn", "btn-relative"], "SHOW_AGGREGATES", "", "true");
		const tableButton = new Button("tb-togle-table", ["ecl-button", "ecl-button--primary", "round-btn"], "SHOW_TABLE", "", "true");
		const orderButton = new Button("tb-togle-order", ["ecl-button", "ecl-button--primary", "round-btn"], "SELECT_ORDER_OF_CHART", "", "true");

    percentageButton.setInnerHtml('<i id="percentage-icon" class="fas fa-percentage"></i>');
    agregatesButton.setInnerHtml(agregateIcon())
    tableButton.setInnerHtml('<i id="table-icon" class="fas fa-table"></i><i id="chart-icon" class="fas fa-chart-bar" style="display: none;"></i>');
    orderButton.setInnerHtml('<i class="fas fa-sort-amount-down"></i>');

    percentageButton.setClickHandler(function() {
      self.toggleChartPercentage(); // Call the class method using the stored reference
    });

    agregatesButton.setClickHandler(function() {
      self.toggleChartAgregates(); // Call the class method using the stored reference
    });

    tableButton.setClickHandler(function() {
      self.toggleIcons(); // Call the class method using the stored reference
    });

    const percentageElement = percentageButton.createButton();
    const agregatesElement = agregatesButton.createButton();
    const tableElement = tableButton.createButton();
    const orderElement = orderButton.createButton();
    

    // document.getElementById("togglePercentage").appendChild(percentageElement);
    document.getElementById("Agregates").appendChild(agregatesElement);
    document.getElementById("toggleTable").appendChild(tableElement);
    document.getElementById("ChartOrder").appendChild(orderElement);

    const dropdownOrderBtn = document.querySelector("#tb-togle-order")

    dropdownOrderBtn.setAttribute("data-bs-toggle", "dropdown");
    dropdownOrderBtn.setAttribute("role", "menuitem");
    dropdownOrderBtn.setAttribute("aria-haspopup", "true");
    dropdownOrderBtn.setAttribute("data-bs-auto-close", "true");
    dropdownOrderBtn.setAttribute("aria-expanded", "false");
    dropdownOrderBtn.setAttribute("data", "dropdown");
    dropdownOrderBtn.setAttribute("data", "dropdown");

    

  }
}


$(document).on('shown.bs.dropdown', function(event) {
const floatingChartControls = new FloatingChartControls(); // Replace this with a reference to the actual instance of the class
  floatingChartControls.setSelectedOrder();
});

// On dropdown close
$(document).on('hidden.bs.dropdown', function(event) {
  var dropdown = $(event.target);
  
  // Set aria-expanded to false        
  dropdown.find('.dropdown-menu').attr('aria-expanded', false);
  
  // Set focus back to dropdown toggle
  dropdown.find('.dropdown-toggle').focus();
});

