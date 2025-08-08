import { useTranslation } from "react-i18next";
import LanguageSelector from "./LanguageSelector";
import Menu from "./Menu";
import DynamicTitle from "./DynamicTitle";
import InfoDropdown from "./InfoDropdown";
import { Tooltip } from 'react-tooltip';
import { RoundBtn } from './ui/index';

interface NavProps {
  // No props needed since Menu uses QueryContext
}

const Nav: React.FC<NavProps> = () => {
  const { t } = useTranslation();

  const handleDownload = () => {
    // TODO: Implement download functionality
    console.log('Download button clicked');
  };

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
        <div className="menu-layout">
          <div className="menu-item menu-button">
            <Menu />
          </div>
          <div className="menu-item menu-title">
            <DynamicTitle />
          </div>
          <div className="menu-item menu-info">
            <InfoDropdown className="title-info-button" />
            <RoundBtn
              id="download-button"
              className="ecl-button ecl-button--rounded ecl-button--secondary info-dropdown-button"
              onClick={handleDownload}
              ariaLabel={t('ui.download.button', 'Download data')}
              variant="ghost"
              size="medium"
              icon="fa-download"
              iconOnly={true}
              data-tooltip-id="download-tooltip"
              data-tooltip-content={t('tooltips.download', 'Download data')}
              data-tooltip-place="bottom"
            />
            <Tooltip
              id="download-tooltip"
              place="bottom"
              delayShow={200}
              delayHide={100}
              noArrow={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Nav;
