import { FaqContent } from '@/components/content/InfoContent';
import { en } from '@/lib/i18n/en';
import { pageLang,type LangParams } from '@/lib/i18n/server';
import { tr } from '@/lib/i18n/tr';
import { UI } from '@/lib/i18n/ui';
import { breadcrumbLd,JsonLd,pageMetadata } from '@/lib/seo';
import { Metadata } from 'next';

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const lang = await pageLang(params);
  const page = UI[lang].pages.faq;
  return pageMetadata({ lang, title: page.title, description: page.description, path: '/sss' });
}

export default async function FAQPage({ params }: LangParams) {
  const lang = await pageLang(params);
  const t = UI[lang];
  const items = (lang === 'en' ? en : tr).faq.items;
  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([{ name: t.common.home, path: '/' }, { name: t.nav.faq, path: '/sss' }], lang),
          { '@type': 'FAQPage', mainEntity: items.map((item) => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })) },
        ]}
      />
      <FaqContent />
    </>
  );
}
