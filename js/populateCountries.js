function populateCountries() {
    const target = document.querySelector("#containerCountry");
    const elementId = 'selectCountries';
    const labelDescription = languageNameSpace.labels["CTR"];
    const textChange = languageNameSpace.labels["MENU_COUNTRY"];

    const existingSingleSelect = document.getElementById(elementId);
    if (existingSingleSelect) {    
        existingSingleSelect.parentElement.parentElement.remove();
    }

    const allCountries = ["EU27_2020","EA","BE","BG","CZ","DK","DE","EE","IE","EL","ES","FR","HR","IT","CY","LV","LT","LU","HU","MT","NL","AT","PL","PT","RO","SI","SK","FI","SE","IS","LI","NO","ME","MK","AL","RS","TR","BA","XK","MD","UA","GE"];
    const AGGREGATES_COUNTRY_CODES = ["EU27_2020", "EA"];
    const EU_COUNTRY_CODES = ["BE", "BG", "CZ", "DK", "DE", "EE", "IE", "EL", "ES", "FR", "HR", "IT", "CY", "LV", "LT", "LU", "HU", "MT", "NL", "AT", "PL", "PT", "RO", "SI", "SK", "FI", "SE"];
    const EFTA_COUNTRY_CODES = ["IS", "LI", "NO"];
    const ENLARGEMENT_COUNTRY_CODES = [
        "ME", "MK", "AL", "RS", "TR", "BA", "XK"
    ].sort();
    const OTHER_THIRD_COUNTRY_CODES = ["UA", "MD", "GE"];

    const html = /*html*/`
      
            <div class="ecl-form-group" role="application">
                <label for="selectCountries" id="selectCountry" class="ecl-form-label">${languageNameSpace.labels["CTR"]}</label>
                <div class="ecl-select__container ecl-select__container--l">
                    <select class="ecl-select" id="selectCountries" name="country" required="" multiple="" 
                        data-ecl-auto-init="Select" 
                        data-ecl-select-multiple=""
                        data-ecl-select-default="${languageNameSpace.labels["SELITEN"]}" 
                        data-ecl-select-search="${languageNameSpace.labels["KEYWORD"]}" 
                        data-ecl-select-no-results="${languageNameSpace.labels["NORESULTS"]}" 
                        data-ecl-select-all="${languageNameSpace.labels["SELALL"]}"
                        data-ecl-select-clear-all="${languageNameSpace.labels["CLEAR"]}" 
                        data-ecl-select-close="${languageNameSpace.labels["CLOSE"]}">
                        <optgroup label="${languageNameSpace.labels['AGGREGATE']}">
                        ${AGGREGATES_COUNTRY_CODES.map(ctr => `<option value="${ctr}" ${REF.geos.includes(ctr) ? 'selected' : ''}>${languageNameSpace.labels[ctr]}</option>`).join('')}
                    </optgroup>            
                    <optgroup label="${languageNameSpace.labels['EUCTR']}">
                        ${EU_COUNTRY_CODES.map(ctr => `<option value="${ctr}" ${REF.geos.includes(ctr) ? 'selected' : ''}>${languageNameSpace.labels[ctr]}</option>`).join('')}
                    </optgroup>
                    <optgroup label="${languageNameSpace.labels['EFTA']}">
                        ${EFTA_COUNTRY_CODES.map(ctr => `<option value="${ctr}" ${REF.geos.includes(ctr) ? 'selected' : ''}>${languageNameSpace.labels[ctr]}</option>`).join('')}
                    </optgroup>
                    <optgroup label="${languageNameSpace.labels['ENLARGEMENT']}">
                        ${ENLARGEMENT_COUNTRY_CODES.map(ctr => `<option value="${ctr}" ${REF.geos.includes(ctr) ? 'selected' : ''}>${languageNameSpace.labels[ctr]}</option>`).join('')}
                    </optgroup>
                    <optgroup label="${languageNameSpace.labels['OTHERCTR']}">
                        ${OTHER_THIRD_COUNTRY_CODES.map(ctr => `<option value="${ctr}" ${REF.geos.includes(ctr) ? 'selected' : ''}>${languageNameSpace.labels[ctr]}</option>`).join('')}
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

    // document.querySelector("#containerCountry > div > div.ecl-select__multiple > div:nth-child(1) > input")

$(document).on('mouseover', '#containerCountry > div > div.ecl-select__multiple > div:nth-child(1) > input', function() {
    log('here')
    $("#selectCountry").text(textChange);
});

$(document).on('mouseout', `#containerCountry > div > div.ecl-select__multiple > div:nth-child(1) > input`, function() {
    $("#selectCountry").text(labelDescription);
});

    $(document).on('click', `.ecl-select-multiple-toolbar > .ecl-button.ecl-button--primary`, function(event) {
        const selectedValues = Array.from(document.getElementById('selectCountries').selectedOptions).map(option => option.value);
        REF.geos = selectedValues;
        enprices();
    });

    ECL.autoInit();



    const selectAllContainer = document.querySelector('.ecl-select__multiple');


    
setTimeout(() => {
 if (selectAllContainer) {    
            const allSelected = REF.geos.length === allCountries.length;

            // Handle individual checkboxes
            const checkboxes = selectAllContainer.querySelectorAll('.ecl-checkbox__input:not([id^="select-multiple-all"])');
            checkboxes.forEach(checkbox => {          
                const countryCode = checkbox.id.split('-')[2];
                checkbox.checked = REF.geos.includes(countryCode);
            });

            // Handle "Select all" checkbox
            const selectAllCheckbox = selectAllContainer.querySelector('.ecl-checkbox__input[id^="select-multiple-all"]');
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = allSelected;
            }

            const selectionsCounter = document.querySelector('.ecl-select-multiple-selections-counter');
            const spanElement = selectionsCounter.querySelector('span');
            selectionsCounter.classList.add('ecl-select-multiple-selections-counter--visible');
            spanElement.textContent = REF.geos.length > 0 ? REF.geos.length : "42";
        }
}, 1000);
    
}


