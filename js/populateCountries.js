function populateCountries() {
    const target = document.querySelector("#containerCountry");
    const elementId = 'selectCountries';
    const labelDescription = languageNameSpace.labels["COUNTRY"];
    const textChange = languageNameSpace.labels["MENU_COUNTRY"];

    const existingSingleSelect = document.getElementById(elementId);
    if (existingSingleSelect) {    
        existingSingleSelect.parentElement.parentElement.remove();
    }

    const allCountries = ["EU27_2020","EA","BE","BG","CZ","DK","DE","EE","IE","EL","ES","FR","HR","IT","CY","LV","LT","LU","HU","MT","NL","AT","PL","PT","RO","SI","SK","FI","SE","IS","LI","NO","ME","MK","AL","RS","TR","BA","XK","MD","UA","GE"];
    const countriesAgregates = ["EU27_2020", "EA"];

    const EU_MEMBER_COUNTRY_CODES = ['BE', 'BG', 'CZ', 'DK', 'DE', 'EE', 'IE', 'EL', 'ES', 'FR', 'HR', 'IT', 'CY', 'LV', 'LT', 'LU', 'HU', 'MT', 'NL', 'AT', 'PL', 'PT', 'RO', 'SI', 'SK', 'FI', 'SE'];

    const NON_MEMBER_COUNTRY_CODES = allCountries.filter(country => !EU_MEMBER_COUNTRY_CODES.includes(country) && !countriesAgregates.includes(country));

    const html = /*html*/`
      
            <div class="ecl-form-group" role="application">
                <label for="selectCountries" id="selectCountry" class="ecl-form-label">${languageNameSpace.labels["MENU_COUNTRY"]}</label>
                <div class="ecl-select__container ecl-select__container--m">
                    <select class="ecl-select" id="selectCountries" name="country" required="" multiple="" 
                        data-ecl-auto-init="Select" 
                        data-ecl-select-multiple=""
                        data-ecl-select-default="${languageNameSpace.labels["SELITEN"]}" 
                        data-ecl-select-search="${languageNameSpace.labels["KEYWORD"]}" 
                        data-ecl-select-no-results="${languageNameSpace.labels["NORESULTS"]}" 
                        data-ecl-select-all="${languageNameSpace.labels["SELALL"]}"
                        data-ecl-select-clear-all="${languageNameSpace.labels["CLEAR"]}" 
                        data-ecl-select-close="${languageNameSpace.labels["CLOSE"]}">
                        <optgroup label="Agreggates">
                            ${countriesAgregates.map(ctr => `<option value="${ctr}">${languageNameSpace.labels[ctr]}</option>`).join('')}
                        </optgroup>
                        <optgroup label="European members">
                            ${EU_MEMBER_COUNTRY_CODES.map(ctr => `<option value="${ctr}">${languageNameSpace.labels[ctr]}</option>`).join('')}
                        </optgroup>
                        <optgroup label="Non European members">
                            ${NON_MEMBER_COUNTRY_CODES.map(ctr => `<option value="${ctr}">${languageNameSpace.labels[ctr]}</option>`).join('')}
                        </optgroup>
                    </select>
                    <div class="ecl-select__icon">
                        <svg class="ecl-icon ecl-icon--s ecl-icon--rotate-180 ecl-select__icon-shape"
                            focusable="false" aria-hidden="true">
                            <use xlink:href="/component-library/dist/media/icons.75c96284.svg#corner-arrow"></use>
                        </svg>
                    </div>
                </div>
            </div>`;

    $(target).append(html);

    $(document).on('mouseover', `#containerCountry > div > div > div.ecl-select__multiple > div:nth-child(1) > input`, function(event) {
        console.log('here')
        $('#containerCountry > div > div > div.ecl-select__multiple > div:nth-child(1) > input').hover(
            function() {
                $(`label#selectCountry`).text(textChange);
            },
            function() {
                $(`label#selectCountry`).text(labelDescription);
            }
        );
    });

    $(document).on('click', `button.ecl-button.ecl-button--primary`, function(event) {
        const selectedValues = Array.from(document.getElementById('selectCountries').selectedOptions).map(option => option.value);
        REF.geos = selectedValues;
        enprices();
    });

    ECL.autoInit();

    // Trigger "Select all"
    document.querySelector('.ecl-checkbox__input').click();
}
