# Accessibility statement page for a Eurostat web tool (ECL)

A recipe to add an in-app **accessibility statement** to another Eurostat visualisation tool. It was built for ENPRICES and passes axe-core with 0 violations. Copy this file, replace the `<<PLACEHOLDERS>>`, and give it to Claude.

Result: the footer "Accessibility" link opens `<tool>.html?accessibility`. That is the same page, with the tool hidden and the statement shown. The statement is English only (no translation), uses ECL classes, and needs no extra server file.

---

## 1. Prompt to give Claude

Copy everything in the block below.

```text
Add an accessibility statement page to this tool, following ACCESSIBILITY_PAGE_GUIDE.md.

Goal: when the user clicks the footer "Accessibility" link, the same page opens with
?accessibility in the URL (e.g. <<tool>>.html?accessibility) and shows the accessibility
statement from our Word document instead of the tool. It must pass axe (0 violations).
The statement page has no translation: it is English only, even when the tool language is
DE/FR. Use the ECL library classes (ecl-u-*, ecl-unordered-list, ecl-link, ecl-button),
not custom styling, except where the guide gives custom CSS.

Source text: <<path to the .docx>> (read it with unzip + word/document.xml and keep the
wording; do not invent content). Tool name in the text: "<<Tool name>>".
Production URL: <<https://ec.europa.eu/eurostat/cache/visualisations/<<tool>>/<<tool>>.html>>.
Dates: last tested <<D Month YYYY>>, reviewed <<D Month YYYY>>.

Steps:
1. Add the hidden #accessibilityView block inside <main> of the tool's html (guide, section 3).
2. Add css/newStiles/accessibilityView.css (guide, section 4) and link it.
3. Add isAccessibilityMode() and showAccessibilityView() (guide, section 5).
4. Make the page boot, the component build and the language switch mode-aware (section 6).
5. Point the footer link to ?accessibility&language=XX (section 7).
6. Test with axe-core in both views and fix every violation (section 8).
Then show me a screenshot and list the files you changed.
```

---

## 2. Files touched (ENPRICES names, rename for the other tool)

| File | Change |
|---|---|
| `enprices.html` | add `<link>` to the new CSS; add `#accessibilityView` inside `<main>`, after the tool's `<section>` content |
| `css/newStiles/accessibilityView.css` | new, styles for the view |
| `js/data.js` | `isAccessibilityMode()` and `showAccessibilityView()` |
| `js/createComponents.js` | boot and `buildComponents()` are mode-aware |
| `js/language.js` | `ChangeLanguage` keeps the statement view |
| `js/tutorial.js` | no tour in statement mode |
| `js/domComponents/footerComponent.js` | footer link goes to `?accessibility` |

The tool must already load the ECL CSS (`ecl-reset.css`, `ecl-eu-default.css`, `ecl-eu.css`), Bootstrap 5 and jQuery. If it doesn't, ask Claude to adapt the utility classes.

---

## 3. HTML: the view (put inside `<main>`)

Statement title is an `h2` because the tool header already has the page `h1`. Sections are `h3`. `lang="en"` makes screen readers read English even if the tool is in DE/FR. Repeat the `<section>` block for each of the six sections.

