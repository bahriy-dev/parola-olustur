import type { Metadata } from 'next';
import { headers } from 'next/headers';

import { localizePath,type Locale } from './i18n/routing';
import { UI } from './i18n/ui';
import { SITE_NAME,SITE_URL } from './site';

export { SITE_NAME,SITE_URL };

export const absoluteUrl = (path: string) => (path === '/' ? SITE_URL : `${SITE_URL}${path}`);

/** Absolute public URL of an internal (Turkish-segment) path in a locale. */
export const localeUrl = (path: string, lang: Locale) => absoluteUrl(localizePath(path, lang));

/**
 * Per-page metadata. Open Graph and Twitter fields must be set on every page: Next.js inherits
 * the parent's openGraph object wholesale, which otherwise gives every route the home page's
 * og:title and og:url. `path` is the internal (Turkish-segment) path; both language versions are
 * linked with hreflang. `canonical` points a page that duplicates another page's search intent
 * at that page instead of itself. `hreflang: false` leaves out the language links while a page
 * exists in only one language for real (e.g. an article not translated yet).
 */
export function pageMetadata({ lang, title: pageTitle, description, path, canonical, noindex, keywords, hreflang = true }: { lang: Locale; title: string; description: string; path: string; canonical?: string; noindex?: boolean; keywords?: string[]; hreflang?: boolean }): Metadata {
  const url = localeUrl(canonical ?? path, lang);
  // The brand is appended once; a title that already names it (the home page) is used as is.
  const title = pageTitle.includes(SITE_NAME) ? pageTitle : `${pageTitle} | ${SITE_NAME}`;
  const image = { url: localizePath('/share-image', lang), width: 1200, height: 630, alt: `${SITE_NAME} – ${UI[lang].seo.shareAlt}` };
  const target = canonical ?? path;
  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
      languages: hreflang ? { tr: localeUrl(target, 'tr'), en: localeUrl(target, 'en'), 'x-default': localeUrl(target, 'tr') } : undefined,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: UI[lang].seo.ogLocale,
      alternateLocale: UI[lang === 'tr' ? 'en' : 'tr'].seo.ogLocale,
      type: 'website',
      images: [image],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image.url] },
    robots: noindex ? { index: false, follow: true } : undefined,
  };
}

export function breadcrumbLd(items: { name: string; path: string }[], lang: Locale) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: localeUrl(item.path, lang) })),
  };
}

export function webApplicationLd({ lang, name, description, path, category = 'SecurityApplication' }: { lang: Locale; name: string; description: string; path: string; category?: string }) {
  return {
    '@type': 'WebApplication',
    name,
    description,
    url: localeUrl(path, lang),
    inLanguage: lang,
    applicationCategory: category,
    operatingSystem: 'Any',
    browserRequirements: UI[lang].seo.browserRequirements,
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: lang === 'tr' ? 'TRY' : 'USD' },
  };
}

/** Emits JSON-LD with the request's CSP nonce; "<" is escaped so data can never close the script tag. */
export async function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  const graph = Array.isArray(data) ? { '@context': 'https://schema.org', '@graph': data } : { '@context': 'https://schema.org', ...data };
  return <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, '\\u003c') }} />;
}
