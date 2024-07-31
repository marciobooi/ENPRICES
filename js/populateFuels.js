function populateFuel() {


  const conditions = {
    "4100_HOUSEHOLD": "nrg_pc_202_c",
    "4100_HOUSEHOLD": "nrg_pc_202",
    "4100_N_HOUSEHOLD": "nrg_pc_203_c",
    "4100_N_HOUSEHOLD": "nrg_pc_203",
    "6000_HOUSEHOLD": "nrg_pc_204_c",
    "6000_HOUSEHOLD": "nrg_pc_204",
    "6000_N_HOUSEHOLD": "nrg_pc_205_c",
    "6000_N_HOUSEHOLD": "nrg_pc_205"
  };

  const defaultUnit = codesDataset[conditions[`${REF.product}_${REF.consumer}`]].defaultUnit


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

  const singleSelect = new Singleselect(elementId, optionsArray.reverse(), labelDescription, activeElement, textChange, selectedValue => {
      REF.product = selectedValue;
      REF.unit = defaultUnit;
      populateConsumption()
      populateUnit()
      enprices();
  });

  const singleSelectHTML = singleSelect.createSingleSelect();
  target.insertAdjacentHTML('beforeend', singleSelectHTML);



  singleSelect.attachEventListeners();

}


