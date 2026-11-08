import { MasterHashTool } from '@/components/hash/MasterHashTool';
import { Breadcrumb } from '@/components/tools/ToolPage';
import { PageHeader,Panel } from '@/components/ui/form';
import { HASH_ALGORITHMS,HASH_CATEGORIES } from '@/lib/hash/registry';
import { hashCategoryEmpty,hashCategoryName,hashText } from '@/lib/i18n/hash-text';
import { localizePath } from '@/lib/i18n/routing';
import { pageLang } from '@/lib/i18n/server';
import { UI } from '@/lib/i18n/ui';
import { breadcrumbLd,JsonLd,pageMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ lang: string; category: string }>;
}

export async function generateStaticParams() {
  return HASH_CATEGORIES.map((cat) => ({ category: cat.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await pageLang(params);
  const { category } = await params;
  const cat = HASH_CATEGORIES.find((c) => c.slug === category);
  const t = UI[lang].hashPage;
  if (!cat) return { title: t.categoryNotFound };
  const name = hashCategoryName(cat.key, lang);
  return pageMetadata({
    lang,
    title: t.categoryTitle(name, cat.count),
    // At most five names keep the description within the ~160 characters search results show.
    description: t.categoryDescription(cat.count ? `${HASH_ALGORITHMS.filter((x) => x.category === cat.key).slice(0, 5).map((x) => x.name).join(', ')}${cat.count > 5 ? '…' : '.'}` : hashCategoryEmpty(lang), cat.count),
    path: `/hash/kategori/${cat.slug}`,
  });
}

export default async function CategoryPage({ params }: Props) {
  const lang = await pageLang(params);
  const { category } = await params;
  const cat = HASH_CATEGORIES.find((c) => c.slug === category);
  if (!cat) notFound();

  const t = UI[lang];
  const name = hashCategoryName(cat.key, lang);
  const algos = HASH_ALGORITHMS.filter((a) => a.category === cat.key);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <JsonLd data={breadcrumbLd([{ name: t.common.home, path: '/' }, { name: t.common.hash, path: '/hash' }, { name, path: `/hash/kategori/${cat.slug}` }], lang)} />
      <div className="space-y-4">
        <Breadcrumb lang={lang} items={[{ href: '/hash', label: t.common.hash }, { label: name }]} />
        <PageHeader title={name} description={cat.count ? cat.shortDesc : hashCategoryEmpty(lang)} />
      </div>

      <Panel className="p-5 sm:p-6">
        <MasterHashTool initialCategory={cat.key} initialAlgorithm={algos[0]?.slug} />
      </Panel>

      <section aria-labelledby="algorithms" className="space-y-3">
        <h2 id="algorithms" className="text-lg font-semibold tracking-[-0.01em] text-slate-950 dark:text-white">{t.hashPage.categoryAlgorithms}</h2>
        <ul className="divide-y divide-slate-200 dark:divide-zinc-800 overflow-hidden rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:shadow-none">
          {algos.map((a) => (
            <li key={a.slug}>
              <Link href={localizePath(`/hash/${a.slug}`, lang)} className="flex flex-col gap-0.5 px-4 py-3 hover:bg-slate-50 dark:hover:bg-zinc-800/60 sm:flex-row sm:items-baseline sm:gap-4">
                <span className="shrink-0 text-sm font-medium text-slate-900 dark:text-zinc-100 sm:w-44">{a.name}</span>
                <span className="min-w-0 text-[13px] text-slate-600 dark:text-zinc-400">
                  {a.category === 'parola-kdf' ? 'Encoded hash' : `${a.bits} bit`} · {hashText(a, lang).securityLabel}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
