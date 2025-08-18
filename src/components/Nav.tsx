import { useTranslation } from "react-i18next";
import LanguageSelector from "./LanguageSelector";
import Menu from "./Menu";
import DynamicTitle from "./DynamicTitle";
import InfoDropdown from "./InfoDropdown";
import ShareDropdown from "./ShareDropdown";
import { Tooltip } from 'react-tooltip';
import { RoundBtn } from './ui/index';
import DownloadDropdown from './DownloadDropdown';
import { useState } from 'react';
import { FocusTrap } from 'focus-trap-react';

interface NavProps {
  // No props needed since Menu uses QueryContext
}

const Nav: React.FC<NavProps> = () => {
  const { t } = useTranslation();
  const [isEmbedDialogOpen, setIsEmbedDialogOpen] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');

  const handleEmbed = () => {
    setIsEmbedDialogOpen(true);
  };

  const handleCloseEmbedDialog = () => {
    setIsEmbedDialogOpen(false);
    setCopyMessage('');
  };

  const handleCopyEmbedCode = () => {
    const embedUrl = window.location.href;
    const embedCode = `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0"></iframe>`;
    
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopyMessage(t('ui.embed.copied', 'Copied!'));
      setTimeout(() => setCopyMessage(''), 2000);
    }).catch(() => {
      setCopyMessage(t('ui.embed.copy_error', 'Copy failed'));
      setTimeout(() => setCopyMessage(''), 2000);
    });
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
            <DownloadDropdown className="title-download-button" />
            <RoundBtn
              id="embed-button"
              className="ecl-button ecl-button--rounded ecl-button--secondary info-dropdown-button"
              onClick={handleEmbed}
              ariaLabel={t('ui.embed.button', 'Embed chart')}
              ariaControls="embed-modal"
              aria-haspopup="dialog"
              variant="ghost"
              size="medium"
              icon="fa-code"
              iconOnly={true}
              data-tooltip-id="embed-tooltip"
              data-tooltip-content={t('tooltips.embed', 'Embed this chart')}
              data-tooltip-place="bottom"
            />
            <Tooltip
              id="embed-tooltip"
              place="bottom"
              delayShow={200}
              delayHide={100}
              noArrow={true}
            />
            <ShareDropdown className="title-share-button" />
          </div>
        </div>
      </div>

      {/* ECL Modal for Embed */}
      {isEmbedDialogOpen && (
        <FocusTrap
          active={isEmbedDialogOpen}
          focusTrapOptions={{
            initialFocus: '#embed-modal-close',
            allowOutsideClick: true,
            clickOutsideDeactivates: true,
            returnFocusOnDeactivate: true,
            escapeDeactivates: true,
            onDeactivate: () => {
              setIsEmbedDialogOpen(false);
              setCopyMessage('');
            }
          }}
        >
          <div>
            <dialog
              id="embed-modal"
              aria-modal="true"
              className="ecl-modal ecl-modal--l"
              aria-labelledby="embed-modal-header"
              aria-describedby="embed-modal-description"
              open
            >
              <div className="ecl-modal__container">
                <div className="ecl-modal__content ecl-container">
                  <header className="ecl-modal__header">
                    <div className="ecl-modal__header-content" id="embed-modal-header">
                      {t('ui.embed.title', 'Embed Chart')}
                    </div>
          <button
                      id="embed-modal-close"
                      className="ecl-button ecl-button--tertiary ecl-modal__close ecl-button--icon-only"
                      type="button"
                      onClick={handleCloseEmbedDialog}
                      aria-label={t('ui.embed.close', 'Close dialog')}
                    >
                      <span className="ecl-button__container">
                        <span className="ecl-button__label">{t('ui.embed.close', 'Close')}</span>
            <i className="fa fa-times" aria-hidden="true"></i>
                      </span>
                    </button>
                  </header>
                  <div className="ecl-modal__body">
                    <div className="ecl-modal__body-scroll">
                      <p id="embed-modal-description" className="ecl-u-type-paragraph-m">
                        {t('ui.embed.description', 'Copy the code below to embed this chart on your website:')}
                      </p>
                      <div className="ecl-form-group">
                        <label className="ecl-form-label" htmlFor="embed-code-textarea">
                          {t('ui.embed.code_label', 'Embed Code')}
                        </label>
                        <textarea
                          id="embed-code-textarea"
                          className="ecl-text-area ecl-text-area--m"
                          readOnly
                          rows={4}
                          value={`<iframe src="${window.location.href}" width="100%" height="600" frameborder="0"></iframe>`}
                          onClick={handleCopyEmbedCode}
                          aria-describedby="embed-code-help"
                        />
                        <div id="embed-code-help" className="ecl-help-block">
                          {t('ui.embed.code_help', 'Click the textarea or copy button to copy the embed code to your clipboard')}
                        </div>
                      </div>
                      {copyMessage && (
                        <div className="ecl-message ecl-message--success" role="status" aria-live="polite">
                          <i className="fa fa-check ecl-message__icon" aria-hidden="true"></i>
                          <div className="ecl-message__content">
                            <div className="ecl-message__title">{copyMessage}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <footer className="ecl-modal__footer">
                    <div className="ecl-modal__footer-content">
                      <button
                        className="ecl-button ecl-button--secondary ecl-modal__button"
                        type="button"
                        onClick={handleCloseEmbedDialog}
                      >
                        {t('ui.embed.close', 'Close')}
                      </button>
            <button
                        className="ecl-button ecl-button--primary ecl-modal__button"
                        type="button"
                        onClick={handleCopyEmbedCode}
                        aria-describedby="embed-copy-help"
                      >
                        <span className="ecl-button__container">
                          <span className="ecl-button__label">{t('ui.embed.copy', 'Copy Code')}</span>
              <i className="fa fa-copy ecl-button__icon" aria-hidden="true"></i>
                        </span>
                      </button>
                      <div id="embed-copy-help" className="sr-only">
                        {t('ui.embed.copy_help', 'Copies the embed code to your clipboard')}
                      </div>
                    </div>
                  </footer>
                </div>
              </div>
            </dialog>
          </div>
        </FocusTrap>
      )}
    </div>
  );
};

export default Nav;
