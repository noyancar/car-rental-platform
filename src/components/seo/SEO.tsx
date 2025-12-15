import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string | null;
  ogType?: 'website' | 'article' | 'product';
  ogImageWidth?: number;
  ogImageHeight?: number;
  twitterCard?: 'summary' | 'summary_large_image';
  twitterSite?: string;
  twitterCreator?: string;
  noindex?: boolean;
  keywords?: string[];
  // Article specific
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
}

export function SEO({
  title,
  description,
  canonical,
  ogImage,
  ogType = 'website',
  ogImageWidth = 1200,
  ogImageHeight = 630,
  twitterCard = 'summary_large_image',
  twitterSite = '@nynrentals',
  twitterCreator = '@nynrentals',
  noindex = false,
  keywords = [],
  publishedTime,
  modifiedTime,
  section,
  tags = []
}: SEOProps) {
  const siteName = 'NYN Rentals';
  const fullTitle = `${title} | ${siteName}`;
  const siteUrl = 'https://nynrentals.com'; // Update with your actual domain
  const currentUrl = canonical || siteUrl;

  // Ensure ogImage is absolute URL, fallback to default if not provided
  const defaultOgImage = `${siteUrl}/og-default.jpg`;
  const imageUrl = ogImage || defaultOgImage;
  const absoluteOgImage = imageUrl.startsWith('http')
    ? imageUrl
    : `${siteUrl}${imageUrl}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <link rel="canonical" href={currentUrl} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}

      {/* Open Graph / Facebook */}
      <meta property="fb:app_id" content="1298453702080361" />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={absoluteOgImage} />
      <meta property="og:image:width" content={String(ogImageWidth)} />
      <meta property="og:image:height" content={String(ogImageHeight)} />
      <meta property="og:image:alt" content={title} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteOgImage} />
      <meta name="twitter:image:alt" content={title} />
      {twitterSite && <meta name="twitter:site" content={twitterSite} />}
      {twitterCreator && <meta name="twitter:creator" content={twitterCreator} />}

      {/* Article specific meta tags */}
      {ogType === 'article' && (
        <>
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {section && <meta property="article:section" content={section} />}
          {tags.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}
    </Helmet>
  );
}
