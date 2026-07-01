let isOpen = false;
let tutorialDriver;

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

function tutorial() {

	const steps = [
		{
			element: document.querySelector("#find-more-menu-icon"),
			popover: {
				title: languageNameSpace.tutorial["TUTO_1"],
				description: languageNameSpace.tutorial["TUTO_2"]
			}
		},
		{
			element: document.querySelector("rect.highcharts-point.highcharts-color-0:nth-child(2)"),
			popover: {
				title: languageNameSpace.tutorial["TUTO_3"],
				description: languageNameSpace.tutorial["TUTO_4"]
			}
		},
		{
			element: document.querySelector("#menu"),
			popover: {
				title: languageNameSpace.tutorial["TUTO_5"],
				description: languageNameSpace.tutorial["TUTO_6"]
			}
		},
		{
			element: document.querySelector("#tb-togle-table"),
			popover: {
				title: languageNameSpace.tutorial["TUTO_7"],
				description: languageNameSpace.tutorial["TUTO_8"]
			}
		},
		{
			element: document.querySelector("#tb-togle-order"),
			popover: {
				title: languageNameSpace.tutorial["TUTO_9"],
				description: languageNameSpace.tutorial["TUTO_10"]
			}
		},
		{
			element: document.querySelector("#toggleAgregates"),
			popover: {
				title: languageNameSpace.tutorial["TUTO_11"],
				description: languageNameSpace.tutorial["TUTO_12"]
			}
		},
		{
			element: document.querySelector("#switchBtn > div:nth-child(1)"),
			popover: {
				title: languageNameSpace.tutorial["TUTO_23"],
				description: languageNameSpace.tutorial["TUTO_24"]
			}
		},
		{
			element: document.querySelector("#switchBtn > div:nth-child(2)"),
			popover: {
				title: languageNameSpace.tutorial["TUTO_25"],
				description: languageNameSpace.tutorial["TUTO_26"]
			}
		},
		{
			element: document.querySelector("#infoBtn"),
			popover: {
				title: languageNameSpace.tutorial["TUTO_13"],
				description: languageNameSpace.tutorial["TUTO_14"]
			}
		},
		{
			element: document.querySelector("#downloadBtn"),
			popover: {
				title: languageNameSpace.tutorial["TUTO_15"],
				description: languageNameSpace.tutorial["TUTO_16"]
			}
		},
		{
			element: document.querySelector("#embebedBtn"),
			popover: {
				title: languageNameSpace.tutorial["TUTO_17"],
				description: languageNameSpace.tutorial["TUTO_18"]
			}
		},
		{
			element: document.querySelector("#toggleLanguageBtn"),
			popover: {
				title: languageNameSpace.tutorial["TUTO_19"],
				description: languageNameSpace.tutorial["TUTO_20"]
			}
		},
		{
			element: document.querySelector("#social-media"),
			popover: {
				title: languageNameSpace.tutorial["TUTO_21"],
				description: languageNameSpace.tutorial["TUTO_22"]
			}
		},
	];

	// Every step's popover is centered on screen (instead of anchored next to
	// the highlighted element), so the highlight can sit on elements that are
	// off-screen or hard to anchor to (e.g. the footer) without scroll-jacking.
	steps.forEach(step => step.popover.side = "over");

	// The first step has no previous step, so its "Previous" button is
	// repurposed as a "Close" button.
	steps[0].popover.prevBtnText = languageNameSpace.labels['CLOSE'];
	steps[0].popover.disableButtons = [];
	steps[0].popover.onPrevClick = () => closeProcess();

	tutorialDriver = window.driver.js.driver({
		showProgress: false,
		smoothScroll: false,
		overlayOpacity: 0.5,
		stageRadius: 0,
		popoverClass: "customTooltip",
		nextBtnText: languageNameSpace.labels['NEXT'],
		prevBtnText: languageNameSpace.labels['BACK'],
		doneBtnText: languageNameSpace.labels['CLOSE'],
		steps: steps,
		onCloseClick: () => closeProcess(),
		onPopoverRender: (popover) => {
			// driver.js renders the button bar as a bare <footer>, which browsers
			// expose as a second "contentinfo" landmark alongside the real page
			// footer. It's just a button group, not page footer content.
			popover.footer.setAttribute('role', 'none');
		},
		onDestroyed: () => {
			window.scrollTo(0, 0);
			isOpen = false;

			// Return focus to a sensible element after closing the tutorial
			const infoBtnChart = document.querySelector('#infoBtnChart button');
			if (infoBtnChart) infoBtnChart.focus();
		}
	});

	tutorialDriver.drive();

	isOpen = true;
}

function closeProcess() {
	if (tutorialDriver) tutorialDriver.destroy();
}
