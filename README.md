# NECPR - React + TypeScript + Vite + Europa Component Library

This project is a React TypeScript application built with Vite and integrated with the Europa Component Library (ECL) for European Union styling and components.

## Features

- **React 19** with TypeScript
- **Vite** for fast development and building
- **Europa Component Library (ECL) v5.0.0-alpha.14** for EU components
- **ECL Preset EU** for European Union specific styling
- **Eurostat Webtools** integration:
  - **Cookie Consent Kit (CCK)** - EU cookie compliance
  - **Globan** - Global banner for EU websites
- Pre-configured with ECL components and styling

## Getting Started

### Prerequisites

- **Node.js 20.9.0 (LTS)** - recommended for ECL compatibility
- **npm** or **yarn**
- **Git** for version control

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/marciobooi/NECPR.git
   cd NECPR
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`

### Available Scripts

- **`npm run dev`** - Start development server with hot reload
- **`npm run build`** - Build for production
- **`npm run preview`** - Preview production build locally
- **`npm run lint`** - Run ESLint for code quality checks

### Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory, ready for deployment.

### Preview Production Build

```bash
npm run preview
```

This serves the production build locally for testing before deployment.

## Europa Component Library (ECL)

This project integrates the Europa Component Library which provides:

- **Accessible components** - All ECL components meet EU accessibility standards
- **Responsive design** - Components work across all screen sizes
- **EU branding compliance** - Follows official European Commission design guidelines
- **Pre-tested components** - Components are thoroughly tested for reliability

### ECL Components Used

- **Site Header** - European Commission branded header
- **Buttons** - Primary, secondary, and other button variants
- **Cards** - Content cards with consistent styling
- **Messages** - Info, warning, and error messages
- **Footer** - European Commission branded footer
- **Typography** - Consistent text styling and hierarchy
- **Grid system** - Responsive layout system

### ECL Documentation

- [ECL GitHub Repository](https://github.com/ec-europa/europa-component-library)
- [ECL Documentation](https://ec.europa.eu/component-library/)
- [ECL Components Demo](https://ec.europa.eu/component-library/v4.11.0/)

## Eurostat Webtools Integration

This project includes integration with essential Eurostat Webtools:

### Cookie Consent Kit (CCK)
- **Automatic cookie compliance** for EU regulations
- **GDPR compliant** cookie management
- **Customizable consent banner** 
- Automatically loads and initializes on page load

### Globan (Global Banner)
- **Official EU global banner** for branding consistency
- **Responsive design** across all devices
- **Multi-language support**
- Automatically displays the EU header banner

### Usage

The Webtools are automatically initialized when the app loads:

```tsx
import { useWebtoolsInit } from './hooks/useWebtools'

function App() {
  // This automatically initializes both CCK and Globan
  useWebtoolsInit();
  
  return <div className="ecl">{/* Your content */}</div>
}
```

### Utility Functions

Additional utility functions are available:

```tsx
import { webtools } from './hooks/useWebtools'

// Check if tools are available
webtools.isCCKAvailable()
webtools.isGlobanAvailable()

