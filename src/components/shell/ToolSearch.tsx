'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect,useId,useMemo,useRef,useState } from 'react';
import { useLocale } from '@/lib/i18n';
import { categoryText,toolText } from '@/lib/i18n/catalog';
import { searchTools,toolHref } from './nav-data';

/** Header search: type to filter tools, arrows to move, Enter to open. ⌘K / Ctrl+K focuses it. */
export function ToolSearch() {
  const router = useRouter();
  const { lang, t, href } = useLocale();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const results = useMemo(() => searchTools(query, lang, 8), [query, lang]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const go = (index: number) => {
    const tool = results[index];
    if (!tool) return;
    router.push(href(toolHref(tool)));
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const showList = open && query.trim().length > 0;

  return (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-500 dark:text-zinc-400" aria-hidden />
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-label={t.search.label}
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && results[active] ? `${listId}-${active}` : undefined}
        autoComplete="off"
        spellCheck={false}
        value={query}
        placeholder={t.search.placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, results.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            go(active);
          } else if (e.key === 'Escape') {
            setQuery('');
            inputRef.current?.blur();
          }
        }}
        className="h-9 w-full rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-100/70 dark:bg-zinc-900 pl-8 pr-12 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-500 dark:placeholder:text-zinc-500 transition-colors hover:border-slate-300 dark:hover:border-zinc-700 focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-1.5 font-sans text-[11px] text-slate-600 dark:text-zinc-400 shadow-[0_1px_0_rgba(15,23,42,0.06)]">⌘K</kbd>
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-96 overflow-y-auto rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1 shadow-xl shadow-slate-900/10 dark:shadow-black/40"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-600 dark:text-zinc-400">{t.search.noResults}</li>
          ) : (
            results.map((tool, index) => (
              <li
                key={tool.id}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  go(index);
                }}
                onMouseEnter={() => setActive(index)}
                className={`cursor-pointer rounded-lg px-3 py-2 ${index === active ? 'bg-slate-100 dark:bg-zinc-800' : ''}`}
              >
                <span className="block truncate text-sm text-slate-900 dark:text-zinc-100">{toolText(tool, lang).name}</span>
                <span className="block truncate text-[13px] text-slate-600 dark:text-zinc-400">{categoryText(tool.category, lang).name}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