```html
<div id="accessibilityView" class="d-none" lang="en" role="region" aria-labelledby="a11y-statement-title">
  <div class="a11y-wrapper">

    <!-- Back button (top) -->
    <div class="d-flex justify-content-end mt-4 mb-4">
      <a class="ecl-button ecl-button--primary a11y-back-link" href="?">
        <span class="ecl-button__container"><span class="ecl-button__label" data-ecl-label="true">Back to the tool</span></span>
      </a>
    </div>

    <h2 class="ecl-u-type-heading-1" id="a11y-statement-title" tabindex="-1">Accessibility statement</h2>

    <!-- Intro: scope, "you should be able to", standard -->
    <div class="a11y-intro">
      <p class="ecl-u-type-paragraph">This statement applies to content published on the domain:</p>
      <ul class="ecl-unordered-list">
        <li class="ecl-unordered-list__item"><a class="ecl-link" href="<<PRODUCTION URL>>" target="_blank" rel="noreferrer noopener"><<PRODUCTION URL>><span class="ecl-u-sr-only"> (opens in new tab)</span></a></li>
      </ul>
      <p class="ecl-u-type-paragraph">It does not apply to other content or websites published on any of its subdomains. These websites and their content will have their own specific accessibility statement.</p>
      <p class="ecl-u-type-paragraph">This interactive tool is managed by Eurostat. It is designed to be used by as many people as possible, including people with disabilities.</p>
      <p class="ecl-u-type-paragraph">You should be able to:</p>
      <ul class="ecl-unordered-list">
        <li class="ecl-unordered-list__item">zoom up to 200% without problems</li>
        <!-- ...more items from the .docx -->
      </ul>
      <!-- paragraph with the EN 301 549 / WCAG links (target="_blank" links need the sr-only "(opens in new tab)" span) -->
    </div>

    <!-- "On this page" index (bluish box, see CSS) -->
    <nav class="a11y-toc ecl-u-mt-l" aria-labelledby="a11y-toc-title">
      <h3 class="ecl-u-type-heading-3" id="a11y-toc-title">On this page</h3>
      <ul class="ecl-unordered-list">
        <li class="ecl-unordered-list__item"><a class="ecl-link" href="#a11y-compliance-status">Compliance status</a></li>
        <li class="ecl-unordered-list__item"><a class="ecl-link" href="#a11y-preparation-of-this-statement">Preparation of this statement</a></li>
        <li class="ecl-unordered-list__item"><a class="ecl-link" href="#a11y-feedback">Feedback</a></li>
        <li class="ecl-unordered-list__item"><a class="ecl-link" href="#a11y-compatibility-with-browsers-and-assistive-technology">Compatibility with browsers and assistive technology</a></li>
        <li class="ecl-unordered-list__item"><a class="ecl-link" href="#a11y-technical-specifications">Technical specifications</a></li>
        <li class="ecl-unordered-list__item"><a class="ecl-link" href="#a11y-non-accessible-content">Non-accessible content</a></li>
      </ul>
    </nav>

    <div class="a11y-sections">
      <!-- One block per section. The divider is the ECL border utilities, in colour #cfdaf5 (blue-20), BEFORE the title -->
      <section class="ecl-u-border-top ecl-u-border-color-blue-20 ecl-u-mt-xl ecl-u-pt-l" id="a11y-compliance-status" aria-labelledby="a11y-compliance-status-title">
        <h3 class="ecl-u-type-heading-2" id="a11y-compliance-status-title">Compliance status</h3>
        <p class="ecl-u-type-paragraph">This interactive tool is <span class="ecl-u-type-bold">partially compliant</span> with ... See “<a class="ecl-link" href="#a11y-non-accessible-content">Non-accessible content</a>” for more details.</p>
        <p class="ecl-u-type-paragraph">The interactive tool was last tested on <<D Month YYYY>>.</p>
      </section>

      <!-- Preparation of this statement  (id a11y-preparation-of-this-statement) -->
      <!-- Feedback  (phone as tel: link, e-mail as mailto:...?subject=Accessibility, contact form link) -->
      <!-- Compatibility with browsers and assistive technology -->
      <!-- Technical specifications  (HTML, WAI-ARIA, CSS, JavaScript) -->
      <!-- Non-accessible content  (id a11y-non-accessible-content) -->
    </div>

    <!-- Back button (bottom): same markup as the top one -->
    <div class="d-flex justify-content-end mt-4 mb-4">
      <a class="ecl-button ecl-button--primary a11y-back-link" href="?">
        <span class="ecl-button__container"><span class="ecl-button__label" data-ecl-label="true">Back to the tool</span></span>
      </a>
    </div>

  </div>
</div>
```

