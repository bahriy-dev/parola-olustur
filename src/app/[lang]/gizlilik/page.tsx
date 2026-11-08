import { PrivacyContent } from '@/components/content/InfoContent';
import { pageLang,type LangParams } from '@/lib/i18n/server';
import { UI } from '@/lib/i18n/ui';
import { breadcrumbLd,JsonLd,pageMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const lang = await pageLang(params);
  const page = UI[lang].pages.privacy;
  return pageMetadata({ lang, title: page.title, description: page.description, path: '/gizlilik' });
}

export default async function PrivacyPage({ params }: LangParams) {
  const lang = await pageLang(params);
  const t = UI[lang];
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: t.common.home, path: '/' }, { name: t.nav.privacy, path: '/gizlilik' }], lang)} />
      <PrivacyContent />
    </>
  );
}
