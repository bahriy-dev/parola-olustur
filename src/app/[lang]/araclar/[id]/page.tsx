import { Generator } from '@/components/generator/Generator';
import { ToolArticle,plainText } from '@/components/tools/ToolArticle';
import { RelatedTools,ToolPage } from '@/components/tools/ToolPage';
import { PageHeader } from '@/components/ui/form';
import { getToolContent,isToolTranslated } from '@/content/tools';
import { toolText } from '@/lib/i18n/catalog';
import { pageLang } from '@/lib/i18n/server';
import { UI } from '@/lib/i18n/ui';
import { breadcrumbLd,JsonLd,pageMetadata,webApplicationLd } from '@/lib/seo';
import { ALL_TOOLS,TOOL_CANONICAL_PATHS } from '@/lib/tools-registry';
import type { GenerationMode } from '@/types/password';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface ToolPageProps {
  params: Promise<{ lang: string; id: string }>;
}

const GENERATOR_MODES: Record<string, GenerationMode> = {
  'password-generator': 'random',
  'strong-password-generator': 'random',
  'passphrase-generator': 'passphrase',
  'pin-generator': 'pin',
};

export async function generateStaticParams() {
  return ALL_TOOLS.map((tool) => ({ id: tool.id }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const lang = await pageLang(params);
  const { id } = await params;
  const tool = ALL_TOOLS.find((t) => t.id === id);
  if (!tool) return { title: UI[lang].toolPage.notFound };
  const text = toolText(tool, lang);
  // An English tool page is indexable once its article is translated; until then it is noindex and unlinked by hreflang.
  const translated = isToolTranslated(tool.id);
  return pageMetadata({
    lang,
    title: text.name.length <= 25 ? `${text.name} – ${UI[lang].toolPage.onlineTool}` : text.name,
    description: text.description,
    path: `/araclar/${tool.id}`,
    canonical: TOOL_CANONICAL_PATHS[tool.id],
    noindex: tool.status === 'unavailable' || (lang === 'en' && !translated),
    hreflang: translated,
    keywords: [...tool.tags, text.name],
  });
}

export default async function DedicatedToolPage({ params }: ToolPageProps) {
  const lang = await pageLang(params);
  const { id } = await params;
  const tool = ALL_TOOLS.find((t) => t.id === id);
  if (!tool) notFound();

  const t = UI[lang];
  const text = toolText(tool, lang);
  const path = `/araclar/${tool.id}`;
  const content = getToolContent(tool.id, lang);
  const faq = content?.faq?.length
    ? [{ '@type': 'FAQPage', mainEntity: content.faq.map((item) => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: plainText(item.a) } })) }]
    : [];
  const jsonLd = tool.status === 'available' ? (
    <JsonLd
      data={[
        breadcrumbLd([{ name: t.common.home, path: '/' }, { name: t.common.tools, path: '/araclar' }, { name: text.name, path }], lang),
        webApplicationLd({ lang, name: text.name, description: text.description, path, category: tool.category === 'password' ? 'SecurityApplication' : 'DeveloperApplication' }),
        ...faq,
      ]}
    />
  ) : null;

  const generatorMode = GENERATOR_MODES[tool.id];
  return (
    <>
      {jsonLd}
      {generatorMode ? (
        <div className="space-y-8">
          <Generator key={id} initialMode={generatorMode} heading={<PageHeader title={text.name} description={text.description} />} />
          <div className="mx-auto max-w-4xl space-y-8">
            {content && <ToolArticle content={content} lang={lang} />}
            <RelatedTools tool={tool} lang={lang} />
          </div>
        </div>
      ) : (
        <ToolPage tool={tool} lang={lang} />
      )}
    </>
  );
}
