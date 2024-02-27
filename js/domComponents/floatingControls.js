class FloatingChartControls {
  constructor() {
    this.chartControls = document.createElement('div');
    this.chartControls.className = 'menuSwitch';
    this.chartControls.id = 'menuSwitch';

    this.chartControls.innerHTML = `
      <div>
        <div class="form-check form-switch form-check-reverse">
          <input class="form-check-input focus-ring" type="checkbox" value="${REF.detail == 1 ? 1 : 0}" role="switch" id="switchDetails" ${REF.detail == 1 ? 'checked' : ''}>
          <label class="form-check-label" for="switchDetails">${languageNameSpace.labels['details']}</label>
        </div>
        <div class="form-check form-switch form-check-reverse">
          <input class="form-check-input focus-ring" type="checkbox" value="${REF.component == 1 ? 1 : 0}" role="switch" id="switchComponents" ${REF.component == 1 ? 'checked' : ''}>
          <label class="form-check-label" for="switchComponents">${languageNameSpace.labels['componentsShow']}</label>
        </div>
      </div>
      
      <div>  
        <ul id="floatingMenu">   
        <li class="nav-item px-1" id="togglePercentage" role="none" style="display:${REF.detail == 1 ? "" : "none"}"></li>
        <li class="nav-item px-1" id="Agregates" role="none"></li>			  
          <li class="nav-item dropdown px-1" id="ChartOrder" role="none">
            <ul class="dropdown-menu dropdown-menu-end" role="menu" aria-labelledby="select the order of the chart">     					
              <li><a href="#" class="dropdown-item ${REF.order == "PROTO" ? "selected" : ""}" role="menuitem" aria-label="Protocol order" value="PROTO">${languageNameSpace.labels['SORT_PROTOCOL']}</a></li>
              <li><a href="#" class="dropdown-item ${REF.order == "DESC" ? "selected" : ""}" role="menuitem" aria-label="Descending values" value="DESC" >${languageNameSpace.labels['SORT_DESC']}</a></li>
              <li><a href="#" class="dropdown-item ${REF.order == "ASC" ? "selected" : ""}" aria-selected="true" role="menuitem" aria-label="Ascending values" value="ASC">${languageNameSpace.labels['SORT_ASC']}</a></li>
              <li><a href="#" class="dropdown-item ${REF.order == "ALPHA" ? "selected" : ""}" role="menuitem" aria-label="Alphabetical order" value="ALPHA">${languageNameSpace.labels['SORT_ALPHABETICAL']}</a></li>                		
            </ul>
          </li>

          <li class="nav-item px-1" id="toggleTable" role="none"></li>
        </ul>
      </div>`;


    this.dopdownListSelect();

    // Get all the switch elements
    const switchElements = this.chartControls.querySelectorAll('[role="switch"]');

    // Add event listeners for keyboard navigation
    switchElements.forEach(switchElement => {
      switchElement.addEventListener('keyup', e => {
        if (e.keyCode === 13 || e.keyCode === 32) {
          // Prevent scrolling when the spacebar or enter key is pressed
          e.preventDefault();

          // Toggle the switch when Space or Enter is released
          switchElement.checked = !switchElement.checked;
          switchElement.value = switchElement.value === '1' ? '0' : '1';

          if (switchElement.id === 'switchDetails') {
            REF.detail = switchElement.value === '1' ? 1 : 0;
            REF.chartInDetails= switchElement.value === '1' ? 1 : 0;
          } else if (switchElement.id === 'switchComponents') {
            REF.component = switchElement.value === '1' ? 1 : 0;
          }

          enprices()     

          
        }
      });

      switchElement.addEventListener('click', () => {
        
        // Toggle the switch value between 1 and 0 when clicked
        switchElement.value = switchElement.value === '1' ? '0' : '1';    
        if (switchElement.id === 'switchDetails') {
          REF.detail = switchElement.value === '1' ? 1 : 0;
          REF.chartInDetails= switchElement.value === '1' ? 1 : 0;
        } else if (switchElement.id === 'switchComponents') {
          REF.component = switchElement.value === '1' ? 1 : 0;
        }     

        const percentageButton = this.chartControls.querySelector('#togglePercentage');
        percentageButton.style.display = REF.detail == 1 ? '' : 'none';
        REF.percentage = 0
        populateDropdownData()
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
    const menuSwitch = this.chartControls.querySelector('#menuSwitch div');
  
  
    tableIcon.style.display = tableIcon.style.display === 'none' ? '' : 'none';
    chartIcon.style.display = chartIcon.style.display === 'none' ? '' : 'none';
    if (REF.detail === 1) {
      percentage.style.display = percentage.style.display === 'none' ? '' : 'none';
    }
    Agregates.style.display = Agregates.style.display === 'none' ? '' : 'none';
    ChartOrder.style.display = ChartOrder.style.display === 'none' ? '' : 'none';
    menuSwitch.style.display = menuSwitch.style.display === 'none' ? '' : 'none';
  
    if (tableIcon.style.display === 'none') {
      toggleButton.setAttribute('aria-label', 'Toggle chart');
      toggleButton.title = 'Toggle chart';
      openVizTable()
    } else {
      toggleButton.setAttribute('aria-label', 'Toggle table');
      toggleButton.title = 'Toggle table';      
      closeTable()
    }
  }


  
  addToDOM(targetElement) {
    const container = document.querySelector(targetElement);
    container.appendChild(this.chartControls);

    const self = this; 

		const percentageButton = new Button("tb-togle-percentage", ["ecl-button", "ecl-button--primary", "round-btn"], "Toggle percentage", "", "true");
		const agregatesButton = new Button("toggleAgregates", ["ecl-button", "ecl-button--primary", "round-btn"], languageNameSpace.labels["TOGGLEAGREGATES"], "", "true");
		const tableButton = new Button("tb-togle-table", ["ecl-button", "ecl-button--primary", "round-btn"], "Toggle table", "", "true");
		const orderButton = new Button("tb-togle-order", ["ecl-button", "ecl-button--primary", "round-btn"], "Select order of the chart", "", "true");

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

