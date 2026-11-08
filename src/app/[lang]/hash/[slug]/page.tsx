import { MasterHashTool } from '@/components/hash/MasterHashTool';
import { ToolArticle,plainText } from '@/components/tools/ToolArticle';
import { Breadcrumb } from '@/components/tools/ToolPage';
import { Notice,PageHeader,Panel } from '@/components/ui/form';
import { getToolContent } from '@/content/tools';
import { HASH_ALGORITHMS,HASH_CATEGORIES } from '@/lib/hash/registry';
import { toolIdForHashSlug } from '@/lib/hash-tool-routes';
import { hashText } from '@/lib/i18n/hash-text';
import { localizePath } from '@/lib/i18n/routing';
import { pageLang } from '@/lib/i18n/server';
import { UI } from '@/lib/i18n/ui';
import { breadcrumbLd,JsonLd,pageMetadata,webApplicationLd } from '@/lib/seo';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ lang: string; slug: string }>;
}

export async function generateStaticParams() {
  return HASH_ALGORITHMS.map((alg) => ({ slug: alg.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = await pageLang(params);
  const { slug } = await params;
  const alg = HASH_ALGORITHMS.find((a) => a.slug === slug);
  const t = UI[lang].hashPage;
  if (!alg) return { title: t.notFound };
  const text = hashText(alg, lang);
  return pageMetadata({
    lang,
    title: t.metaTitle(alg.name),
    description: alg.category === 'parola-kdf' ? t.kdfDescription(alg.name, alg.standard) : t.description(alg.name, alg.bits, alg.standard, text.securityLabel),
    path: `/hash/${alg.slug}`,
  });
}

export default async function AlgorithmPage({ params }: Props) {
  const lang = await pageLang(params);
  const { slug } = await params;
  const alg = HASH_ALGORITHMS.find((a) => a.slug === slug);
  if (!alg) notFound();

  const t = UI[lang];
  const text = hashText(alg, lang);
  const category = HASH_CATEGORIES.find((c) => c.key === alg.category);
  // Algorithms that also had a stand-alone /araclar tool show that tool's explanatory article here.
  const toolId = toolIdForHashSlug(alg.slug);
  const content = toolId ? getToolContent(toolId, lang) : undefined;
  const faq = content?.faq?.length
    ? [{ '@type': 'FAQPage', mainEntity: content.faq.map((item) => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: plainText(item.a) } })) }]
    : [];
  const related = HASH_ALGORITHMS.filter((a) => a.category === alg.category && a.slug !== alg.slug).slice(0, 8);
  const facts: [string, string][] = [
    [t.hashPage.output, alg.category === 'parola-kdf' ? t.hashPage.kdfOutput : t.hashPage.bitsOutput(alg.bits, alg.hexLength)],
    [t.hashPage.standard, alg.standard],
    [t.hashPage.design, text.authorYear],
    [t.hashPage.security, text.securityLabel],
    [t.hashPage.speed, text.speedRating],
  ];
  const crumbs = [{ name: t.common.home, path: '/' }, { name: t.common.hash, path: '/hash' }, ...(category ? [{ name: text.categoryName, path: `/hash/kategori/${category.slug}` }] : []), { name: alg.name, path: `/hash/${alg.slug}` }];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <JsonLd
        data={[
          breadcrumbLd(crumbs, lang),
          webApplicationLd({ lang, name: t.hashPage.title(alg.name), description: text.description, path: `/hash/${alg.slug}`, category: 'DeveloperApplication' }),
          ...faq,
        ]}
      />
      <div className="space-y-4">
        <Breadcrumb lang={lang} items={[{ href: '/hash', label: t.common.hash }, ...(category ? [{ href: `/hash/kategori/${category.slug}`, label: text.categoryName }] : []), { label: alg.name }]} />
        <PageHeader title={t.hashPage.title(alg.name)} description={text.description} />
      </div>

      {alg.security === 'kirilmis' && <Notice tone="warning">{t.hashPage.broken(alg.name)}</Notice>}
      {alg.security === 'checksum' && <Notice>{t.hashPage.checksum(alg.name)}</Notice>}

      <Panel className="p-5 sm:p-6">
        <MasterHashTool initialAlgorithm={alg.slug} initialCategory={alg.category} />
      </Panel>

      <section aria-labelledby="specs" className="space-y-3">
        <h2 id="specs" className="text-lg font-semibold tracking-[-0.01em] text-slate-950 dark:text-white">{t.hashPage.specs}</h2>
        <dl className="divide-y divide-slate-200 dark:divide-zinc-800 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:shadow-none text-sm">
          {facts.map(([label, value]) => (
            <div key={label} className="grid grid-cols-1 gap-0.5 px-4 py-2.5 sm:grid-cols-[12rem_1fr] sm:gap-4">
              <dt className="text-slate-600 dark:text-zinc-400">{label}</dt>
              <dd className="text-slate-900 dark:text-zinc-100">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {content && <ToolArticle content={content} lang={lang} />}

      {related.length > 0 && (
        <section aria-labelledby="same-category" className="space-y-3">
          <h2 id="same-category" className="text-lg font-semibold tracking-[-0.01em] text-slate-950 dark:text-white">{t.hashPage.sameCategory}</h2>
          <ul className="flex flex-wrap gap-1.5">
            {related.map((rel) => (
              <li key={rel.slug}>
                <Link href={localizePath(`/hash/${rel.slug}`, lang)} className="inline-flex rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 py-1 text-[13px] text-slate-700 dark:text-zinc-300 transition-colors hover:border-blue-300 hover:text-blue-700 dark:hover:border-blue-800 dark:hover:text-blue-300">
                  {rel.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