// Reinitialize tools (useful for SPA navigation)
webtools.reinitCCK()
webtools.reinitGloban()
```

## Project Structure

```
src/
├── App.tsx               # Main application component with ECL demo
├── App.css               # Custom styles (minimal, ECL takes precedence)
├── index.css             # ECL imports and base styles
├── main.tsx              # Application entry point with ECL initialization
├── hooks/
│   └── useWebtools.ts    # React hook for Eurostat Webtools
├── types/
│   └── webtools.d.ts     # TypeScript definitions for Webtools
└── assets/               # Static assets
```

## Project Configuration

### ECL (Europa Component Library) Setup

The project is configured with ECL EU preset for European Union websites:

```css
/* ECL imports in src/index.css */
@import '@ecl/preset-eu/dist/styles/optional/ecl-reset.css';
@import '@ecl/preset-eu/dist/styles/ecl-eu.css';
@import '@ecl/preset-eu/dist/styles/optional/ecl-eu-utilities.css';
```

**Available ECL Components:**
- Buttons: `ecl-button ecl-button--primary`
- Grid: `ecl-container`, `ecl-row`, `ecl-col-*`
- Typography: `ecl-u-type-heading-*`, `ecl-u-type-paragraph`
- Messages: `ecl-message ecl-message--info`
- Cards: `ecl-card`
- Site Header: `ecl-site-header`
- Footer: `ecl-footer`

### Webtools Configuration

Located in `index.html`, the project includes:

#### Cookie Consent Kit (CCK)
```html
<script type="application/json">
{
  "utility": "cck",
  "lang": "en",
  "cookie_notice_url": "https://commission.europa.eu/cookies-policy_en"
}
</script>
```

#### Globan (Global Banner)
```html
<script type="application/json">
{
  "utility": "globan",
  "lang": "en"
}
</script>
```

### TypeScript Configuration

The project includes TypeScript declarations for Webtools in `src/types/webtools.d.ts`:

```typescript
declare global {
  interface Window {
    cck: any;
    globan: any;
  }
}
```

## Development Guidelines

1. **Use ECL components** whenever possible instead of custom components
2. **Follow ECL design patterns** for spacing, typography, and colors
3. **Import ECL styles** properly in CSS files
4. **Use ECL utility classes** for consistent styling
5. **Test accessibility** - ECL components are pre-tested but custom code should be verified

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Dependencies

### Main Dependencies
- `react` - React library
- `react-dom` - React DOM rendering
- `@ecl/preset-eu` - Europa Component Library EU preset

### Development Dependencies
- `vite` - Build tool and dev server
- `typescript` - TypeScript compiler
- `@vitejs/plugin-react` - Vite React plugin
- ESLint configuration for code quality

## Additional Notes

- **Pikaday**: ECL uses Pikaday for datepickers. Install if using date components
- **moment.js**: Required for custom date formatting with datepickers
- **ECL JavaScript**: Automatically imported for component functionality
- **Browser Support**: ECL supports modern browsers as defined in .browserslistrc

## Usage Examples

### Basic ECL Component Usage

```tsx
import React from 'react';

function MyComponent() {
  return (
    <div className="ecl">
      {/* ECL Button */}
      <button className="ecl-button ecl-button--primary">
        Primary Button
      </button>
      
      {/* ECL Card */}
      <div className="ecl-card">
        <div className="ecl-card__body">
          <h2 className="ecl-card__title">Card Title</h2>
          <p className="ecl-card__description">Card description text</p>
        </div>
      </div>
      
      {/* ECL Message */}
      <div className="ecl-message ecl-message--info" role="alert">
        <div className="ecl-message__content">
          <div className="ecl-message__title">Information</div>
          <p className="ecl-message__description">This is an info message</p>
        </div>
      </div>
    </div>
  );
}
```

### Using Webtools Hook

```tsx
import React from 'react';
import { useWebtoolsInit } from './hooks/useWebtools';

function App() {
  // Initialize Webtools automatically
  useWebtoolsInit();
  
  return (
    <div className="ecl">
      {/* Your app content */}
      <h1 className="ecl-u-type-heading-1">Welcome to NECPR</h1>
    </div>
  );
}
```

### Webtools Utilities

```tsx
import { webtools } from './hooks/useWebtools';

// Check if tools are available
console.log('CCK available:', webtools.isCCKAvailable());
console.log('Globan available:', webtools.isGlobanAvailable());
console.log('Available webtools:', webtools.getAvailableWebtools());
```

## Troubleshooting

### Common Issues

#### Webtools Not Loading
- **Check browser console** for errors
- **Verify network requests** to `europa.eu/webtools/`
- **Ensure JSON configuration** is valid in `index.html`
- **Cookie Notice URL** is required for CCK functionality

#### ECL Styles Not Applied
- **Verify imports** in `src/index.css`
- **Check ECL wrapper** - components must be inside `<div className="ecl">`
- **Clear browser cache** and rebuild the project

#### TypeScript Errors
- **Run build command** to check for compilation errors
- **Check type declarations** in `src/types/webtools.d.ts`
- **Restart TypeScript server** in VS Code

### Console Debugging

When the application loads, check the browser console for:

```
✅ Expected Messages:
- "Webtools hook initialized - tools should load automatically via JSON config"
- "✅ Globan detected in DOM: X elements"
- "✅ Cookie Consent Kit detected in DOM: X elements"

