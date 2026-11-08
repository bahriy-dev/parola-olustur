'use client';

import { useLocale } from '@/lib/i18n';
import { categoryText,toolText } from '@/lib/i18n/catalog';
import { CornerDownLeft,Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect,useId,useMemo,useRef,useState } from 'react';
import { hashLinks,infoLinks,normalizeSearch,primaryLinks,searchTools,toolHref } from './nav-data';

/** Opens the palette from anywhere (header button, mobile button). */
export const OPEN_SEARCH_EVENT = 'parola-search-open';

type Result = { key: string; href: string; label: string; meta: string };

/**
 * Global tool search as a modal: ⌘K / Ctrl+K or the header button opens it, typing filters instantly, arrows move,
 * Enter opens, Escape or a click outside closes. Results come from the tool registry, so there is one tool list.
 */
export function CommandPalette() {
  const { lang, t, href } = useLocale();
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const results = useMemo<Result[]>(() => {
    const q = normalizeSearch(query);
    const pages = [...primaryLinks(t), ...hashLinks(t), ...infoLinks(t)];
    if (!q) return pages.map((page) => ({ key: page.href, href: page.href, label: page.label, meta: t.search.pages }));
    const pageHits = pages.filter((page) => normalizeSearch(page.label).includes(q)).map((page) => ({ key: page.href, href: page.href, label: page.label, meta: t.search.pages }));
    const toolHits = searchTools(query, lang, 12).map((tool) => ({ key: tool.id, href: toolHref(tool), label: toolText(tool, lang).name, meta: categoryText(tool.category, lang).name }));
    return [...toolHits, ...pageHits].slice(0, 12);
  }, [query, lang, t]);

  useEffect(() => {
    const show = () => {
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setOpen(true);
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        show();
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_SEARCH_EVENT, show);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_SEARCH_EVENT, show);
    };
  }, []);

  // While open: the page behind does not scroll; on close, focus returns to whatever opened the palette.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();
    return () => {
      document.body.style.overflow = '';
      returnFocus.current?.focus();
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    setQuery('');
    setActive(0);
  };
  const go = (result: Result | undefined) => {
    if (!result) return;
    router.push(href(result.href));
    close();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-3 pt-[12vh] sm:px-4" role="presentation">
      <div className="absolute inset-0 bg-slate-950/40 dark:bg-black/60" aria-hidden onClick={close} />
      <div role="dialog" aria-modal="true" aria-label={t.search.label} className="relative w-full max-w-xl overflow-hidden rounded-xl border border-line bg-surface shadow-2xl shadow-slate-950/20">
        <div className="flex items-center gap-2.5 border-b border-line px-4">
          <Search className="size-4 shrink-0 text-subtle" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
            aria-label={t.search.label}
            placeholder={t.search.placeholder}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, results.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                go(results[active]);
              } else if (e.key === 'Escape') {
                e.preventDefault();
                close();
              } else if (e.key === 'Tab') {
                // The input is the only focus stop; Tab must not leave the dialog.
                e.preventDefault();
              }
            }}
            className="h-12 w-full bg-transparent text-[15px] text-fg placeholder:text-subtle focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          <kbd className="hidden shrink-0 rounded border border-line px-1.5 font-sans text-[11px] text-subtle sm:inline">Esc</kbd>
        </div>
        <ul id={listId} role="listbox" aria-label={t.search.label} className="max-h-[min(60vh,26rem)] overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted">{t.search.noResults}</li>
          ) : (
            results.map((result, index) => (
              <li
                key={result.key}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  go(result);
                }}
                onMouseMove={() => setActive(index)}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 ${index === active ? 'bg-surface-muted' : ''}`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-fg">{result.label}</span>
                  <span className="block truncate text-xs text-muted">{result.meta}</span>
                </span>
                {index === active && <CornerDownLeft className="size-3.5 shrink-0 text-subtle" aria-hidden />}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
