import { MasterHashTool } from '@/components/hash/MasterHashTool';
import { PageHeader,Panel } from '@/components/ui/form';
import { pageLang,type LangParams } from '@/lib/i18n/server';
import { UI } from '@/lib/i18n/ui';
import { breadcrumbLd,JsonLd,pageMetadata,webApplicationLd } from '@/lib/seo';
import { Metadata } from 'next';

const PATH = '/hash-tanimlayici';

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const lang = await pageLang(params);
  const page = UI[lang].pages.identifyHash;
  return pageMetadata({ lang, title: page.title, description: page.description, path: PATH });
}

export default async function HashIdentifierPage({ params }: LangParams) {
  const lang = await pageLang(params);
  const t = UI[lang];
  const page = t.pages.identifyHash;
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <JsonLd
        data={[
          breadcrumbLd([{ name: t.common.home, path: '/' }, { name: t.common.hash, path: '/hash' }, { name: page.heading, path: PATH }], lang),
          webApplicationLd({ lang, name: page.heading, description: page.description, path: PATH, category: 'DeveloperApplication' }),
        ]}
      />
      <PageHeader title={page.heading} description={page.lead} />
      <Panel className="p-5 sm:p-6">
        <MasterHashTool initialTab="identify" />
      </Panel>
    </div>
  );
}
