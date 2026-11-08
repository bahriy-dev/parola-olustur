import { pageLang,type LangParams } from '@/lib/i18n/server';
import { UI } from '@/lib/i18n/ui';
import { breadcrumbLd,JsonLd,pageMetadata,webApplicationLd } from '@/lib/seo';
import type { Metadata } from 'next';

// The page itself is a client component, so its metadata and JSON-LD live in this layout.
export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const lang = await pageLang(params);
  const page = UI[lang].pages.bulk;
  return pageMetadata({ lang, title: page.title, description: page.description, path: '/toplu-parola' });
}

export default async function BulkPasswordLayout({ children, params }: LangParams & { children: React.ReactNode }) {
  const lang = await pageLang(params);
  const t = UI[lang];
  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([{ name: t.common.home, path: '/' }, { name: t.nav.bulk, path: '/toplu-parola' }], lang),
          webApplicationLd({ lang, name: t.pages.bulk.appName, description: t.pages.bulk.description, path: '/toplu-parola' }),
        ]}
      />
      {children}
    </>
  );
}
