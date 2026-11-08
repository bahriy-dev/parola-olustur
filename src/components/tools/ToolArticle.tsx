import { CopyButton } from '@/components/ui/form';
import type { Block,ToolContent } from '@/content/tools/types';
import { localizePath,type Locale } from '@/lib/i18n/routing';
import { UI } from '@/lib/i18n/ui';
import { ChevronDown,Lightbulb } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

/** Stable, URL-safe anchor for a Turkish heading ("Hangi türü seçmeli?" → "hangi-turu-secmeli"). */
const slugify = (text: string) =>
  text
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşü]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' })[c] ?? c)
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/**
 * One collapsible card per topic, closed by default so the page stays calm; the text is still in the HTML for
 * readers and search engines. The id lets a #fragment link point at a section (browsers open it on navigation).
 */
export function Collapsible({ title, children, headingLevel = 'h2' }: { title: string; children: ReactNode; headingLevel?: 'h2' | 'h3' }) {
  const Heading = headingLevel;
  return (
    <details id={slugify(title)} className="group/item scroll-mt-20">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/40 sm:px-5 [&::-webkit-details-marker]:hidden">
        <Heading className="text-[15px] font-semibold leading-snug text-slate-950 dark:text-white">{title}</Heading>
        <ChevronDown aria-hidden className="size-4 shrink-0 text-slate-400 transition-transform group-open/item:rotate-180" />
      </summary>
      <div className="space-y-3.5 px-4 pb-5 pt-0.5 sm:px-5">{children}</div>
    </details>
  );
}

export const cardList = 'divide-y divide-slate-200 dark:divide-zinc-800 overflow-hidden rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:shadow-none';
const groupTitle = 'text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-zinc-400';

const INLINE = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;

/** Renders `code`, **bold** and [label](/path) links (internal paths, localized); everything else stays plain text. */
function Inline({ text, lang }: { text: string; lang: Locale }) {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > last) parts.push(text.slice(last, index));
    const token = match[0];
    if (token.startsWith('**')) {
      parts.push(<strong key={index} className="font-semibold text-slate-900 dark:text-zinc-100">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`')) {
      parts.push(<code key={index} className="rounded-[5px] border border-slate-200/80 dark:border-zinc-800 bg-slate-100/80 dark:bg-zinc-800/70 px-[0.3em] py-px font-mono text-[0.85em] text-slate-900 dark:text-zinc-100">{token.slice(1, -1)}</code>);
    } else {
      const [, label, href] = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)!;
      const cls = 'font-medium text-blue-700 dark:text-blue-400 underline decoration-blue-700/30 underline-offset-[3px] hover:decoration-current dark:decoration-blue-400/40';
      parts.push(href.startsWith('/') ? <Link key={index} href={localizePath(href, lang)} className={cls}>{label}</Link> : <a key={index} href={href} className={cls} rel="noopener noreferrer" target="_blank">{label}</a>);
    }
    last = index + token.length;
  }
  parts.push(text.slice(last));
  return <>{parts}</>;
}

function BlockView({ block, lang }: { block: Block; lang: Locale }) {
  if (typeof block === 'string') return <p><Inline lang={lang} text={block} /></p>;
  if ('list' in block)
    return <ul className="space-y-1.5 pl-5 marker:text-slate-400 dark:marker:text-zinc-600 list-disc">{block.list.map((item) => <li key={item} className="pl-1"><Inline lang={lang} text={item} /></li>)}</ul>;
  if ('steps' in block)
    return <ol className="space-y-1.5 pl-5 marker:font-medium marker:text-slate-500 dark:marker:text-zinc-500 list-decimal">{block.steps.map((item) => <li key={item} className="pl-1"><Inline lang={lang} text={item} /></li>)}</ol>;
  if ('note' in block)
    return (
      <p className="flex gap-2.5 rounded-lg border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/20 px-3.5 py-2.5 text-[14px] text-amber-950 dark:text-amber-100">
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
        <span><Inline lang={lang} text={block.note} /></span>
      </p>
    );
  if ('code' in block)
    return (
      <figure className="space-y-1.5">
        <div className="group/code relative">
          <pre tabIndex={0} className="overflow-x-auto rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-950 px-4 py-3 pr-24 font-mono text-[13px] leading-relaxed text-slate-100 dark:bg-black/40"><code>{block.code}</code></pre>
          <div className="absolute right-2 top-2 opacity-90">
            <CopyButton value={block.code} className="h-7! border-white/10! bg-white/10! text-white! shadow-none! hover:bg-white/20!" />
          </div>
        </div>
        {block.caption && <figcaption className="text-[13px] text-slate-600 dark:text-zinc-400"><Inline lang={lang} text={block.caption} /></figcaption>}
      </figure>
    );
  return (
    <div tabIndex={0} className="overflow-x-auto rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <table className="w-full min-w-[28rem] border-collapse text-sm">
        <thead className="bg-slate-50 dark:bg-zinc-950/40">
          <tr className="border-b border-slate-200 dark:border-zinc-800 text-left">
            {block.table.head.map((cell) => <th key={cell} scope="col" className="px-3.5 py-2.5 text-[13px] font-semibold text-slate-900 dark:text-zinc-100">{cell}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
          {block.table.rows.map((row) => (
            <tr key={row.join('|')}>
              {row.map((cell, i) => <td key={i} className="px-3.5 py-2.5 align-top"><Inline lang={lang} text={cell} /></td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Explanatory content that follows the tool: collapsible topics, FAQ and references. */
export function ToolArticle({ content, lang }: { content: ToolContent; lang: Locale }) {
  const t = UI[lang].toolPage;
  return (
    <article className="space-y-6 pt-2 text-[15px] leading-[1.7] text-slate-700 dark:text-zinc-300">
      <section className="space-y-2.5">
        <h2 className={groupTitle}>{t.guide}</h2>
        <div className={cardList}>
          {content.sections.map((section) => (
            <Collapsible key={section.title} title={section.title} headingLevel="h3">
              {section.blocks.map((block, i) => <BlockView key={i} block={block} lang={lang} />)}
            </Collapsible>
          ))}
        </div>
      </section>
      {content.faq && content.faq.length > 0 && (
        <section className="space-y-2.5">
          <h2 className={groupTitle}>{t.faq}</h2>
          <div className={cardList}>
            {content.faq.map((item) => (
              <Collapsible key={item.q} title={item.q} headingLevel="h3">
                <p className="text-slate-600 dark:text-zinc-400"><Inline lang={lang} text={item.a} /></p>
              </Collapsible>
            ))}
          </div>
        </section>
      )}
      {content.sources && content.sources.length > 0 && (
        <section className="space-y-2">
          <h2 className={groupTitle}>{t.sources}</h2>
          <ul className="space-y-1 text-sm">
            {content.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} rel="noopener noreferrer" target="_blank" className="text-blue-700 dark:text-blue-400 underline decoration-blue-700/30 underline-offset-[3px] hover:decoration-current">{source.label} <span aria-hidden>↗</span></a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

/** Plain-text FAQ answers for FAQPage JSON-LD (inline markup stripped). */
export const plainText = (text: string) => text.replace(/`([^`]+)`/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