Rules for the content:
- Section ids must match the index links exactly (`a11y-` + slug of the title).
- Every `target="_blank"` link gets `<span class="ecl-u-sr-only"> (opens in new tab)</span>`.
- Dates are written as `7 July 2026`.
- Keep the wording from the Word document. If the document says automated testing only, don't add "IAAP expert / manual testing" from other tools' statements.

---

## 4. CSS: `css/newStiles/accessibilityView.css`

Link it after the other tool styles: `<link href="css/newStiles/accessibilityView.css" rel="stylesheet">`.

```css
/* Accessibility statement view (<tool>.html?accessibility) */
#accessibilityView {
  padding: 0 1rem 1rem;
}

#accessibilityView .a11y-wrapper {
  max-width: 60rem;
  margin: 0 auto;
}

#accessibilityView #a11y-statement-title {
  margin-bottom: 1.5rem;
}

#accessibilityView #a11y-statement-title:focus {
  outline: none;
}

#accessibilityView .a11y-intro {
  margin-bottom: 1.5rem;
}

/* Inline links in the text: undo the footer's padded, 44px "standalone" link style */
#accessibilityView p .ecl-link,
#accessibilityView li .ecl-link {
  display: inline;
  padding: 0;
  min-height: 0;
  text-decoration: underline;
}

#accessibilityView .ecl-unordered-list {
  margin-bottom: 1rem;
}

#accessibilityView p.ecl-u-type-paragraph {
  margin-bottom: 1rem;
}

/* "On this page" box: bluish background + blue left border */
#accessibilityView .a11y-toc {
  background: #f7f9fd;
  border-left: 4px solid #0e47cb;
  border-radius: 0 4px 4px 0;
  padding: 1rem 1.5rem;
}

#accessibilityView .a11y-toc .ecl-u-type-heading-3 {
  font-size: 1.25rem;
  line-height: 1.75rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
}

#accessibilityView .a11y-toc .ecl-unordered-list {
  margin: 0;
}

/* Bullets in the primary blue */
#accessibilityView .ecl-unordered-list__item::marker {
  color: #0e47cb;
}
```

