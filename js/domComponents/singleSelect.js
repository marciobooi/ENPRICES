
class Singleselect {
    constructor(elementId, optionsArray, labelDescription, activeElement, textChange, changeCallback) {
        this.elementId = elementId;
        this.optionsArray = optionsArray;
        this.labelDescription = labelDescription;
        this.activeElement = activeElement;
        this.textChange = textChange;
        this.changeHandler = changeCallback;
        this.svgArrow = '<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" viewBox="0 0 24 24" enable-background="new 0 0 24 24" focusable="false" aria-hidden="true" class="ecl-icon ecl-icon--s ecl-select__icon-shape ecl-icon--rotate-180"><path d="M18.2 17.147c.2.2.4.3.7.3.3 0 .5-.1.7-.3.4-.4.4-1 0-1.4l-7.1-7.1c-.4-.4-1-.4-1.4 0l-7 7c-.3.4-.3 1 .1 1.4.4.4 1 .4 1.4 0l6.2-6.2 6.4 6.3z"></path></svg>'
    
        document.addEventListener('change', (event) => {
            event.target.id === this.elementId && this.changeHandler ? this.changeHandler(event.target.value) : null;
        });        
    } 


    createSingleSelect() {    
        const singleSelectHTML = /*html*/`
                <div class="ecl-form-group" role="application">
                <label for="${this.elementId}" class="ecl-form-label" data-i18n="${this.labelDescription}"></label>  
                    <div class="ecl-select__container ecl-select__container--l">
                        <select class="ecl-select" id="${this.elementId}" name="country" required="">
                            ${this.optionsArray.map(option => `
                                    <option value="${option}" ${this.activeElement === option ? 'selected' : ''} data-i18n="${option}">
                                   
                                </option>`).join('')
                            }
                        </select>
                        <div class="ecl-select__icon">
                            ${this.svgArrow} 
                        </div>
                    </div>
                </div>`;

        return singleSelectHTML;
    }

    attachEventListeners() {
        // Attach event listeners for mouseenter and mouseleave events to show/hide textChange
        const labelElement = document.querySelector(`label[for="${this.elementId}"]`);
        const selectElement = document.getElementById(this.elementId);
    
        if (!labelElement || !selectElement) return; // Check if elements exist
    
        selectElement.addEventListener('mouseenter', () => {
            const translatedText = languageNameSpace.labels[this.textChange] || this.textChange;
            labelElement.textContent = translatedText;
        });
    
        selectElement.addEventListener('mouseleave', () => {
            const translatedText = languageNameSpace.labels[this.labelDescription] || this.labelDescription;
            labelElement.textContent = translatedText;
        });
    }

}