❌ Error Messages to Watch For:
- "WTINFO - Please indicate in the UEC embed code, the URL(s) to your Cookie Notice Page"
- "Duplicate 'load.js' found in the page"
- ECL import errors in CSS
```

### Performance Tips

- **ECL components are optimized** for accessibility and performance
- **Webtools load asynchronously** and won't block page rendering
- **Use ECL utility classes** instead of custom CSS when possible
- **Bundle size** is optimized with Vite's tree-shaking

## Browser Support

- **Modern browsers** (Chrome, Firefox, Safari, Edge)
- **ECL follows** [browserslist configuration](https://github.com/ec-europa/europa-component-library/blob/v4-dev/.browserslistrc)
- **Webtools support** all browsers supported by EU websites

## Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes** following the coding guidelines
4. **Test your changes**: `npm run build` and `npm run lint`
5. **Commit your changes**: `git commit -m "Add your descriptive message"`
6. **Push to the branch**: `git push origin feature/your-feature-name`
7. **Create a Pull Request`

### Coding Guidelines

- **Follow ECL design patterns** for UI components
- **Use TypeScript** for type safety
- **Write clear commit messages** describing the changes
- **Test Webtools integration** before pushing
- **Update documentation** when adding new features

### Adding New ECL Components

1. **Check ECL documentation** for the component structure
2. **Add TypeScript types** if needed
3. **Follow ECL naming conventions** for CSS classes
4. **Test accessibility** features
5. **Document usage** in comments or README

## License

This project is licensed under the **EUPL-1.1 License** - see the [LICENSE](LICENSE) file for details.

## Resources and Links

