'use client';

import { BrandLogo } from '@/components/ui/BrandLogo';
import { useLocale } from '@/lib/i18n';
import { LOCALES,localizePath,parsePublicPath } from '@/lib/i18n/routing';
import { usePreference } from '@/lib/preferences';
import { useTheme } from '@/lib/theme/theme-context';
import { SITE_NAME } from '@/lib/site';
import { Menu,Moon,PanelLeft,Search,Sun,X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect,useRef,useState,type ReactNode } from 'react';
import { SidebarContent } from './Sidebar';
import { ConsentBanner } from './ConsentBanner';
import { SiteFooter } from './SiteFooter';
import { ToolSearch } from './ToolSearch';

const iconButton =
  'size-9 items-center justify-center rounded-lg text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors cursor-pointer';

const LANGUAGE_NAMES = { tr: 'Türkçe', en: 'English' } as const;

/** Links to the same page in the other language (both URLs exist, so this is plain navigation). */
function LanguageSwitch() {
  const { lang, t } = useLocale();
  const { path } = parsePublicPath(usePathname());
  return (
    <nav aria-label={t.shell.language} className="flex items-center rounded-lg border border-slate-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 p-0.5 text-xs font-medium">
      {LOCALES.map((locale) => (
        <Link
          key={locale}
          href={localizePath(path, locale)}
          hrefLang={locale}
          lang={locale}
          aria-current={locale === lang ? 'true' : undefined}
          className={`rounded-md px-2 py-1 uppercase transition-colors ${locale === lang ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'}`}
        >
          {locale}
          {/* The accessible name starts with the visible code (WCAG 2.5.3), then spells out the language. */}
          <span className="sr-only normal-case">{` – ${LANGUAGE_NAMES[locale]}`}</span>
        </Link>
      ))}
    </nav>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLocale();
  const dark = theme === 'dark';
  return (
    <button type="button" onClick={toggleTheme} aria-label={dark ? t.shell.toLight : t.shell.toDark} title={dark ? t.shell.lightTheme : t.shell.darkTheme} className={`${iconButton} inline-flex`}>
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t, href } = useLocale();
  const [drawerOpen, setDrawerOpen] = useState(false);
  // On phones the header has no search field; its search button opens the drawer with search focused.
  const [drawerSearch, setDrawerSearch] = useState(false);
  // Focus goes back to the button that opened the drawer once it closes.
  const drawerTrigger = useRef<HTMLElement | null>(null);
  const openDrawer = (search: boolean) => {
    drawerTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setDrawerSearch(search);
    setDrawerOpen(true);
  };
  const [sidebar, setSidebar] = usePreference<'open' | 'closed'>('parola_sidebar', 'open', ['open', 'closed']);

  // Close the mobile drawer on navigation and let Escape dismiss it.
  useEffect(() => {
    const timer = setTimeout(() => setDrawerOpen(false), 0);
    return () => clearTimeout(timer);
  }, [pathname]);
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false);
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      drawerTrigger.current?.focus();
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
      {/* While the drawer is open the rest of the page is inert, so focus and screen readers stay in the dialog. */}
      <a href="#icerik" inert={drawerOpen} className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow dark:focus:bg-zinc-900">
        {t.shell.skip}
      </a>

      <header inert={drawerOpen} className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/75 dark:supports-[backdrop-filter]:bg-zinc-950/75">
        {/* Hairline brand accent along the top edge. */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-600 via-sky-400 to-emerald-400 opacity-80" />
        <div className="flex h-14 items-center gap-2 px-3 sm:gap-3 sm:px-4">
          <button type="button" onClick={() => openDrawer(false)} aria-label={t.shell.openMenu} className={`${iconButton} inline-flex lg:hidden`}>
            <Menu className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => setSidebar(sidebar === 'open' ? 'closed' : 'open')}
            aria-label={sidebar === 'open' ? t.shell.hideSidebar : t.shell.showSidebar}
            aria-pressed={sidebar === 'open'}
            className={`${iconButton} hidden lg:inline-flex`}
          >
            <PanelLeft className="size-4" />
          </button>
          <Link href={href('/')} className="shrink-0 rounded-lg" aria-label={t.shell.homeLabel(SITE_NAME)}>
            <BrandLogo />
          </Link>

          <div className="mx-auto hidden w-full max-w-lg md:block">
            <ToolSearch />
          </div>

          <div className="ml-auto flex items-center gap-1.5 md:ml-0">
            <span className="mr-1 hidden items-center gap-1.5 rounded-full border border-emerald-200 dark:border-emerald-900/70 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-300 xl:inline-flex">
              <span aria-hidden className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
              </span>
              {t.shell.runsInBrowser}
            </span>
            <button type="button" onClick={() => openDrawer(true)} aria-label={t.shell.searchTools} className={`${iconButton} inline-flex md:hidden`}>
              <Search className="size-[18px]" />
            </button>
            <LanguageSwitch />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div inert={drawerOpen} className="flex">
        {sidebar === 'open' && (
          <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-72 shrink-0 border-r border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 lg:block">
            <SidebarContent search={false} />
          </aside>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <main id="icerik" className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
          <SiteFooter />
          <ConsentBanner />
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t.shell.menu}>
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-80 max-w-[86vw] flex-col bg-slate-50 dark:bg-zinc-950 shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-slate-200 dark:border-zinc-800 px-3">
              <BrandLogo />
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label={t.shell.closeMenu} className={`${iconButton} inline-flex`} autoFocus={!drawerSearch}>
                <X className="size-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <SidebarContent onNavigate={() => setDrawerOpen(false)} autoFocusSearch={drawerSearch} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
