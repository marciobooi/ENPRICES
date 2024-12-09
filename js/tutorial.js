let buttonTimer;
let currentStep;
let isOpen = false

function setCookie(name, value, days = 30) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(';');
    for (let i = 0; i < cookieArray.length; i++) {
        let cookie = cookieArray[i].trim();
        if (cookie.indexOf(nameEQ) == 0) return cookie.substring(nameEQ.length, cookie.length);
    }
    return null;
}

function checkAndShowTutorial() {
    const tutorialCookie = getCookie("tutorialShown");
    if (!tutorialCookie) {
        // If the cookie doesn't exist, show the tutorial and set the cookie
        setTimeout(() => {
            tutorial(); // Function to show the tutorial
            setCookie("tutorialShown", "true", 30); // Set cookie for 30 days
        }, 600);
    }
}


function tutorial(buttonTimer) {

	// closeTutorial()

	const introProfile = introJs();

	itens = [
		{
			element: document.querySelector("#find-more-menu-icon"),
			title: languageNameSpace.tutorial["TUTO_1"],
			intro: languageNameSpace.tutorial["TUTO_2"],
			position: 'auto'
		},
		{			
		  element: document.querySelector("rect.highcharts-point.highcharts-color-0:nth-child(2)"),
		  title: languageNameSpace.tutorial["TUTO_3"],
		  intro: languageNameSpace.tutorial["TUTO_4"],
		  position: 'auto'
		},
		{
		  element: document.querySelector("#menu"),
		  title: languageNameSpace.tutorial["TUTO_5"],
		  intro: languageNameSpace.tutorial["TUTO_6"],
		  position: 'auto'
		},
		{
		  element: document.querySelector("#tb-togle-table"),
		  title: languageNameSpace.tutorial["TUTO_7"],
		  intro: languageNameSpace.tutorial["TUTO_8"],
		  position: 'auto'
		},
		{
		  element: document.querySelector("#tb-togle-order"),
		  title: languageNameSpace.tutorial["TUTO_9"],
		  intro: languageNameSpace.tutorial["TUTO_10"],
		  position: 'auto'
		},
		{
		  element: document.querySelector("#toggleAgregates"),
		  title: languageNameSpace.tutorial["TUTO_11"],
		  intro: languageNameSpace.tutorial["TUTO_12"],
		  position: 'auto'
		},
		{			
		  element: document.querySelector("#infoBtn"),
		  title: languageNameSpace.tutorial["TUTO_13"],
		  intro: languageNameSpace.tutorial["TUTO_14"],
		  position: 'auto'
		},
		{			
		  element: document.querySelector("#downloadBtn"),
		  title: languageNameSpace.tutorial["TUTO_15"],
		  intro: languageNameSpace.tutorial["TUTO_16"],
		  position: 'auto'
		},
		{			
		  element:document.querySelector("#embebedBtn"),
		  title: languageNameSpace.tutorial["TUTO_17"],
		  intro: languageNameSpace.tutorial["TUTO_18"],
		  position: 'auto'
		},
		{			
		  element: document.querySelector("#lang-selection"),
		  title: languageNameSpace.tutorial["TUTO_19"],
		  intro: languageNameSpace.tutorial["TUTO_20"],
		  position: 'auto'
		},
		{			
		  element: document.querySelector("#social-media"),
		  title: languageNameSpace.tutorial["TUTO_21"],
		  intro: languageNameSpace.tutorial["TUTO_22"],
		  position: 'auto'
		},
		]

	introProfile.setOptions({
		showProgress: false,
		scrollToElement: false,
		showBullets: false,
		autoPosition:false,
		tooltipClass: "customTooltip",
		exitOnEsc: true,
		nextLabel:  languageNameSpace.labels['NEXT'],
		prevLabel: languageNameSpace.labels['BACK'],
		doneLabel: languageNameSpace.labels['CLOSE'],
		steps: itens
	  });  	 
	  
	  introProfile.onexit(function () { window.scrollTo(0, 0) });

	  const observer = new MutationObserver(() => {
		// Locate the tooltip and title elements
		const tooltip = document.querySelector('.introjs-tooltip');
		const currentStep = introProfile._currentStep; 

		if (tooltip && itens[currentStep].title) {
		  const titleId = `introjs-title-${currentStep}`;

		  const titleElement = tooltip.querySelector('.introjs-tooltip-title');
		  if (titleElement) {
			titleElement.id = titleId;
			tooltip.setAttribute('aria-labelledby', titleId);
		  }
		}
	  });

	  observer.observe(
		document.body,
		{
		  childList: true, 
		  subtree: true,
		}
	  );

	  introProfile.start();
  
	  isOpen = true

	  introProfile.onchange(function () {

		currentStep = this._currentStep

		if (currentStep === 0) {
			document.querySelector("body > div.introjs-tooltipReferenceLayer > div > div.introjs-tooltipbuttons > a.introjs-button.introjs-prevbutton").innerHTML = languageNameSpace.labels['CLOSE']
			setTimeout(() => {
				$("body > div.introjs-tooltipReferenceLayer > div > div.introjs-tooltipbuttons > a.introjs-button.introjs-prevbutton.introjs-disabled").addClass( "close" )
			}, 100);
		} else {
			document.querySelector("body > div.introjs-tooltipReferenceLayer > div > div.introjs-tooltipbuttons > a.introjs-button.introjs-prevbutton").innerHTML = languageNameSpace.labels['BACK']
			$("body > div.introjs-tooltipReferenceLayer > div > div.introjs-tooltipbuttons > a.introjs-button.introjs-prevbutton").removeClass( "CLOSE" )

			$(".introjs-tooltip.customTooltip.introjs-auto").css({
				"left": "50% !important",
				"top": "50%",
				"margin-left": "auto",
				"margin-top": "auto",
				"transform": "translate(-50%,-50%)"
			})
	}

			});

	$("body > div.introjs-tooltipReferenceLayer > div > div.introjs-tooltip-header > a").attr({
		"alt": "Close",
		"id": "tutorialClose",
		"tabindex": "0",
		"href": "javascript:",
		"class": "btn btn-primary min-with--nav"
	});

	document.querySelector("body > div.introjs-tooltipReferenceLayer > div > div.introjs-tooltipbuttons > a.introjs-button.introjs-prevbutton").innerHTML = languageNameSpace.labels['CLOSE']
	$("body > div.introjs-tooltipReferenceLayer > div > div.introjs-tooltipbuttons > a.introjs-button.introjs-prevbutton").addClass( "close " )

	traptutorialfocus()

}

