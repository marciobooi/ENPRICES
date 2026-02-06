
$( document ).ready(function() {

  dataNameSpace.getRefURL();
  ECL.autoInit();

  buildComponents();

languageNameSpace.initLanguage(REF.language);

// Initialize GLOBAN after language is set
if (typeof globanManager !== 'undefined') {
  globanManager.init();
}

// Regenerate CCK with the current language
if (typeof cckManager !== 'undefined') {
  cckManager.regenerate(REF.language);
}



// Initialize chart and hide iframe elements after all setup is complete
initenprices();
hideForIframe();

})

function buildComponents() {
  const components = [
    { instance: new SubNavbar(), target: '#subnavbar-container' },
    { instance: new Footer(), target: '#componentFooter' },
    { instance: new Navbar(), target: '#navbar-container' },
    { instance: new FloatingChartControls(), target: '#componentFooter' },
  ];

  components.forEach(({ instance, target }) => {
    instance.addToDOM(target);
  });

  populateDropdownData();
}

function removeComponents() {
  $('#navbar-container').empty();
  $('#subnavbar-container').empty();
  $('#menuSwitch').remove();
  $('#floatingMenu').empty();
  $('#componentFooter').empty();
}

function populateDropdownData() {
  populateCountries();
  populateFuel();
  populateConsumer();
  populateYearsData();
  populateConsumption();
  populateUnit();

}
