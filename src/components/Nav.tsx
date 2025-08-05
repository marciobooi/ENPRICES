import { useTranslation } from "react-i18next";
import LanguageSelector from "./LanguageSelector";
import Menu from "./Menu";
// ...existing code...

interface NavProps {
  selectedCountries?: string[];
  onCountriesChange?: (countries: string[]) => void;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  hideCategoryButtons?: boolean;
}

const Nav: React.FC<NavProps> = ({ 
  selectedCountries = ["EU27_2020"], 
  onCountriesChange 
}) => {
  const { t } = useTranslation();

  return (
    <div id="topPanel" className="main-panel main-layout">
      {/* Eurostat Banner Section */}
      <section className="estat-banner">
        <div className="ecl-container">
          <div id="banner-left">
            <div id="banner-title" className="banner-layout">
              <h1>{t("nav.banner.title")}</h1>
            </div>
          </div>
            <LanguageSelector />
          <div id="banner-logo">
            <a href="https://www.ec.europa.eu/eurostat" target="_self">
              <img
                src="/img/estat-logo-horizontal.svg"
                alt={t("nav.logo.alt", "Home - Eurostat")}
              />
            </a>
          </div>
        </div>
      </section>

      {/* Navigation Themes Section */}
      <div id="menu">
        {/* ECL Menu Navigation with Countries Selection */}
        <Menu 
          selectedCountries={selectedCountries}
          onCountriesChange={onCountriesChange}
        />
      </div>
    </div>
  );
};

export default Nav;