Design decisions (what was asked for, so don't undo them):
- Plain bulleted ECL lists. No `ecl-unordered-list--divider` and no accordion.
- Dividers go **between sections, before each title**, using `ecl-u-border-top ecl-u-border-color-blue-20` (= `rgb(207, 218, 245)` / `#cfdaf5`).
- Bullets are `#0e47cb`. `::marker` only supports colour and font, so a "4px solid" border isn't possible on a native bullet.
- The inline-link override matters. The tool's footer CSS gives every `.ecl-link` `padding: .75rem; min-height: 44px; display: inline-flex`, which stretches the lines in the text.

---

## 5. JS: mode helpers (`js/data.js`, after `const REF = ...`)

```js
// <tool>.html?accessibility shows the accessibility statement instead of the tool
function isAccessibilityMode() {
  return new URLSearchParams(window.location.search).has("accessibility");
}

function showAccessibilityView() {
  // hide whatever the tool shows: adapt this selector list to the tool's containers
  $('#enprices > #charts, #allContainer, #insightsView, #menu, #menuSwitch, .menuSwitch').addClass('d-none');
  $('#accessibilityView').removeClass('d-none');
  $('.a11y-back-link').attr('href', `?language=${REF.language}`);
  $('#skip-to-content').attr('href', '#a11y-statement-title');   // skip link must not point to a hidden chart
  document.title = 'Accessibility statement - <<Tool name>> - Eurostat';
}
```

`REF.language` is the tool's current-language variable. Rename it if the tool stores language elsewhere.

---

## 6. JS: boot, build and language switch

**`js/createComponents.js`: ready handler.** Right after `languageNameSpace.initLanguage(REF.language);` add:

```js
if (isAccessibilityMode()) {
  if (typeof globanManager !== 'undefined') { globanManager.init(); }
  if (typeof cckManager !== 'undefined') { cckManager.regenerate(REF.language); }
  showAccessibilityView();
  return;               // do not start the tool (no chart init, no data calls)
}
```

**`buildComponents()`.** Build only header + footer in this mode:

```js
function buildComponents() {
  const components = isAccessibilityMode()
    ? [
        { instance: new Footer(), target: '#componentFooter' },
        { instance: new Navbar(), target: '#navbar-container' },
      ]
    : [ /* the tool's normal components */ ];

  components.forEach(({ instance, target }) => instance.addToDOM(target));

  if (!isAccessibilityMode()) {
    populateDropdownData();   // anything that fills the tool's selects
  }
}
```

**`js/language.js`: `ChangeLanguage`.** After `removeComponents(); buildComponents();` add:

```js
if (isAccessibilityMode()) {
  languageNameSpace.initLanguage(REF.language);
  showAccessibilityView();
  return;
}
```

**`js/tutorial.js`: first line of `checkAndShowTutorial()`.** Without this, first-time visitors get the tour on the statement page:

```js
if (isAccessibilityMode()) return;
```

---

## 7. Footer link (`js/domComponents/footerComponent.js`)

Same tab, no `target="_blank"`, no "opens in new tab" text. Keep the translated label via `data-i18n`. A relative `?accessibility` works on any host path, and the language is kept.

```html
<a id="footer-access" href="?accessibility&language=${REF.language}" class="ecl-link ecl-link--standalone ecl-site-footer__link" data-i18n="ACCESS"></a>
```

Note: the tool's URL-state code may rewrite the query string (ENPRICES `setRefURL()` replaces the whole search). That only runs in tool mode, because the statement mode returns early.

---

## 8. Verify with axe-core (WCAG 2.x A/AA + best practice)

`@axe-core/cli` fails when ChromeDriver doesn't match Chrome. Use puppeteer-core with the installed Chrome instead. Run it against a local server, because the tool loads JSON with synchronous XHR and `file://` is blocked.

```bash
npm i puppeteer-core axe-core
python -m http.server 8765        # in the tool folder
```

```js
// run.js   ->   node run.js "http://localhost:8765/<tool>.html?accessibility"
const p = require('puppeteer-core'), fs = require('fs');
(async () => {
  const b = await p.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const pg = await b.newPage();
  pg.on('pageerror', e => console.log('PAGEERROR', e.message));
  await pg.goto(process.argv[2], { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 2500));
  await pg.addScriptTag({ content: fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8') });
  const r = await pg.evaluate(() => axe.run(document, { runOnly: ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice'] }));
  console.log('violations', r.violations.length, 'incomplete', r.incomplete.length);
  r.violations.forEach(v => console.log('V', v.id, v.impact, JSON.stringify(v.nodes.map(n => n.target))));
  r.incomplete.forEach(v => console.log('I', v.id, JSON.stringify(v.nodes.map(n => n.target))));
  await b.close();
})();
```

Check:
- `?accessibility` gives 0 violations.
- The normal tool URL still works, and clicking the footer link lands on the statement.
- A language switch (DE/FR) keeps the statement visible and `lang="en"` on it.
- "Back to the tool" returns to the tool in the same language.
- All index links resolve (`document.querySelector(href)` is not null).

Expected leftovers (existing components, not the statement): a `color-contrast` "incomplete" on the cookie banner or the header title, caused by background images. axe cannot judge those automatically.

---

## 9. Gotchas

- **Do not** create a separate `accessibility.html` or a `/<tool>.html/accessibility.html` path. The tool is served from a fixed path on the Eurostat cache host, so the query-string approach avoids a second deployed file.
- A slow local server can produce a `cleanupTooltips is not defined` error and load the tool view. Re-run the test; it is a script-load timing issue in the test, not the feature.
- The statement `h2`/`h3` levels are intentional: the tool header already contains the `h1`.
- Don't use `data-i18n` on the statement text. The page has no translation by design.
- Production URL, dates and the tool name in the statement must come from the Word document. Confirm which production path is correct, because meta tags such as `og:url` may use a different one.
