class SubNavbar {
    constructor() {
      this.subNavbar = document.createElement('nav');
      this.subNavbar.setAttribute('aria-label', 'Menu toolbar');
      this.subNavbar.setAttribute('id', 'menuToolbar');
      this.subNavbar.setAttribute('class', 'navbar navbar-expand-sm navbar-light bg-light');  

      const browser = `<div class="container-fluid center-align">
            <div class="col-1">              
              <button id="menu" class="btnGroup" type="button" aria-label="${languageNameSpace.labels["MAINMENU"]}" title="${languageNameSpace.labels["MAINMENU"]}" aria-haspopup="true">
                <i class="fas fa-bars"></i>
                <span>Menu</span>             
              </button>
            </div>
            <div class="col-8">
              <div class="text-group">
                <h2 id="title" class="title"></h2>
                <h6 id="subtitle" class="subtitle"></h6>      
              </div>
            </div>
            <div class="col-3">
            <ul id="chartBtns" role="menubar" aria-label="Options graph toolbox" class="navbar-nav ms-auto my-2 my-lg-0 navbar-nav-scroll" style="--bs-scroll-height: 50vw;">
              <li class="nav-item dropdown px-1" id="infoBtnChart" role="none">
                  <button class="ecl-button ecl-button--primary round-btn" type="button" aria-label="InfoBtn" data-bs-toggle="dropdown" role="menuitem" title="Info" aria-haspopup="true" aria-expanded="true" id="infoBtn">
                    <i class="fas fa-info"></i>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end" role="menu" aria-labelledby="infoBtn">     					
                    <button class="dropdown-item" role="menuitem" onclick="tutorial()" aria-label="${languageNameSpace.labels['TUTORIAL']}" value="Tutorial">${languageNameSpace.labels['TUTORIAL']}</button>
                    <button class="dropdown-item" role="menuitem" onclick="openMeta()" aria-label="${languageNameSpace.labels['meta']}" value="Metadata" >${languageNameSpace.labels['meta']}</button>
                    <button class="dropdown-item" role="menuitem" onclick="mailContact()" aria-label="${languageNameSpace.labels['FEED']}" value="Feedback">${languageNameSpace.labels['FEED']}</button>          		
                  </ul>
                </li>
                <li class="nav-item dropdown px-1" id="downloadChart" role="none">
                  <button class="ecl-button ecl-button--primary round-btn" type="button" aria-label="download chart image" data-bs-toggle="dropdown" role="menuitem" title="Download chart image" aria-haspopup="true" aria-expanded="true" id="downloadBtn">
                    <i class="fas fa-download"></i>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end" role="menu" aria-labelledby="Download chart">     					
                    <button class="dropdown-item" role="menuitem" onclick="exportPngChart()" aria-label="${languageNameSpace.labels['downloadPNG']}">${languageNameSpace.labels["downloadPNG"]}</button>
                    <button class="dropdown-item" role="menuitem" onclick="exportJpegChart()" aria-label="${languageNameSpace.labels['downloadJPEG']}">${languageNameSpace.labels["downloadJPEG"]}</button>
                    <button class="dropdown-item" role="menuitem" onclick="exportXlsChart()" aria-label="${languageNameSpace.labels['downloadXLS']}">${languageNameSpace.labels["downloadXLS"]}</button>        		
                  </ul>
                </li>     
                <!-- <li class="nav-item button px-1" id="shareChart" role="none">
                  <button id="shareBtn" title="share chart" type="button" class="btn btn-primary min-with--nav" aria-label="share chart" onclick="">
                    <i class="fas fa-share-alt" aria-hidden="true"></i>
                  </button>
                </li> -->
                <li class="nav-item button px-1" id="embebedChart" role="none">
                  <button id="embebedBtn" title="Embebed chart iframe" type="button" class="ecl-button ecl-button--primary round-btn" aria-label="Embebed chart iframe" onclick="exportIframe()">
                    <i class="fas fa-code" aria-hidden="true"></i>
                  </button>
                </li>

                <li class="nav-item dropdown px-1" id="social-media" role="none">
                  <button class="ecl-button ecl-button--primary round-btn" type="button" aria-label="Share in social media" data-bs-toggle="dropdown" role="menuitem" title="Share chart" aria-haspopup="true" aria-expanded="true" id="shareChart">
                    <i class="fas fa-share-alt" aria-hidden="true"></i>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end" role="menu" aria-labelledby="Share chart">     					
                    <button class="dropdown-item" role="menuitem" onclick="socialNameSpace.twitter()" aria-label="${languageNameSpace.labels['twitter']}">${languageNameSpace.labels["twitter"]}</button>
                    <button class="dropdown-item" role="menuitem" onclick="socialNameSpace.facebook()" aria-label="${languageNameSpace.labels['facebook']}">${languageNameSpace.labels["facebook"]}</button>
                    <button class="dropdown-item" role="menuitem" onclick="socialNameSpace.linkedin()" aria-label="${languageNameSpace.labels['linkedin']}">${languageNameSpace.labels["linkedin"]}</button>        		
                  </ul>
                </li>    

              </ul>
            </div>
            </div>

            
            <div id="chartOptionsMenu" class="toggleMenu">
              <div class="close-button-container">
                <button id="closeChartMenuBtn" class="btn btn-primary close-chart-menu-btn" aria-label="Close chart menu">
                <i class="fas fa-times"></i>
                </button>
              </div>
              <div class="dropdown-grid">
                <div class="row w-75">
                  <div id="containerCountry" class="col-12 col-sm-4 p-2"></div>
                  <div id="containerFuel" class="col-12 col-sm-4 p-2"></div>
                  <div id="containerConsumer" class="col-12 col-sm-4 p-2"></div>
                  <div id="containerYear" class="col-12 col-sm-4 p-2"></div>
                  <div id="containerConsumption" class="col-12 col-sm-4 p-2"></div>
                  <div id="containerUnit" class="col-12 col-sm-4 p-2"></div>
                </div>
              </div>
            </div>
          </div>`;


      const mobileContent = /*html*/`<div class="">
        <div class="col-12 subNavOne">
          <div class="menuBtn">              
              <button id="tools" class="btnGroup" type="button" aria-label="${languageNameSpace.labels["TOOLS"]}" title="${languageNameSpace.labels["TOOLS"]}" aria-haspopup="true">
                <i class="fas fa-ellipsis-h"></i>      
                <span class="iconText">${languageNameSpace.labels["TOOLS"]}</span>    
              </button>
          </div>
          <div class="menuBtn">              
              <button id="menu" class="btnGroup" type="button" aria-label="${languageNameSpace.labels["MAINMENU"]}" title="${languageNameSpace.labels["MAINMENU"]}" aria-haspopup="true">    
                <i class="fas fa-filter"></i>           
                <span class="iconText">${languageNameSpace.labels["MAINMENU"]}</span>           
              </button>
          </div>
          <div class="menuBtn">                    
              <button id="options" class="btnGroup" type="button" aria-label="${languageNameSpace.labels["OPTIONS_DATA"]}" title="${languageNameSpace.labels["OPTIONS_DATA"]}" aria-haspopup="true">
                <i class="fas fa-bars"></i>      
                <span class="iconText">${languageNameSpace.labels["OPTIONS_DATA"]}</span>    
              </button>
            </div>

        <div class="chartMenuMobile d-none">
          <ul id="chartBtns" role="menubar" aria-label="Options graph toolbox" class="navbar-nav ms-auto my-2 my-lg-0 navbar-nav-scroll" style="--bs-scroll-height: 50vw;">
              <li class="nav-item dropdown px-1" id="infoBtnChart" role="none">
                <button class="btn btn-primary min-with--nav  round-btn" type="button" aria-label="InfoBtn" data-bs-toggle="dropdown" role="menuitem" title="Info" aria-haspopup="true" aria-expanded="true" id="infoBtn">
                  <i class="fas fa-info"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end" role="menu" aria-labelledby="infoBtn">     					
                  <button class="dropdown-item" role="menuitem" onclick="tutorial()" aria-label="${languageNameSpace.labels['TUTORIAL']}" value="Tutorial">${languageNameSpace.labels['TUTORIAL']}</button>
                  <button class="dropdown-item" role="menuitem" onclick="openMeta()" aria-label="${languageNameSpace.labels['meta']}" value="Metadata" >${languageNameSpace.labels['meta']}</button>
                  <button class="dropdown-item" role="menuitem" onclick="mailContact()" aria-label="${languageNameSpace.labels['FEED']}" value="Feedback">${languageNameSpace.labels['FEED']}</button>          		
                </ul>
              </li>
              <li class="nav-item dropdown px-1" id="downloadChart" role="none">
                <button class="btn btn-primary min-with--nav  round-btn" type="button" aria-label="download chart image" data-bs-toggle="dropdown" role="menuitem" title="Download chart image" aria-haspopup="true" aria-expanded="true" id="downloadBtn">
                  <i class="fas fa-download"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end" role="menu" aria-labelledby="Download chart">     					
                  <button class="dropdown-item" role="menuitem" onclick="exportPngChart()" aria-label="${languageNameSpace.labels['downloadPNG']}">${languageNameSpace.labels["downloadPNG"]}</button>
                  <button class="dropdown-item" role="menuitem" onclick="exportJpegChart()" aria-label="${languageNameSpace.labels['downloadJPEG']}">${languageNameSpace.labels["downloadJPEG"]}</button>
                  <button class="dropdown-item" role="menuitem" onclick="exportXlsChart()" aria-label="${languageNameSpace.labels['downloadXLS']}">${languageNameSpace.labels["downloadXLS"]}</button>        		
                </ul>
              </li>     
              <li class="nav-item button px-1" id="embebedChart" role="none">
                <button id="embebedBtn" title="Embebed chart iframe" type="button" class="btn btn-primary min-with--nav  round-btn" aria-label="Embebed chart iframe" onclick="exportIframe()">
                  <i class="fas fa-code"></i>
                </button>
              </li>

              <li class="nav-item dropdown px-1" id="social-media-dropdown" role="none">
              <button class="ecl-button ecl-button--primary round-btn" type="button" aria-label="Share in social media" data-bs-toggle="dropdown" role="menuitem" title="Share chart" aria-haspopup="true" aria-expanded="true" id="shareChart1">
                <i class="fas fa-share-alt" aria-hidden="true"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-end" role="menu" aria-labelledby="Share chart">     					
                <button class="dropdown-item" role="menuitem" onclick="socialNameSpace.twitter()" aria-label="${languageNameSpace.labels['twitter']}">${languageNameSpace.labels["twitter"]}</button>
                <button class="dropdown-item" role="menuitem" onclick="socialNameSpace.facebook()" aria-label="${languageNameSpace.labels['facebook']}">${languageNameSpace.labels["facebook"]}</button>
                <button class="dropdown-item" role="menuitem" onclick="socialNameSpace.linkedin()" aria-label="${languageNameSpace.labels['linkedin']}">${languageNameSpace.labels["linkedin"]}</button>        		
              </ul>
            </li>    
          </ul>
        </div>

            <div id="chartOptionsMenu" class="toggleMenu">
              <div class="close-button-container">
                <button id="closeChartMenuBtn" class="btn btn-primary close-chart-menu-btn" aria-label="Close chart menu">
                <i class="fas fa-times"></i>
                </button>
              </div>
              <div class="dropdown-grid">
                <div class="row">        
                <div id="containerCountry" class="col-12 col-sm-4 p-2"></div>
                  <div id="containerFuel" class="col-12 col-sm-4 p-2"></div>
                  <div id="containerConsumer" class="col-12 col-sm-4 p-2"></div>
                  <div id="containerYear" class="col-12 col-sm-4 p-2"></div>
                  <div id="containerConsumption" class="col-12 col-sm-4 p-2"></div>
                  <div id="containerUnit" class="col-12 col-sm-4 p-2"></div>
                </div>
              </div>
            </div>

            <div class="chartOptions d-none">
            </div>


        </div>
        <div class="col-12 subNavTwo">
          <div class="text-group">
              <h2 id="title" class="title"></h2>
              <h6 id="subtitle" class="subtitle"></h6>      
            </div>
        </div>
      </div>`;


         


        if (isMobile) {          
          this.subNavbar.innerHTML = mobileContent         
         setTimeout(() => {
           $('#menuSwitch').appendTo('.chartOptions');
         }, 10);
          
          this.toolsButton = this.subNavbar.querySelector('#tools');
          this.chartToolsMenu = this.subNavbar.querySelector('.chartMenuMobile');

          this.chartOptionsMenu = this.subNavbar.querySelector('#chartOptionsMenu');
          this.chartMenuOpen = this.subNavbar.querySelector('#menu');

          this.chartOptionsButton = this.subNavbar.querySelector('#options');
          this.chartOptionsOpen = this.subNavbar.querySelector('.chartOptions');

       
      
          this.toolsButton.addEventListener('click', () => {     
            $('body').find('.important-styles').removeClass('important-styles');
            $('body').find('.menuOpen').removeClass('menuOpen');

            this.chartOptionsMenu.classList.contains("toggleMenu") ? "" : this.toggleChartOptionsMenu();
            this.chartOptionsOpen.classList.contains("d-none") ? "" : this.chartOptionsOpen.classList.toggle('d-none');
            this.chartToolsMenu.classList.toggle('d-none');

             // btn styles
             this.toolsButton.parentElement.classList.add('menuOpen');
             this.toolsButton.classList.add('important-styles');
          });

          this.chartMenuOpen.addEventListener('click', () => {    
            $('body').find('.important-styles').removeClass('important-styles');
            $('body').find('.menuOpen').removeClass('menuOpen');      
            this.chartToolsMenu.classList.contains("d-none") ? "" : this.chartToolsMenu.classList.toggle('d-none');
            this.chartOptionsOpen.classList.contains("d-none") ? "" : this.chartOptionsOpen.classList.toggle('d-none');
            this.toggleChartOptionsMenu();

            this.chartMenuOpen.parentElement.classList.add('menuOpen');
            this.chartMenuOpen.classList.add('important-styles');

          });

          this.chartOptionsButton.addEventListener('click', () => {   
            $('body').find('.important-styles').removeClass('important-styles');
            $('body').find('.menuOpen').removeClass('menuOpen');
            this.chartOptionsMenu.classList.contains("toggleMenu") ? "" : this.toggleChartOptionsMenu();  
            this.chartToolsMenu.classList.contains("d-none") ? "" : this.chartToolsMenu.classList.toggle('d-none');
            this.chartOptionsOpen.classList.toggle('d-none');

            this.chartOptionsButton.parentElement.classList.add('menuOpen');
            this.chartOptionsButton.classList.add('important-styles');
          });

        } else {

          this.subNavbar.innerHTML = browser         

      

          this.menuButton = this.subNavbar.querySelector('#menu');
          this.chartOptionsMenu = this.subNavbar.querySelector('#chartOptionsMenu');
          this.chartMenuOpen = this.subNavbar.querySelector('#menu');



  
          this.menuButton.addEventListener('click', () => {
            this.toggleChartOptionsMenu();
            trapTab()
          });
  
          this.closeChartMenuBtn = this.subNavbar.querySelector('#closeChartMenuBtn');
  
          this.closeChartMenuBtn.addEventListener('click', () => {
              this.toggleChartOptionsMenu();
          });

        }     
    }
    toggleChartOptionsMenu() {
      this.chartOptionsMenu.classList.toggle('toggleMenu');
      this.chartMenuOpen.classList.toggle('menuOpen');   
    }

    addToDOM(targetElement) {
      const container = document.querySelector(targetElement);
      container.appendChild(this.subNavbar);   
    }
  }











  