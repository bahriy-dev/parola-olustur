/**
 * Locale routing. Turkish is served without a prefix (/araclar/x); English lives under /en with English
 * path segments (/en/tools/x). Internally every page sits under app/[lang]/ with the Turkish segment names,
 * and the proxy rewrites public URLs to those internal paths. No imports: the proxy and config read this file.
 */
export const LOCALES = ['tr', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'tr';

export const isLocale = (value: string): value is Locale => (LOCALES as readonly string[]).includes(value);

/** Internal (Turkish) path segment → English public segment. Segments not listed are the same in both. */
const EN_SEGMENTS: Record<string, string> = {
  araclar: 'tools',
  kategori: 'category',
  'coklu-hash': 'multi-hash',
  'hash-dogrulama': 'verify-hash',
  'hash-tanimlayici': 'identify-hash',
  'toplu-parola': 'bulk-passwords',
  'guvenlik-rehberi': 'security-guide',
  sss: 'faq',
  gizlilik: 'privacy',
};
const TR_SEGMENTS = Object.fromEntries(Object.entries(EN_SEGMENTS).map(([tr, en]) => [en, tr]));

const mapSegments = (path: string, table: Record<string, string>) =>
  path
    .split('/')
    .map((segment) => table[segment] ?? segment)
    .join('/');

/** Public URL path for an internal (Turkish-segment, unprefixed) path, e.g. ('/araclar/x', 'en') → '/en/tools/x'. */
export function localizePath(path: string, lang: Locale): string {
  if (lang === 'tr') return path;
  return path === '/' ? '/en' : `/en${mapSegments(path, EN_SEGMENTS)}`;
}

/** Splits a public URL path into its locale and the internal (Turkish-segment) path. */
export function parsePublicPath(pathname: string): { lang: Locale; path: string } {
  if (pathname === '/en' || pathname.startsWith('/en/')) {
    const rest = pathname.slice(3) || '/';
    return { lang: 'en', path: mapSegments(rest, TR_SEGMENTS) };
  }
  return { lang: 'tr', path: pathname };
}
