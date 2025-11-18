const tutorialCache = {};
let translationsData = null;

var languageNameSpace = {
  labels: {},
  tutorial: {},

  initLanguage: function (val, language) {
    const targetLanguage = resolveLanguage(val, language);
    languageNameSpace.labels = getLabelsForLanguage(targetLanguage);
    languageNameSpace.tutorial = getTutorialForLanguage(targetLanguage);

    if (!Object.keys(languageNameSpace.labels).length) {
      console.error(`[language] Missing labels for ${targetLanguage}`);
      return;
    }
    
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
    if (selectElement.length) {
      selectElement.attr('data-ecl-auto-init', 'Select');
      selectElement.attr('data-ecl-select-multiple', '');
      selectElement.attr('data-ecl-select-default', languageNameSpace.labels["SELITEN"]);
      selectElement.attr('data-ecl-select-search', languageNameSpace.labels["KEYWORD"]);
      selectElement.attr('data-ecl-select-no-results', languageNameSpace.labels["NORESULTS"]);
      selectElement.attr('data-ecl-select-all', languageNameSpace.labels["SELALL"]);
      selectElement.attr('data-ecl-select-clear-all', languageNameSpace.labels["CLEAR"]);
      selectElement.attr('data-ecl-select-close', languageNameSpace.labels["CLOSE"]);
    }

    checkAndShowTutorial()

    ECL.autoInit();
    document.documentElement.lang = targetLanguage.toLowerCase();

    // Clean up any existing tooltips before re-initializing
    cleanupTooltips();

    updateLanguageSelectorLabel();

    enableTooltips();
  },

  ChangeLanguage: function (val) {
    REF.language = val;

    // Clean up tooltips before language change
    cleanupTooltips();

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


function updateLanguageSelectorLabel() {
  const langButton = document.getElementById('toggleLanguageBtn');
  if (langButton) {
    const langText = langButton.querySelector('#lang-selection-text');
    if (langText) {
      const currentLangText = langText.textContent;
      const changeLanguageText = languageNameSpace.labels["CHANGE_LANGUAGE"] || "Change language";
      const currentLanguageText = languageNameSpace.labels["CURRENT_LANGUAGE_IS"] || "current language is";
      langButton.setAttribute("aria-label", `${changeLanguageText}, ${currentLanguageText} ${currentLangText}`);
    }
  }
}

function resolveLanguage(val, language) {
  return (language || val || "EN").toUpperCase();
}

function getLabelsForLanguage(language) {
  if (!translationsData) {
    translationsData = loadJsonSync("data/translations.json") || {};
  }

  const labels = {};
  for (const key in translationsData) {
    if (!Object.prototype.hasOwnProperty.call(translationsData, key)) {
      continue;
    }
    const translationEntry = translationsData[key];
    if (translationEntry && translationEntry[language]) {
      labels[key] = translationEntry[language];
    }
  }
  return labels;
}

function getTutorialForLanguage(language) {
  if (!tutorialCache[language]) {
    tutorialCache[language] = loadJsonSync(`data/tutorial_${language}.json`) || {};
  }
  return tutorialCache[language];
}

function loadJsonSync(url) {
  let result = null;
  $.ajax({
    url,
    dataType: "json",
    async: false,
    cache: true,
    success: function (data) {
      result = data;
    },
    error: function (xhr, status, error) {
      console.error(`[language] Failed to load ${url}:`, error || status);
    }
  });
  return result;
}