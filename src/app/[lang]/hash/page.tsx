import { MasterHashTool } from '@/components/hash/MasterHashTool';
import { PageHeader,Panel } from '@/components/ui/form';
import { HASH_ALGORITHMS,HASH_CATEGORIES } from '@/lib/hash/registry';
import { hashCategoryName } from '@/lib/i18n/hash-text';
import { localizePath } from '@/lib/i18n/routing';
import { pageLang,type LangParams } from '@/lib/i18n/server';
import { UI } from '@/lib/i18n/ui';
import { breadcrumbLd,JsonLd,pageMetadata,webApplicationLd } from '@/lib/seo';
import { Metadata } from 'next';
import Link from 'next/link';

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const lang = await pageLang(params);
  const page = UI[lang].pages.hash;
  return pageMetadata({ lang, title: page.title, description: page.description, path: '/hash' });
}

export default async function HashHubPage({ params }: LangParams) {
  const lang = await pageLang(params);
  const t = UI[lang];
  const page = t.pages.hash;
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <JsonLd
        data={[
          breadcrumbLd([{ name: t.common.home, path: '/' }, { name: t.common.hash, path: '/hash' }], lang),
          webApplicationLd({ lang, name: page.heading, description: page.description, path: '/hash', category: 'DeveloperApplication' }),
        ]}
      />
      <PageHeader title={page.heading} description={page.lead} />
      <Panel className="p-5 sm:p-6">
        <MasterHashTool />
      </Panel>
      <section aria-labelledby="algorithms" className="space-y-4">
        <h2 id="algorithms" className="text-lg font-semibold tracking-[-0.01em] text-slate-950 dark:text-white">{t.hashPage.algorithms}</h2>
        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {HASH_CATEGORIES.filter((c) => c.count > 0).map((category) => (
            <div key={category.key} className="space-y-1.5">
              <h3 className="text-sm font-medium">
                <Link href={localizePath(`/hash/kategori/${category.slug}`, lang)} className="text-slate-900 dark:text-zinc-100 hover:underline underline-offset-4">{hashCategoryName(category.key, lang)}</Link>
              </h3>
              <ul className="flex flex-wrap gap-1.5">
                {HASH_ALGORITHMS.filter((a) => a.category === category.key).map((a) => (
                  <li key={a.slug}>
                    <Link href={localizePath(`/hash/${a.slug}`, lang)} className="inline-flex rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 py-1 text-[13px] text-slate-700 dark:text-zinc-300 transition-colors hover:border-blue-300 hover:text-blue-700 dark:hover:border-blue-800 dark:hover:text-blue-300">
                      {a.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
