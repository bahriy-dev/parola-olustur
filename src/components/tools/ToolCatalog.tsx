'use client';
import { navCategories,searchTools,toolHref } from '@/components/shell/nav-data';
import { useLocale } from '@/lib/i18n';
import { toolText } from '@/lib/i18n/catalog';
import { radioGroupKeyDown,selectedClass } from '@/components/ui/form';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { useMemo,useState } from 'react';

/** Search-first tool directory: filter by text or category, grouped list of name + one-line description. */
export function ToolCatalog() {
  const { lang, t, href } = useLocale();
  const [query, setQuery] = useState('');
  const categories = useMemo(() => navCategories(lang), [lang]);
  const [category, setCategory] = useState<string>('all');
  const matches = useMemo(() => (query.trim() ? new Set(searchTools(query, lang).map((tool) => tool.id)) : null), [query, lang]);

  const groups = categories.filter((c) => category === 'all' || c.key === category)
    .map((c) => ({ ...c, tools: c.tools.filter((tool) => !matches || matches.has(tool.id)) }))
    .filter((c) => c.tools.length > 0);
  const filters = [{ key: 'all', label: t.catalog.all }, ...categories];
  const total = groups.reduce((sum, g) => sum + g.tools.length, 0);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500 dark:text-zinc-400" aria-hidden />
          <input
            type="search"
            aria-label={t.catalog.searchLabel}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.catalog.searchPlaceholder}
            className="h-10 w-full rounded-md border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-9 pr-3 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-500 dark:placeholder:text-zinc-500 focus:border-blue-600 focus:outline-none focus:ring-3 focus:ring-blue-600/15"
          />
        </div>
        {/* One scrollable row on phones so the filters do not push the list off screen; wraps from sm up. */}
        <div role="radiogroup" aria-label={t.catalog.category} onKeyDown={(e) => radioGroupKeyDown(e, filters.map((c) => c.key), category, setCategory)} className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          {filters.map((c) => (
            <button
              key={c.key}
              type="button"
              role="radio"
              aria-checked={category === c.key}
              tabIndex={category === c.key ? 0 : -1}
              onClick={() => setCategory(c.key)}
              className={`shrink-0 whitespace-nowrap rounded-md border px-2.5 py-1.5 text-[13px] cursor-pointer transition-colors ${
                category === c.key
                  ? selectedClass
                  : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <p className="text-[13px] text-slate-600 dark:text-zinc-400" aria-live="polite">{t.catalog.count(total)}</p>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-zinc-400">{t.catalog.empty}</p>
      ) : (
        groups.map((group) => (
          <section key={group.key} aria-labelledby={`cat-${group.key}`} className="space-y-2">
            <h2 id={`cat-${group.key}`} className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{group.label}</h2>
            <ul className="divide-y divide-slate-200 dark:divide-zinc-800 overflow-hidden rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:shadow-none">
              {group.tools.map((tool) => (
                <li key={tool.id}>
                  <Link href={href(toolHref(tool))} className="flex flex-col gap-0.5 px-4 py-3 hover:bg-slate-50 dark:hover:bg-zinc-800/60 sm:flex-row sm:items-baseline sm:gap-4">
                    <span className="shrink-0 text-sm font-medium text-slate-900 dark:text-zinc-100 sm:w-72">{toolText(tool, lang).name}</span>
                    <span className="min-w-0 text-[13px] text-slate-600 dark:text-zinc-400">{toolText(tool, lang).description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
