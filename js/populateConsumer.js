function populateConsumer() {
    const target = document.querySelector("#containerConsumer");
    const elementId = 'selectConsumer';
    const optionsArray = Object.keys(energyConsumers);
    const labelDescription = "CONSUMER";
    const activeElement = REF.product;
    const textChange = "MENU_CONSUMER";
    

  const existingSingleSelect = document.getElementById(elementId);
  if (existingSingleSelect) {
      existingSingleSelect.parentElement.parentElement.remove();
  }

    const singleSelect = new Singleselect(elementId, optionsArray, labelDescription, activeElement, textChange, selectedValue => {
        REF.consumer = selectedValue;
        populateConsumption()
        enprices();
    });

    const singleSelectHTML = singleSelect.createSingleSelect();
    target.insertAdjacentHTML('beforeend', singleSelectHTML);

    singleSelect.attachEventListeners();
}


