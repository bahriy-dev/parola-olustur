import { toolHref } from '@/components/shell/nav-data';
import { Badge,PageHeader,Panel } from '@/components/ui/form';
import { ArrowRight,ChevronRight } from 'lucide-react';
import { categoryText,toolText } from '@/lib/i18n/catalog';
import { localizePath,type Locale } from '@/lib/i18n/routing';
import { UI } from '@/lib/i18n/ui';
import { ALL_TOOLS,type SecurityTool } from '@/lib/tools-registry';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { getToolContent } from '@/content/tools';
import { ToolArticle } from './ToolArticle';
import { ToolRunner } from './ToolRunner';

/** `href` values are internal paths; they are localized here. */
export function Breadcrumb({ items, lang }: { items: { href?: string; label: string }[]; lang: Locale }) {
  return (
    <nav aria-label={UI[lang].toolPage.breadcrumb} className="text-[13px] text-slate-500 dark:text-zinc-400">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="size-3.5 text-slate-400 dark:text-zinc-600" aria-hidden />}
            {item.href ? (
              <Link href={localizePath(item.href, lang)} className="transition-colors hover:text-slate-900 dark:hover:text-zinc-100">{item.label}</Link>
            ) : (
              <span aria-current="page" className="font-medium text-slate-700 dark:text-zinc-300">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function RelatedTools({ tool, lang }: { tool: SecurityTool; lang: Locale }) {
  const related = ALL_TOOLS.filter((t) => t.category === tool.category && t.id !== tool.id && t.status === 'available').slice(0, 8);
  if (!related.length) return null;
  return (
    <section aria-labelledby="related" className="space-y-3.5">
      <h2 id="related" className="text-lg font-semibold tracking-[-0.01em] text-slate-950 dark:text-white">{UI[lang].toolPage.related}</h2>
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {related.map((t) => (
          <li key={t.id}>
            <Link
              href={localizePath(toolHref(t), lang)}
              className="group flex h-full items-start gap-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 transition-[border-color,box-shadow] hover:border-slate-300 hover:shadow-[0_2px_8px_-2px_rgba(15,23,42,0.08)] dark:hover:border-zinc-700"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-slate-900 dark:text-zinc-100">{toolText(t, lang).name}</span>
                <span className="mt-0.5 line-clamp-2 block text-[13px] leading-snug text-slate-600 dark:text-zinc-400">{toolText(t, lang).description}</span>
              </span>
              <ArrowRight className="mt-0.5 size-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-600 dark:group-hover:text-zinc-300" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Standard tool route: heading, the working tool, then explanatory content and related links. */
export function ToolPage({ tool, lang, children }: { tool: SecurityTool; lang: Locale; children?: ReactNode }) {
  const content = getToolContent(tool.id, lang);
  const text = toolText(tool, lang);
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-4">
        <Breadcrumb lang={lang} items={[{ href: '/araclar', label: UI[lang].common.tools }, { label: categoryText(tool.category, lang).name }]} />
        <PageHeader title={text.name} description={text.description} meta={tool.standard ? <Badge>{tool.standard}</Badge> : undefined} />
      </div>
      <Panel className="p-5 sm:p-6">
        <ToolRunner tool={tool} />
      </Panel>
      {children}
      {content && tool.status === 'available' && <ToolArticle content={content} lang={lang} />}
      <RelatedTools tool={tool} lang={lang} />
    </div>
  );
}
