var languageNameSpace = {
  labels: {},
  tutorial: {},

  initLanguage: function (val, language) {
    language == "" ? (language = "EN") : (language = val);

    $.ajaxSetup({
      async: false,
    });
    // load the labels for the selected language
    $.getJSON("data/translations.json", function (data) {
      for (let key in data) {
        if (data[key][language]) {
          languageNameSpace.labels[key] = data[key][language];
        }
      }
    }).then(
      $.getJSON("data/tutorial_" + language + ".json", function (data) {
        languageNameSpace.tutorial = data;
      })
    );
    
      const translateElements = (selector, attribute, targetAttr = "text") => {
        $(selector).each(function () {
          let key = $(this).data(attribute);
          let translation = languageNameSpace.labels[key] || key;
          if (targetAttr == "text") {
            $(this).text(translation);
          } else {
            $(this).attr(targetAttr, translation);
          }
        });
      };

      translateElements("[data-i18n]", "i18n", "text");
      translateElements("[data-i18n-label]", "i18n-label", "aria-label");
      translateElements("[data-i18n-labelledby]","i18n-labelledby","aria-labelledby");
      translateElements("[data-i18n-title]", "i18n-title", "title");
      translateElements("optgroup[data-i18n-label]", "i18n-label", "label");  

      getTitle();

      euGlobanContainer();

      // specials

    const selectElement = $("#selectCountries"); 

    selectElement.attr('data-ecl-auto-init', 'Select');
    selectElement.attr('data-ecl-select-multiple', '');
    selectElement.attr('data-ecl-select-default', languageNameSpace.labels["SELITEN"]);
    selectElement.attr('data-ecl-select-search', languageNameSpace.labels["KEYWORD"]);
    selectElement.attr('data-ecl-select-no-results', languageNameSpace.labels["NORESULTS"]);
    selectElement.attr('data-ecl-select-all', languageNameSpace.labels["SELALL"]);
    selectElement.attr('data-ecl-select-clear-all', languageNameSpace.labels["CLEAR"]);
    selectElement.attr('data-ecl-select-close', languageNameSpace.labels["CLOSE"]);

    checkAndShowTutorial()

    ECL.autoInit();

  },

  ChangeLanguage: function (val) {
    REF.language = val;

    removeComponents();
    buildComponents();
    initenprices();
    languageNameSpace.initLanguage(REF.language);

    if (REF.chartId != "mainChart") {
      addAuxiliarBarGraphOptions();
    }

    if ($(".highcharts-data-table").is(":visible")) {
      closeTable();
      openVizTable();
      $("#tb-togle-table").focus();
      $("#table-icon").css("display", "none");
      $("#chart-icon").css("display", "");
    }

    if (REF.chartId !== "mainChart") {
      hideMenuSwitch();
    }

    ECL.autoInit();
  },
};
