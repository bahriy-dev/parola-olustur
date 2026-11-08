import { HASH_TOOL_SLUGS } from '@/lib/hash-tool-routes';
import { categoryText,toolText } from '@/lib/i18n/catalog';
import type { Locale } from '@/lib/i18n/routing';
import type { UiDictionary } from '@/lib/i18n/ui';
import { ALL_TOOLS,TOOL_CATEGORIES,type SecurityTool } from '@/lib/tools-registry';

/** `href` is the internal (Turkish-segment) path; components turn it into the locale's public URL. */
export interface NavLink { href: string; label: string }

export const primaryLinks = (t: UiDictionary): NavLink[] => [
  { href: '/', label: t.nav.generator },
  { href: '/toplu-parola', label: t.nav.bulk },
  { href: '/araclar', label: t.nav.allTools },
];

export const hashLinks = (t: UiDictionary): NavLink[] => [
  { href: '/hash', label: t.nav.hash },
  { href: '/coklu-hash', label: t.nav.multiHash },
  { href: '/hash-dogrulama', label: t.nav.verifyHash },
  { href: '/hash-tanimlayici', label: t.nav.identifyHash },
];

export const infoLinks = (t: UiDictionary): NavLink[] => [
  { href: '/guvenlik-rehberi', label: t.nav.guide },
  { href: '/sss', label: t.nav.faq },
  { href: '/gizlilik', label: t.nav.privacy },
];

// Disabled tools keep their (noindex) routes but are not offered in navigation, the catalog or search.
const AVAILABLE_TOOLS = ALL_TOOLS.filter((tool) => tool.status === 'available');

export const navCategories = (lang: Locale) =>
  TOOL_CATEGORIES.map((category) => ({
    key: category.key,
    label: categoryText(category.key, lang).name,
    tools: AVAILABLE_TOOLS.filter((tool) => tool.category === category.key),
  }));

export const AVAILABLE_TOOL_COUNT = AVAILABLE_TOOLS.length;

/** Internal path of a tool; single-algorithm hash tools live on their /hash/<slug> page. */
export const toolHref = (tool: Pick<SecurityTool, 'id'>) => (HASH_TOOL_SLUGS[tool.id] ? `/hash/${HASH_TOOL_SLUGS[tool.id]}` : `/araclar/${tool.id}`);

/**
 * Folds case, Turkish letters and punctuation so "SHA-256", "sha256" and "Sha 256", or "şifre" and "sifre",
 * compare equal. Only used for matching; display text is untouched.
 */
export const normalizeSearch = (text: string) =>
  text
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşü]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' })[c] ?? c)
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '');

// Everyday words people type for the same thing, in either language.
const SYNONYMS: Record<string, string> = { sifre: 'parola', password: 'parola', passwort: 'parola', hesapla: 'hash', ozet: 'hash', sifrele: 'encrypt', coz: 'decode' };

/** Ranks tools by name prefix, name match, then description/standard/tags. Both languages' names are searchable. */
export function searchTools(query: string, lang: Locale, limit = Infinity): SecurityTool[] {
  const raw = normalizeSearch(query);
  if (!raw) return [];
  const terms = [raw, SYNONYMS[raw]].filter(Boolean) as string[];
  const scored = AVAILABLE_TOOLS.map((tool) => {
    const own = toolText(tool, lang);
    const other = toolText(tool, lang === 'tr' ? 'en' : 'tr');
    const name = normalizeSearch(own.name);
    const otherName = normalizeSearch(other.name);
    const haystack = normalizeSearch([own.description, tool.standard ?? '', ...tool.tags].join(' '));
    const score = Math.min(
      ...terms.map((q) => (name.startsWith(q) ? 0 : name.includes(q) ? 1 : otherName.includes(q) ? 2 : haystack.includes(q) ? 3 : 9)),
    );
    return { tool, score };
  }).filter((entry) => entry.score < 9);
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, limit).map((entry) => entry.tool);
}
