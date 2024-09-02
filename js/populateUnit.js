function populateUnit() {

  
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

    unitList = codesDataset[conditions[`${REF.product}_${REF.consumer}`]].unit

    const target = document.querySelector("#containerUnit");
    const elementId = 'selectUnit';
    const optionsArray = unitList;
    const labelDescription = "UNIT";
    const activeElement = REF.unit;
    const textChange = "MENU_UNIT";

    const existingSingleSelect = document.getElementById(elementId);
    if (existingSingleSelect) {
        existingSingleSelect.parentElement.parentElement.remove();
    }
  
  
    const singleSelect = new Singleselect(elementId, optionsArray, labelDescription, activeElement, textChange, selectedValue => {
        REF.unit = selectedValue;
        enprices();
    });
  
    const singleSelectHTML = singleSelect.createSingleSelect();
    target.insertAdjacentHTML('beforeend', singleSelectHTML);
  
    singleSelect.attachEventListeners();



  }