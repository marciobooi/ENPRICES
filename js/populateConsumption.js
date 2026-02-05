function populateConsumption() {
 
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

    consomsList = codesDataset[conditions[`${REF.product}_${REF.consumer}_${REF.component}`]].consoms
    REF.consoms = codesDataset[conditions[`${REF.product}_${REF.consumer}_${REF.component}`]].defaultConsom

    const target = document.querySelector("#containerConsumption");
    const elementId = 'selectConsuption';
    const optionsArray = consomsList;
    const labelDescription = "CONSOM";
    const activeElement = REF.consoms;
    const textChange = "MENU_CONSOM";

    const existingSingleSelect = document.getElementById(elementId);
    if (existingSingleSelect) {
        existingSingleSelect.parentElement.parentElement.remove();
    }
    const singleSelect = new Singleselect(elementId, optionsArray, labelDescription, activeElement, textChange, selectedValue => {
        REF.consoms = selectedValue;
        // populateConsumption()
        enprices();
    });
  
    const singleSelectHTML = singleSelect.createSingleSelect();
    target.insertAdjacentHTML('beforeend', singleSelectHTML);
  
    singleSelect.attachEventListeners();
  }


