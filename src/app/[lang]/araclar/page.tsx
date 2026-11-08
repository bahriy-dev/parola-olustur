import { AVAILABLE_TOOL_COUNT } from '@/components/shell/nav-data';
import { ToolCatalog } from '@/components/tools/ToolCatalog';
import { PageHeader } from '@/components/ui/form';
import { pageLang,type LangParams } from '@/lib/i18n/server';
import { UI } from '@/lib/i18n/ui';
import { breadcrumbLd,JsonLd,pageMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const lang = await pageLang(params);
  const page = UI[lang].pages.tools;
  return pageMetadata({ lang, title: page.title, description: page.description, path: '/araclar' });
}

export default async function AllToolsDirectoryPage({ params }: LangParams) {
  const lang = await pageLang(params);
  const t = UI[lang];
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <JsonLd data={breadcrumbLd([{ name: t.common.home, path: '/' }, { name: t.common.tools, path: '/araclar' }], lang)} />
      <PageHeader title={t.pages.tools.heading} description={t.pages.tools.lead(AVAILABLE_TOOL_COUNT)} />
      <ToolCatalog />
    </div>
  );
}
