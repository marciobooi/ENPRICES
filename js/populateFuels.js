function populateFuel() {
  const target = document.querySelector("#containerFuel");
  const elementId = 'selectFuel';
  const optionsArray = Object.keys(energyProducts);
  const labelDescription = languageNameSpace.labels["FUEL"];
  const activeElement = REF.product;
  const textChange = languageNameSpace.labels["MENU_FUEL"];

  const existingSingleSelect = document.getElementById(elementId);
  if (existingSingleSelect) {    
      existingSingleSelect.parentElement.parentElement.remove();
  }

  const singleSelect = new Singleselect(elementId, optionsArray, labelDescription, activeElement, textChange, selectedValue => {
      REF.product = selectedValue;
      populateConsumption()
      enprices();
  });

  const singleSelectHTML = singleSelect.createSingleSelect();
  target.insertAdjacentHTML('beforeend', singleSelectHTML);



  singleSelect.attachEventListeners();

}


