class SubNavbar {
    constructor() {
      this.subNavbar = document.createElement('nav');
      this.subNavbar.setAttribute('aria-label', 'Menu toolbar');
      this.subNavbar.setAttribute('id', 'menuToolbar');
      this.subNavbar.setAttribute('class', 'navbar navbar-expand-sm navbar-light bg-light');  

      const browser = /*html*/ `
      <div class="container-fluid center-align">
        <div class="col-1">
          <button id="menu" class="btnGroup" type="button" data-i18n-label="MAINMENU" data-i18n-title="MAINMENU" aria-haspopup="true">
            <i class="fas fa-bars"></i>
            <span data-i18n="MAINMENU">Menu</span>
          </button>
        </div>
        <div class="col-8">
          <div class="text-group">
            <h2 id="title" class="title"></h2>
            <h6 id="subtitle" class="subtitle"></h6>
          </div>
        </div>
        <div class="col-3">
          <ul id="chartBtns"  data-i18n-label="OPTIONS_GRAPH_TOOLBOX" aria-label="Options graph toolbox" class="navbar-nav ms-auto my-2 my-lg-0 navbar-nav-scroll" style="--bs-scroll-height: 50vw;">
            <li role="menuitem" class="nav-item dropdown px-1" id="infoBtnChart">
              <button class="ecl-button ecl-button--primary round-btn" type="button" data-i18n-label="INFO" data-i18n-title="INFO" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="true" id="infoBtn">
                <i class="fas fa-info"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-end" role="menu" aria-labelledby="infoBtn">
                <li role="menuitem"><button class="dropdown-item ecl-link ecl-link--standalone" onclick="tutorial()" data-i18n="TUTORIAL">Tutorial</button></li>
                <li role="menuitem"><button class="dropdown-item ecl-link ecl-link--standalone" onclick="openMeta()" data-i18n="META">Metadata</button></li>
                <li role="menuitem"><button class="dropdown-item ecl-link ecl-link--standalone" onclick="socialNameSpace.email()" data-i18n="FEED">Feedback</button></li>
              </ul>
            </li>
            <li role="menuitem" class="nav-item dropdown px-1" id="downloadChart">
              <button class="ecl-button ecl-button--primary round-btn" type="button" data-i18n-label="DOWNLOAD_CHART_IMAGE" data-i18n-title="DOWNLOAD_CHART_IMAGE" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="true" id="downloadBtn">
                <i class="fas fa-download"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-end" role="menu" aria-labelledby="downloadBtn">
                <li role="menuitem"><button class="dropdown-item ecl-link ecl-link--standalone" onclick="exportPngChart()" data-i18n="DOWNLOAD_PNG">PNG</button></li>
                <li role="menuitem"><button class="dropdown-item ecl-link ecl-link--standalone" onclick="exportJpegChart()" data-i18n="DOWNLOAD_JPEG">JPEG</button></li>
                <li role="menuitem"><button class="dropdown-item ecl-link ecl-link--standalone" onclick="exportXlsChart()" data-i18n="DOWNLOAD_XLS">XLS</button></li>
              </ul>
            </li>
            <li role="menuitem" class="nav-item button px-1" id="embebedChart">
              <button id="embebedBtn" type="button" class="ecl-button ecl-button--primary round-btn" data-i18n-title="EMBEDDED" data-i18n-label="EMBEDDED" onclick="exportIframe()">
                <i class="fas fa-code" aria-hidden="true"></i>
              </button>
            </li>
            <li role="menuitem" class="nav-item dropdown px-1" id="social-media">
              <button class="ecl-button ecl-button--primary round-btn" type="button" data-i18n-label="SHARE" data-i18n-title="SHARE" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="true" id="shareChart">
                <i class="fas fa-share-alt" aria-hidden="true"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-end" role="menu" aria-labelledby="shareChart">
                <li role="menuitem">
                  <button class="dropdown-item ecl-link ecl-link--standalone" onclick="socialNameSpace.twitter()" data-i18n-label="TWITTER">
                    <img class="ecl-icon ecl-icon--m ecl-link__icon" src="img/social-media/twiter.svg" alt="Twitter Icon" width="24" height="24" focusable="false" aria-hidden="true">
                    <span data-i18n="TWITTER"></span>
                  </button>
                </li>
                <li role="menuitem">
                  <button class="dropdown-item ecl-link ecl-link--standalone" onclick="socialNameSpace.facebook()" data-i18n-label="FACEBOOK">
                    <img class="ecl-icon ecl-icon--m ecl-link__icon" src="img/social-media/face.svg" alt="Facebook Icon" width="24" height="24" focusable="false" aria-hidden="true">
                    <span data-i18n="FACEBOOK"></span>
                  </button>
                </li>
                <li role="menuitem">
                  <button class="dropdown-item ecl-link ecl-link--standalone" onclick="socialNameSpace.linkedin()" data-i18n-label="LINKEDIN">
                    <img class="ecl-icon ecl-icon--m ecl-link__icon" src="img/social-media/linkdin.svg" alt="LinkedIn Icon" width="24" height="24" focusable="false" aria-hidden="true">
                    <span data-i18n="LINKEDIN"></span>
                  </button>
                </li>
              </ul>
            </li>
          </ul>
        </div>
        <div id="chartOptionsMenu" class="toggleMenu">
          <div class="close-button-container">
            <button id="closeChartMenuBtn" class="btn btn-primary close-chart-menu-btn" data-i18n-label="CLOSE">
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
        <button id="tools" class="btnGroup" type="button" data-i18n-label="TOOLS" data-i18n-title="TOOLS" aria-haspopup="true">
            <i class="fas fa-ellipsis-h"></i>      
            <span class="iconText" data-i18n="TOOLS"></span>    
        </button>
    </div>
    <div class="menuBtn">              
        <button id="menu" class="btnGroup" type="button" data-i18n-label="MAINMENU" data-i18n-title="MAINMENU" aria-haspopup="true">    
            <i class="fas fa-filter"></i>           
            <span class="iconText" data-i18n="MAINMENU"></span>           
        </button>
    </div>
    
    <div class="menuBtn">                    
    <button id="options" class="btnGroup" type="button" data-i18n-label="OPTIONS" data-i18n-title="OPTIONS" aria-haspopup="true">
        <i class="fas fa-bars"></i>      
        <span class="iconText" data-i18n="OPTIONS"></span>    
    </button>
</div>


        <div class="chartMenuMobile d-none">
          <ul id="chartBtns"  data-i18n-label="OPTIONS" class="navbar-nav ms-auto my-2 my-lg-0 navbar-nav-scroll" style="--bs-scroll-height: 50vw;">
              <li class="nav-item dropdown px-1" id="infoBtnChart" >
              <button class="btn btn-primary min-with--nav round-btn" type="button" data-i18n-label="INFO" data-i18n-title="INFO" data-bs-toggle="dropdown"  aria-haspopup="true" aria-expanded="true" id="infoBtn">
    <i class="fas fa-info"></i>
</button>

                <ul class="dropdown-menu dropdown-menu-end" role="menu" aria-labelledby="INFO">     					
                <button class="dropdown-item ecl-link ecl-link--standalone"  onclick="tutorial()" data-i18n-label="TUTORIAL" value="Tutorial" aria-label="TUTORIAL" data-i18n="TUTORIAL">TUTORIAL</button>
                <button class="dropdown-item ecl-link ecl-link--standalone"  onclick="openMeta()" data-i18n-label="META" value="Metadata" aria-label="META" data-i18n="META">META</button>
                <button class="dropdown-item ecl-link ecl-link--standalone"  onclick="mailContact()" data-i18n-label="FEED" value="Feedback" aria-label="FEED" data-i18n="FEED">FEED</button>                
                </ul>
              </li>
              <li class="nav-item dropdown px-1" id="downloadChart" >
              <button class="btn btn-primary min-with--nav round-btn" type="button" data-i18n-label="DOWNLOAD" data-bs-toggle="dropdown"  data-i18n-title="DOWNLOAD" aria-haspopup="true" aria-expanded="true" id="downloadBtn">
              <i class="fas fa-download"></i>
            </button>
            
                <ul class="dropdown-menu dropdown-menu-end" role="menu"  data-i18n-labelledby="DOWNLOAD">     					
                <button class="dropdown-item ecl-link ecl-link--standalone"  onclick="exportPngChart()" data-i18n-label="DOWNLOADPNG" aria-label="DOWNLOAD_PNG">DOWNLOADPNG</button>
                <button class="dropdown-item ecl-link ecl-link--standalone"  onclick="exportJpegChart()" data-i18n-label="DOWNLOADJPEG" aria-label="DOWNLOAD_JPEG">DOWNLOADJPEG</button>
                <button class="dropdown-item ecl-link ecl-link--standalone"  onclick="exportXlsChart()" data-i18n-label="DOWNLOADXLS" aria-label="DOWNLOAD_XLS">DOWNLOADXLS</button>
                
                </ul>
              </li>     
              <li class="nav-item button px-1" id="embebedChart" >
              <button id="embebedBtn" type="button" class="btn btn-primary min-with--nav round-btn" data-i18n-label="EMBEDDED" aria-label="EMBEDDED" data-i18n-title="EMBEDDED" onclick="exportIframe()">
              <i class="fas fa-code"></i>
          </button>
          
              </li>

              <li class="nav-item dropdown px-1" id="social-media-dropdown" >
              <button class="ecl-button ecl-button--primary round-btn" type="button" data-i18n-label="SHARE" aria-label="SHARE" data-bs-toggle="dropdown"  data-i18n-title="SHARE" aria-haspopup="true" aria-expanded="true" id="shareChart1">
              <i class="fas fa-share-alt" aria-hidden="true"></i>
          </button>
          <ul class="dropdown-menu dropdown-menu-end" role="menu" data-i18n-labelledby="SHARE">
              <button class="dropdown-item ecl-link ecl-link--standalone"  onclick="socialNameSpace.twitter()" data-i18n-label="TWITTER" aria-label="TWITTER">TWITTER</button>
              <button class="dropdown-item ecl-link ecl-link--standalone"  onclick="socialNameSpace.facebook()" data-i18n-label="FACEBOOK" aria-label="FACEBOOK">FACEBOOK</button>
              <button class="dropdown-item ecl-link ecl-link--standalone"  onclick="socialNameSpace.linkedin()" data-i18n-label="LINKEDIN" aria-label="LINKEDIN">LINKEDIN</button>
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
              this.menuButton.focus();
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











  