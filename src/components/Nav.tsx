import { useTranslation } from "react-i18next";
import LanguageSelector from "./LanguageSelector";
import Menu from "./Menu";
// ...existing code...

interface NavProps {
  selectedCountries?: string[];
  onCountriesChange?: (countries: string[]) => void;
  selectedProduct?: string;
  onProductChange?: (product: string) => void;
  selectedConsumer?: string;
  onConsumerChange?: (consumer: string) => void;
  selectedYear?: string;
  onYearChange?: (year: string) => void;
  selectedBand?: string;
  onBandChange?: (band: string) => void;
  selectedUnit?: string;
  onUnitChange?: (unit: string) => void;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  hideCategoryButtons?: boolean;
}

const Nav: React.FC<NavProps> = ({ 
  selectedCountries = ["EU27_2020"], 
  onCountriesChange,
  selectedProduct = "6000",
  onProductChange,
  selectedConsumer = "HOUSEHOLD",
  onConsumerChange,
  selectedYear = new Date().getFullYear().toString(),
  onYearChange,
  selectedBand = "TOT_KWH",
  onBandChange,
  selectedUnit = "KWH",
  onUnitChange
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
          selectedProduct={selectedProduct}
          onProductChange={onProductChange}
          selectedConsumer={selectedConsumer}
          onConsumerChange={onConsumerChange}
          selectedYear={selectedYear}
          onYearChange={onYearChange}
          selectedBand={selectedBand}
          onBandChange={onBandChange}
          selectedUnit={selectedUnit}
          onUnitChange={onUnitChange}
        />
      </div>
    </div>
  );
};

export default Nav;