function closeTutorial() {
	buttonTimer = setTimeout("introJs().exit()", 4000);	
	isOpen = false
}

btn = document.querySelector("body > div.introjs-tooltipReferenceLayer > div > div.introjs-tooltipbuttons > a.introjs-button.introjs-nextbutton")
$(document).on('click', btn, function() {
	clearTimeout(buttonTimer)	
});

function closeProcess(params) {
	event.preventDefault();
	introJs().exit()
	buttonTimer = setTimeout("introJs().exit()", 4000);
	clearTimeout(buttonTimer);
	document.querySelector("#tb-tutorial-btn");
	// const button = document.getElementById('tb-tutorial-btn');
	$('button#closeChartMenuBtn').focus();
	isOpen = false
}

$(document).on("click keydown", "#tutorialClose", function(event) {
	const isClickEvent = event.type === "click";
	const isKeyEvent = event.type === "keydown" && (event.key === "Escape" || event.key === "Enter" || event.keyCode === 13);
	if (isClickEvent || isKeyEvent) {
		closeProcess();
	}
  });


$(document).on("click keydown", ".close", function(event) {
	const isClickEvent = event.type === "click";
	const isKeyEvent = event.type === "keydown" && (event.key === "Escape" || event.key === "Enter" || event.keyCode === 13);
	if (isClickEvent || isKeyEvent) {
		closeProcess();
	}
});

  document.addEventListener('keydown', function(event) {
	if (event.key === 'Escape') {
		if(isOpen){
			closeProcess()
		} 
	}
  });



  function traptutorialfocus() {	

	const focusableElements = '.introjs-tooltip.customTooltip.introjs-floating a[role="button"][tabindex="0"]:not([tabindex="-1"])';
	const element = document.querySelector('.introjs-tooltip.customTooltip.introjs-floating');
  
	if (element) {
	  const focusableContent = element.querySelectorAll(focusableElements);
	  const firstFocusableElement = focusableContent[0];
	  const lastFocusableElement = focusableContent[focusableContent.length - 1];
  
	  document.addEventListener('keydown', function (e) {
		const isTabPressed = e.key === 'Tab' || e.keyCode === 9;
  
		if (!isTabPressed) {
		  return;
		}
  
		if (e.shiftKey) {
		  if (document.activeElement === firstFocusableElement) {
			lastFocusableElement.focus();
			e.preventDefault();
		  }
		} else {
		  if (document.activeElement === lastFocusableElement) {
			firstFocusableElement.focus();
			e.preventDefault();
		  }
		}
	  });
  
	  // Set initial focus on the first focusable element
	  if (focusableContent.length > 0) {
		firstFocusableElement.focus();
	  }
	}
  };
  


