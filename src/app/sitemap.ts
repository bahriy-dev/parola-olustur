import { isToolTranslated } from '@/content/tools';
import { HASH_ALGORITHMS,HASH_CATEGORIES } from '@/lib/hash/registry';
import { HASH_TOOL_SLUGS } from '@/lib/hash-tool-routes';
import { localizePath } from '@/lib/i18n/routing';
import { SITE_URL } from '@/lib/site';
import { ALL_TOOLS,TOOL_CANONICAL_PATHS } from '@/lib/tools-registry';
import { MetadataRoute } from 'next';

const url = (path: string) => (path === '/' ? SITE_URL : `${SITE_URL}${path}`);

/**
 * Every indexable page in both languages, each entry listing its counterpart (hreflang). Paths are internal
 * (Turkish segments) and localized here. Tool pages whose article is not translated yet are Turkish-only.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: { path: string; priority: number; changeFrequency: 'weekly' | 'monthly' | 'yearly'; english?: boolean }[] = [
    { path: '/', priority: 1, changeFrequency: 'weekly' },
    { path: '/araclar', priority: 0.95, changeFrequency: 'weekly' },
    { path: '/hash', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/coklu-hash', priority: 0.85, changeFrequency: 'monthly' },
    { path: '/hash-tanimlayici', priority: 0.85, changeFrequency: 'monthly' },
    { path: '/hash-dogrulama', priority: 0.85, changeFrequency: 'monthly' },
    { path: '/toplu-parola', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/guvenlik-rehberi', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/sss', priority: 0.65, changeFrequency: 'monthly' },
    { path: '/gizlilik', priority: 0.5, changeFrequency: 'yearly' },
  ];
  // Tool routes that are their own canonical page (hash duplicates redirect to /hash/<slug>).
  for (const tool of ALL_TOOLS.filter((t) => t.status === 'available' && !TOOL_CANONICAL_PATHS[t.id] && !HASH_TOOL_SLUGS[t.id])) {
    pages.push({ path: `/araclar/${tool.id}`, priority: tool.isPopular ? 0.9 : 0.8, changeFrequency: 'monthly', english: isToolTranslated(tool.id) });
  }
  for (const cat of HASH_CATEGORIES.filter((c) => c.count > 0)) pages.push({ path: `/hash/kategori/${cat.slug}`, priority: 0.75, changeFrequency: 'monthly' });
  for (const alg of HASH_ALGORITHMS) pages.push({ path: `/hash/${alg.slug}`, priority: 0.7, changeFrequency: 'monthly' });

  return pages.flatMap(({ path, priority, changeFrequency, english = true }) => {
    const tr = url(localizePath(path, 'tr'));
    if (!english) return [{ url: tr, priority, changeFrequency }];
    const en = url(localizePath(path, 'en'));
    const alternates = { languages: { tr, en, 'x-default': tr } };
    return [
      { url: tr, priority, changeFrequency, alternates },
      { url: en, priority: Math.round(priority * 90) / 100, changeFrequency, alternates },
    ];
  });
}
