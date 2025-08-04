import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

interface MetaProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
}

const Meta: React.FC<MetaProps> = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  siteName
}) => {
  const { t, i18n } = useTranslation();
  
  const defaultTitle = t('meta.title', 'Eurostat - Your gateway to European statistics');
  const defaultDescription = t('meta.description', 'Eurostat is the statistical office of the European Union situated in Luxembourg.');
  const defaultKeywords = t('meta.keywords', 'eurostat, statistics, european union, data, economy, demographics');
  const defaultSiteName = t('meta.siteName', 'Eurostat');
  
  const finalTitle = title ? `${title} | ${defaultSiteName}` : defaultTitle;
  const finalDescription = description || defaultDescription;
  const finalKeywords = keywords || defaultKeywords;
  const finalSiteName = siteName || defaultSiteName;

  return (
    <Helmet>
      <html lang={i18n.language} />
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      <meta name="theme-color" content="#004494" />
      <meta name="msapplication-TileColor" content="#004494" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="format-detection" content="telephone=no" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:site_name" content={finalSiteName} />
      {image && <meta property="og:image" content={image} />}
      {url && <meta property="og:url" content={url} />}
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      {image && <meta name="twitter:image" content={image} />}
      
      {/* EU/Eurostat specific */}
      <meta name="author" content="Eurostat" />
      <meta name="robots" content="index, follow" />
      <meta name="revisit-after" content="1 days" />
      <link rel="canonical" href={url || window.location.href} />
    </Helmet>
  );
};

export default Meta;
