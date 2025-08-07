import { useTranslation } from "react-i18next";
import LanguageSelector from "./LanguageSelector";
import Menu from "./Menu";
import DynamicTitle from "./DynamicTitle";
// ...existing code...

interface NavProps {
  // No props needed since Menu uses QueryContext
}

const Nav: React.FC<NavProps> = () => {
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
        <Menu />
        {/* Dynamic Title Section */}
        <DynamicTitle />
      </div>


    </div>
  );
};

export default Nav;
