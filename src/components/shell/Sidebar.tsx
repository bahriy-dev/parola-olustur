'use client';

import { ChevronRight,FileKey2,Fingerprint,Hash,KeyRound,KeySquare,Lock,Search,X,type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/lib/i18n';
import { toolText } from '@/lib/i18n/catalog';
import { parsePublicPath } from '@/lib/i18n/routing';
import { useMemo,useState } from 'react';
import { hashLinks,infoLinks,navCategories,primaryLinks,searchTools,toolHref,type NavLink } from './nav-data';


const CATEGORY_ICONS: Record<string, LucideIcon> = { password: KeyRound, kdf: Fingerprint, hash: Hash, jwt: FileKey2, crypto: Lock, keys: KeySquare };

const sectionTitle = 'px-2.5 pb-1.5 pt-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-zinc-400';

// Tool names are long phrases; they wrap instead of being cut off with an ellipsis. `href` is an internal path.
function NavItem({ href, label, active, onNavigate }: { href: string; label: string; active: boolean; onNavigate?: () => void }) {
  const { href: localize } = useLocale();
  return (
    <Link
      href={localize(href)}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={`block rounded-lg px-2.5 py-1.5 text-sm leading-snug transition-colors ${
        active
          ? 'bg-blue-50 dark:bg-blue-500/10 font-medium text-blue-700 dark:text-blue-300'
          : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-zinc-100'
      }`}
    >
      {label}
    </Link>
  );
}

function Section({ title, links, current, onNavigate }: { title?: string; links: NavLink[]; current: string; onNavigate?: () => void }) {
  return (
    <div className="space-y-0.5">
      {title && <h2 className={sectionTitle}>{title}</h2>}
      {links.map((link) => (
        <NavItem key={link.href} href={link.href} label={link.label} active={current === link.href} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

/**
 * Tool navigation. Rendered inline on desktop and inside a drawer on mobile. The desktop sidebar omits its own
 * search field because the header search is visible there.
 */
export function SidebarContent({ onNavigate, search = true, autoFocusSearch = false }: { onNavigate?: () => void; search?: boolean; autoFocusSearch?: boolean }) {
  const { lang, t } = useLocale();
  // Active state compares internal paths, so /en/tools/x and /araclar/x both mark the same item.
  const current = parsePublicPath(usePathname()).path;
  const [query, setQuery] = useState('');
  const categories = navCategories(lang);
  const activeCategory = categories.find((c) => c.tools.some((tool) => current === toolHref(tool)))?.key;
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const results = useMemo(() => searchTools(query, lang), [query, lang]);
  const isExpanded = (key: string) => expanded[key] ?? key === activeCategory;

  return (
    <div className="flex h-full flex-col">
      {search && (
        <div className="px-3 pb-2 pt-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-500 dark:text-zinc-400" aria-hidden />
            <input
              type="search"
              aria-label={t.search.sidebarLabel}
              autoFocus={autoFocusSearch}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.search.sidebarPlaceholder}
              className="h-8 w-full rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-8 pr-7 text-[13px] text-slate-900 dark:text-zinc-100 placeholder:text-slate-500 dark:placeholder:text-zinc-500 focus:border-blue-600 focus:outline-none focus:ring-3 focus:ring-blue-600/15 [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button type="button" aria-label={t.search.clear} onClick={() => setQuery('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer">
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      <nav aria-label={t.nav.main} className={`flex-1 overflow-y-auto px-3 pb-4 ${search ? '' : 'pt-2'}`}>
        {query.trim() ? (
          <div className="space-y-0.5">
            <p className="px-2.5 pb-1 pt-1 text-xs text-slate-500 dark:text-zinc-400">{t.search.results(results.length)}</p>
            {results.map((tool) => (
              <NavItem key={tool.id} href={toolHref(tool)} label={toolText(tool, lang).name} active={current === toolHref(tool)} onNavigate={onNavigate} />
            ))}
          </div>
        ) : (
          <>
            <Section links={primaryLinks(t)} current={current} onNavigate={onNavigate} />
            <Section title={t.nav.hashSection} links={hashLinks(t)} current={current} onNavigate={onNavigate} />
            <h2 className={sectionTitle}>{t.nav.categories}</h2>
            <div className="space-y-0.5">
              {categories.map((category) => {
                const open = isExpanded(category.key);
                const Icon = CATEGORY_ICONS[category.key] ?? Hash;
                return (
                  <div key={category.key}>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setExpanded((prev) => ({ ...prev, [category.key]: !open }))}
                      className="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100 cursor-pointer"
                    >
                      <Icon className="size-4 shrink-0 text-slate-500 dark:text-zinc-500" aria-hidden />
                      <span className="flex-1 leading-snug">{category.label}</span>
                      <span className="text-xs tabular-nums text-slate-500 dark:text-zinc-400">{category.tools.length}</span>
                      <ChevronRight className={`size-3.5 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`} aria-hidden />
                    </button>
                    {open && (
                      <div className="ml-[17px] mt-0.5 space-y-0.5 border-l border-slate-200 dark:border-zinc-800 py-0.5 pl-2.5">
                        {category.tools.map((tool) => (
                          <NavItem key={tool.id} href={toolHref(tool)} label={toolText(tool, lang).name} active={current === toolHref(tool)} onNavigate={onNavigate} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <Section title={t.nav.info} links={infoLinks(t)} current={current} onNavigate={onNavigate} />
          </>
        )}
      </nav>
    </div>
  );
}