### Official Documentation
- **[ECL Documentation](https://ec.europa.eu/component-library/eu/)** - Europa Component Library
- **[ECL GitHub](https://github.com/ec-europa/europa-component-library)** - Source code and examples
- **[Eurostat Webtools](https://webgate.ec.europa.eu/fpfis/wikis/display/webtools/)** - Webtools documentation
- **[EU Cookie Policy](https://commission.europa.eu/cookies-policy_en)** - Cookie compliance information

### React and Vite
- **[React Documentation](https://react.dev/)** - React 19 features and guides
- **[Vite Documentation](https://vite.dev/)** - Build tool configuration
- **[TypeScript Handbook](https://www.typescriptlang.org/docs/)** - TypeScript reference

### EU Guidelines
- **[EU Web Design Guidelines](https://ec.europa.eu/component-library/eu/guidelines/)** - Design principles
- **[EU Accessibility Guidelines](https://ec.europa.eu/digital-single-market/en/european-accessibility-act)** - Accessibility standards
- **[GDPR Compliance](https://commission.europa.eu/law/law-topic/data-protection_en)** - Data protection requirements

## Support

For questions and support:
- **ECL Issues**: [ECL GitHub Issues](https://github.com/ec-europa/europa-component-library/issues)
- **Webtools Support**: Contact COMM Europa Management
- **Project Issues**: Create an issue in this repository

---

## Internationalization (i18n)

The NECPR project includes full internationalization support with **English** (default), **French**, and **German** translations.

### Supported Languages

| Language | Code | Native Name | Status |
|----------|------|-------------|--------|
| English  | `en` | English     | ✅ Default |
| French   | `fr` | Français    | ✅ Complete |
| German   | `de` | Deutsch     | ✅ Complete |

### Features

- **Automatic language detection** from browser settings
- **Persistent language selection** stored in localStorage
- **Dynamic Webtools language switching** (Globan & CCK)
- **URL parameter support** for language switching (`?lng=fr`)
- **Fallback to English** for missing translations

### Usage

#### Basic Translation Usage

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('welcome.title')}</h1>
      <p>{t('welcome.description')}</p>
      <button>{t('common.buttons.getStarted')}</button>
    </div>
  );
}
```

#### Language Selector Integration

```tsx
import { LanguageSelector } from '../components/LanguageSelector';

function Header() {
  return (
    <header>
      {/* Other header content */}
      <LanguageSelector />
    </header>
  );
}
```

#### Programmatic Language Change

```tsx
import { useTranslation } from 'react-i18next';

function useLanguageControl() {
  const { i18n } = useTranslation();
  
  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
  };
  
  return { changeLanguage, currentLanguage: i18n.language };
}
```

### Translation Files Structure

```
src/i18n/locales/
├── en/
│   └── translation.json    # English translations
├── fr/
│   └── translation.json    # French translations
└── de/
    └── translation.json    # German translations
```

### Adding New Translations

1. **Add the key** to all translation files:

```json
// en/translation.json
{
  "newFeature": {
    "title": "New Feature",
    "description": "This is a new feature description"
  }
}

// fr/translation.json
{
  "newFeature": {
    "title": "Nouvelle Fonctionnalité",
    "description": "Ceci est une description de nouvelle fonctionnalité"
  }
}

// de/translation.json
{
  "newFeature": {
    "title": "Neue Funktion",
    "description": "Dies ist eine Beschreibung der neuen Funktion"
  }
}
```

2. **Use in component:**

```tsx
const { t } = useTranslation();
return <h2>{t('newFeature.title')}</h2>;
```

### Webtools Language Synchronization

The project automatically synchronizes language changes with Eurostat Webtools using the official Webtools API:

#### Automatic Language Updates
- **Globan** (Global Banner) regenerates with the selected language using `$wt.globan.regenerate()`
- **Cookie Consent Kit** regenerates with the selected language using `$wt.cck.regenerate()`
- **Document language** attribute updates (`<html lang="fr">`)
- **Page title** changes based on language

#### Webtools API Usage
```javascript
// Regenerate Globan with new language
$wt.globan.regenerate({
  lang: "fr"
});

// Regenerate CCK with new language  
$wt.cck.regenerate({
  lang: "de"
});

// Regenerate with additional options
$wt.globan.regenerate({
  lang: "fr",
  theme: "light",
  zindex: 60
});
```

#### Manual Webtools Refresh
If automatic synchronization fails, you can manually refresh Webtools:

```tsx
import { refreshWebtoolsLanguage } from '../hooks/useLanguageSync';

// Manual refresh function
const handleManualRefresh = () => {
  refreshWebtoolsLanguage();
};
```

#### SPA (Single Page Application) Support
The Webtools API includes special support for SPAs, allowing dynamic language changes without page reloads:

- **Real-time updates** - No page refresh required
- **Preserves application state** - UI remains interactive
- **Fallback support** - Page refresh option if API fails

### Configuration

Located in `src/i18n/index.ts`:

```typescript
// Language detection order
detection: {
  order: ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator'],
  lookupQuerystring: 'lng',        // ?lng=fr
  lookupCookie: 'i18next',
  lookupLocalStorage: 'i18nextLng',
  caches: ['localStorage', 'cookie'],
}
```

### URL Parameters

You can force a specific language using URL parameters:

- `http://localhost:5173/?lng=en` - English
- `http://localhost:5173/?lng=fr` - French  
- `http://localhost:5173/?lng=de` - German

### Testing Different Languages

1. **Using Language Selector**: Click the language dropdown in the app
2. **Using URL Parameter**: Add `?lng=fr` to the URL
3. **Using Browser DevTools**: 
   ```javascript
   window.i18n.changeLanguage('de');
   ```
4. **Using localStorage**:
   ```javascript
   localStorage.setItem('i18nextLng', 'fr');
   location.reload();
   ```

### Translation Keys Reference

#### Common Keys
- `common.buttons.*` - Button texts
- `common.labels.*` - Form labels
- `common.messages.*` - Common messages
- `navigation.*` - Navigation items

#### Page-specific Keys
- `welcome.*` - Welcome page content
- `features.*` - Features descriptions
- `errors.*` - Error messages

### Best Practices

1. **Use nested keys** for organization:
   ```json
   {
     "user": {
       "profile": {
         "edit": "Edit Profile",
         "save": "Save Changes"
       }
     }
   }
   ```

2. **Keep keys descriptive**:
   ```tsx
   // Good
   t('user.profile.edit.button')
   
   // Avoid
   t('btn1')
   ```

3. **Use interpolation** for dynamic content:
   ```json
   {
     "welcome": "Welcome, {{name}}!"
   }
   ```
   ```tsx
   t('welcome', { name: userName })
   ```

4. **Handle pluralization**:
   ```json
   {
     "items": {
       "one": "{{count}} item",
       "other": "{{count}} items"
     }
   }
   ```

### Debugging i18n

Enable debug mode in development:

```typescript
// src/i18n/index.ts
debug: import.meta.env.MODE === 'development'
```

Check browser console for:
- ✅ `"i18next: initialized"`
- ✅ `"Language changed to: fr"`
- ✅ `"Webtools reloaded with language: fr"`

---

This project includes comprehensive internationalization support using **react-i18next** with automatic language detection and persistence.

### Supported Languages

- 🇬🇧 **English (en)** - Default language
- 🇫🇷 **French (fr)** - Français
- 🇩🇪 **German (de)** - Deutsch

### Features

- **Automatic Language Detection** - Detects user's browser language
- **Language Persistence** - Saves selected language in localStorage
- **Dynamic Language Switching** - Switch languages without page reload
- **Webtools Synchronization** - Updates Eurostat Webtools language
- **ECL Integration** - Language selector uses ECL components
- **Type Safety** - Full TypeScript support for translations

### i18n Configuration

The i18n setup is located in `src/i18n/index.ts`:

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Default language: English
// Fallback language: English
// Debug mode: Enabled in development
```

### Translation Files Structure

```
src/i18n/locales/
├── en/translation.json    # English translations
├── fr/translation.json    # French translations
└── de/translation.json    # German translations
```

Each translation file includes organized sections:
- **common** - Loading, error, success messages
- **navigation** - Menu and navigation items
- **header** - Page title, subtitle, language selector
- **footer** - Copyright, policy links
- **messages** - Welcome messages, descriptions
- **buttons** - Action buttons text
- **forms** - Form labels and validation
- **errors** - Error messages
- **success** - Success confirmations

### Usage Examples

#### Basic Translation
```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('messages.welcome')}</h1>
      <p>{t('messages.description')}</p>
      <button>{t('buttons.getStarted')}</button>
    </div>
  );
}
```

#### Translation with Interpolation
```tsx
// In translation file
{
  "footer": {
    "copyright": "© {{year}} European Union. All rights reserved."
  }
}

// In component
<p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
```

#### Language Switching
```tsx
import { useTranslation } from 'react-i18next';

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };
  
  return (
    <button onClick={() => changeLanguage('fr')}>
      Switch to French
    </button>
  );
}
```

### Language Selector Component

The project includes a pre-built ECL-styled language selector:

```tsx
import LanguageSelector from './components/LanguageSelector';

function Header() {
  return (
    <header>
      <LanguageSelector />
    </header>
  );
}
```

### Language Synchronization

The `useLanguageSync` hook automatically:
- Updates document language attribute
- Changes page title based on language
- Synchronizes with Webtools language
- Persists language selection

```tsx
import { useLanguageSync } from './hooks/useLanguageSync';

function App() {
  useLanguageSync(); // Automatic synchronization
  
  return <div>{/* Your app */}</div>;
}
```

### Adding New Languages

1. **Install language pack** (if needed):
   ```bash
   npm install moment/locale/[language-code]
   ```

2. **Create translation file**:
   ```
   src/i18n/locales/[language-code]/translation.json
   ```

3. **Update i18n configuration**:
   ```typescript
   // Add to src/i18n/index.ts
   import newLanguageTranslations from './locales/[lang]/translation.json';
   
   const resources = {
     // existing languages...
     [languageCode]: {
       translation: newLanguageTranslations,
     },
   };
   ```

4. **Update language constants**:
   ```typescript
   // Add to src/hooks/useLanguageSync.ts
   export const SUPPORTED_LANGUAGES = [
     // existing languages...
     { code: 'xx', name: 'New Language', nativeName: 'Native Name', flag: '🏳️' },
   ];
   ```

### Translation Keys Organization

**Naming Convention:**
- Use camelCase for keys: `buttonSubmit`, `errorMessage`
- Use dot notation for nested objects: `forms.validation.required`
- Keep keys descriptive but concise

**Categories:**
- **UI Elements**: buttons, links, labels
- **Messages**: success, error, info messages
- **Content**: titles, descriptions, help text
- **Actions**: verbs for user actions
- **Status**: loading, completed, failed states

### Best Practices

1. **Always use translation keys** instead of hardcoded text
2. **Use namespaces** for large applications
3. **Keep translations consistent** across languages
4. **Test all languages** before deployment
5. **Use interpolation** for dynamic content
6. **Provide fallback text** for missing translations
7. **Consider RTL languages** for future expansion

### Debugging i18n

Enable debug mode in development:
```typescript
// src/i18n/index.ts
debug: import.meta.env.MODE === 'development'
```

Console output will show:
- Missing translation keys
- Language detection results
- Namespace loading status
- Translation resolution path

### Performance Considerations

- **Lazy Loading**: Translations load on demand
- **Code Splitting**: Only active language loads
- **Caching**: Languages cached in localStorage
- **Bundle Size**: Minimal impact with tree-shaking
- **Memory Usage**: Unused languages freed from memory


# UI Components Accessibility Guide

This document outlines the accessibility features and best practices implemented in our UI components library.

## General Accessibility Features

### Screen Reader Support
- All components include proper ARIA labels and descriptions
- Semantic HTML elements are used where appropriate
- Icons are marked with `aria-hidden="true"` to prevent redundant announcements
- Text alternatives are provided for all non-text content

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Focus management follows logical tab order
- Keyboard shortcuts follow standard conventions
- Escape key functionality where appropriate

### Visual Accessibility
- High contrast colors following ECL design system
- Scalable components that work with browser zoom
- Clear focus indicators
- No color-only information conveyance

## Component-Specific Accessibility

### NavigationBtn
**Features:**
- Full keyboard navigation support
- Customizable ARIA labels and descriptions
- Support for aria-expanded (for dropdown toggles)
- Support for aria-controls (for associated content)
- Proper button semantics

**Usage Example:**
```tsx
<NavigationBtn
  ariaLabel="Open main menu"
  ariaExpanded={isMenuOpen}
  ariaControls="main-menu"
  onClick={toggleMenu}
>
  Menu
</NavigationBtn>
```

### RoundBtn
**Features:**
- Required aria-label for icon-only buttons
- Support for toggle states with aria-pressed
- Tooltip text for additional context
- Support for aria-expanded and aria-controls
- Proper focus management

**Usage Example:**
```tsx
<RoundBtn
  icon="fa-bookmark"
  ariaLabel="Bookmark this page"
  ariaPressed={isBookmarked}
  title="Add to bookmarks"
  onClick={toggleBookmark}
/>
```

### Select
**Features:**
- Proper combobox semantics with role="combobox"
- aria-expanded state reflects dropdown state
- aria-haspopup indicates dropdown behavior
- **Focus trapping when dropdown is open**
- Keyboard navigation (Enter, Space, Arrow keys, Escape)
- Screen reader friendly option group announcements
- Proper label association
- Error and help text association
- **Automatic focus restoration when closed**

**Keyboard Controls:**
- `Enter/Space/Arrow Down/Arrow Up`: Open dropdown
- `Tab/Shift+Tab`: Navigate within dropdown (focus trapped when open)
- `Escape`: Close dropdown and restore focus to select element
- Standard select navigation within options

**Focus Management:**
- When dropdown opens, focus is trapped within the select container
- Tab/Shift+Tab cycles through focusable elements within the dropdown
- Tabbing outside the dropdown is prevented while open
- Focus automatically returns to the select element when closed

**Usage Example:**
```tsx
<Select
  id="country-select"
  name="country"
  label="Select your country"
  helpText="Choose the country where you reside"
  required
  options={countryOptions}
  onChange={handleCountryChange}
/>
```

### Chevron
**Features:**
- Decorative icon marked with aria-hidden
- Semantic direction and size properties
- Consistent with ECL design system

## Best Practices for Implementation

### 1. Always Provide Text Alternatives
```tsx
// Good
<RoundBtn icon="fa-edit" ariaLabel="Edit profile" />

// Bad
<RoundBtn icon="fa-edit" />
```

### 2. Use Semantic HTML
```tsx
// Good - uses proper button semantics
<NavigationBtn onClick={handleSubmit} type="submit">
  Submit Form
</NavigationBtn>

// Bad - div with click handler
<div onClick={handleSubmit}>Submit Form</div>
```

### 3. Manage Focus Properly
```tsx
// Good - focus management in dropdowns
const handleEscape = (event) => {
  if (event.key === 'Escape') {
    setIsOpen(false);
    buttonRef.current?.focus();
  }
};
```

### 4. Provide Context for Screen Readers
```tsx
// Good - explains the relationship
<NavigationBtn
  ariaLabel="Close navigation menu"
  ariaControls="main-nav"
  ariaExpanded={isOpen}
>
  Close
</NavigationBtn>
```

### 5. Use ARIA States Appropriately
```tsx
// Good - toggle button with state
<RoundBtn
  icon="fa-star"
  ariaLabel={isFavorite ? "Remove from favorites" : "Add to favorites"}
  ariaPressed={isFavorite}
  onClick={toggleFavorite}
/>
```

## Testing Accessibility

### Screen Reader Testing
- Test with NVDA (Windows), JAWS (Windows), VoiceOver (macOS)
- Ensure all content is announced correctly
- Verify navigation flows logically

### Keyboard Testing
- Tab through all interactive elements
- Verify all functionality is keyboard accessible
- Test with users who rely on keyboard navigation

### Automated Testing
- Use tools like axe-core, WAVE, or Lighthouse
- Integrate accessibility testing into CI/CD pipeline
- Regular accessibility audits

## WCAG Compliance

Our components aim for WCAG 2.1 AA compliance:

- **Perceivable**: Text alternatives, color contrast, scalability
- **Operable**: Keyboard accessibility, timing, seizures
- **Understandable**: Readable, predictable, input assistance
- **Robust**: Compatible with assistive technologies

## Resources

- [ECL Accessibility Guidelines](https://ec.europa.eu/component-library/accessibility/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Accessibility Guidelines](https://webaim.org/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Focus Management Patterns

### Focus Trapping
Focus trapping is implemented for components that create modal-like interactions:

**When to Use:**
- Dropdown menus that require contained navigation
- Modal dialogs and overlays
- Expanded select components
- Any component that creates a "focus context"

**Implementation:**
```tsx
import { useFocusTrap } from '../hooks/useFocusTrap';

const MyComponent = ({ isOpen }: { isOpen: boolean }) => {
  const focusTrapRef = useFocusTrap(isOpen, true);
  
  return (
    <div ref={focusTrapRef}>
      {/* Content that should trap focus when isOpen is true */}
    </div>
  );
};
```

**Key Features:**
- Prevents tab navigation outside the trapped area
- Cycles focus within focusable elements
- Handles Shift+Tab for reverse navigation
- Automatically restores focus when trap is disabled
- Works with dynamic content changes

### Custom Focus Hooks

**useFocusTrap Hook:**
```tsx
const focusTrapRef = useFocusTrap(
  isActive: boolean,        // Whether trap should be active
  restoreFocus: boolean     // Whether to restore previous focus
);
```

**useDropdownFocus Hook:**
```tsx
const { triggerRef, dropdownRef, triggerKeyDown } = useDropdownFocus(
  isOpen: boolean,          // Whether dropdown is open
  onClose: () => void       // Callback to close dropdown
);
```
