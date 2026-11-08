import { Generator } from '@/components/generator/Generator';
import { ToolArticle } from '@/components/tools/ToolArticle';
import { PageHeader } from '@/components/ui/form';
import { HOME_CONTENT } from '@/content/home';
import { pageLang,type LangParams } from '@/lib/i18n/server';
import { UI } from '@/lib/i18n/ui';
import { JsonLd,localeUrl,pageMetadata,SITE_NAME,webApplicationLd } from '@/lib/seo';
import { Metadata } from 'next';

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const lang = await pageLang(params);
  const page = UI[lang].pages.home;
  return pageMetadata({ lang, title: page.title, description: page.description, path: '/' });
}

export default async function Home({ params }: LangParams) {
  const lang = await pageLang(params);
  const t = UI[lang];
  return (
    <div className="space-y-12">
      <JsonLd
        data={[
          { '@type': 'WebSite', name: SITE_NAME, url: localeUrl('/', lang), inLanguage: lang },
          webApplicationLd({ lang, name: t.pages.home.appName, description: t.pages.home.appDescription, path: '/' }),
        ]}
      />
      <Generator heading={<PageHeader title={t.generator.title} />} />
      <div className="mx-auto max-w-4xl">
        <ToolArticle content={HOME_CONTENT[lang]} lang={lang} />
      </div>
    </div>
  );
}
