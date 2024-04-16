function populateYearsData() {

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


  const dataset = conditions[`${REF.product}_${REF.consumer}_${REF.component}`];

  const url = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/"+dataset+"?format=JSON&geo=EU27_2020&nrg_cons=TOT_KWH&currency=EUR";  

  const yearsArray = JSONstat(url).Dataset(0).Dimension("time").id;  

  var numberOfItems = $("#dropdown-years-list").children().length;

  if(numberOfItems !== yearsArray.length) {
    REF.time = yearsArray[yearsArray.length - 1]
  }


  const target = document.querySelector("#containerYear");
  const elementId = 'selectYear';
  const optionsArray = yearsArray.reverse();;
  const labelDescription = languageNameSpace.labels["YEAR"];
  const activeElement = REF.time;
  const textChange = languageNameSpace.labels["MENU_YEARS"];

  const existingSingleSelect = document.getElementById(elementId);
  if (existingSingleSelect) {
      existingSingleSelect.parentElement.parentElement.remove();
  }

  const singleSelect = new Singleselect(elementId, optionsArray, labelDescription, activeElement, textChange, selectedValue => {
      REF.time = selectedValue;
      enprices();
  });

  const singleSelectHTML = singleSelect.createSingleSelect();
  target.insertAdjacentHTML('beforeend', singleSelectHTML);

  singleSelect.attachEventListeners();
}



