'use client';

import { BrandLogo } from '@/components/ui/BrandLogo';
import { useLocale } from '@/lib/i18n';
import { LOCALES,localizePath,parsePublicPath } from '@/lib/i18n/routing';
import { useTheme } from '@/lib/theme/theme-context';
import { SITE_NAME } from '@/lib/site';
import { Menu,Moon,Search,Sun,X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect,useRef,useState,type ReactNode } from 'react';
import { CommandPalette,OPEN_SEARCH_EVENT } from './CommandPalette';
import { ConsentBanner } from './ConsentBanner';
import { hashLinks,infoLinks,primaryLinks } from './nav-data';
import { SiteFooter } from './SiteFooter';

const iconButton =
  'size-10 items-center justify-center rounded-lg text-muted hover:bg-surface-muted hover:text-fg transition-colors cursor-pointer';

const LANGUAGE_NAMES = { tr: 'Türkçe', en: 'English' } as const;

/** Links to the same page in the other language (both URLs exist, so this is plain navigation). */
function LanguageSwitch() {
  const { lang, t } = useLocale();
  const { path } = parsePublicPath(usePathname());
  return (
    <nav aria-label={t.shell.language} className="flex items-center rounded-lg border border-line p-0.5 text-xs font-medium">
      {LOCALES.map((locale) => (
        <Link
          key={locale}
          href={localizePath(path, locale)}
          hrefLang={locale}
          lang={locale}
          aria-current={locale === lang ? 'true' : undefined}
          className={`rounded-md px-2 py-1 uppercase transition-colors ${locale === lang ? 'bg-fg text-bg' : 'text-muted hover:text-fg'}`}
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

/** Opens the search palette (it listens for this event and for ⌘K / Ctrl+K). */
const openSearch = () => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t, href } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  // Focus goes back to the button that opened the menu once it closes.
  const menuTrigger = useRef<HTMLElement | null>(null);

  // Close the mobile menu on navigation; Escape and a click outside also close it.
  useEffect(() => {
    const timer = setTimeout(() => setMenuOpen(false), 0);
    return () => clearTimeout(timer);
  }, [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      menuTrigger.current?.focus();
    };
  }, [menuOpen]);

  const menuSections = [
    { links: primaryLinks(t) },
    { title: t.nav.hashSection, links: hashLinks(t) },
    { title: t.nav.info, links: infoLinks(t) },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      {/* While the menu is open the rest of the page is inert, so focus and screen readers stay in the dialog. */}
      <a href="#icerik" inert={menuOpen} className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:shadow">
        {t.shell.skip}
      </a>

      <header inert={menuOpen} className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-[var(--header-h)] max-w-site items-center gap-2 px-4 sm:px-6">
          <Link href={href('/')} className="shrink-0 rounded-lg" aria-label={t.shell.homeLabel(SITE_NAME)}>
            <BrandLogo />
          </Link>

          <nav aria-label={t.shell.menu} className="ml-auto hidden items-center gap-1 md:flex">
            <Link
              href={href('/araclar')}
              aria-current={pathname === href('/araclar') ? 'page' : undefined}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-muted hover:text-fg aria-[current=page]:text-fg"
            >
              {t.nav.tools}
            </Link>
            <button
              type="button"
              onClick={openSearch}
              className="flex h-9 w-56 cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm text-subtle transition-colors hover:border-line-strong lg:w-64"
            >
              <Search className="size-4 shrink-0" aria-hidden />
              <span className="flex-1 text-left">{t.search.open}</span>
              <kbd className="rounded border border-line px-1.5 font-sans text-[11px]">⌘K</kbd>
            </button>
          </nav>

          <div className="ml-auto flex items-center gap-1 md:ml-2">
            <button type="button" onClick={openSearch} aria-label={t.shell.searchTools} className={`${iconButton} inline-flex md:hidden`}>
              <Search className="size-[18px]" />
            </button>
            <span className="hidden sm:block">
              <LanguageSwitch />
            </span>
            <ThemeToggle />
            <button
              type="button"
              onClick={(e) => {
                menuTrigger.current = e.currentTarget;
                setMenuOpen(true);
              }}
              aria-label={t.shell.openMenu}
              aria-expanded={menuOpen}
              className={`${iconButton} inline-flex md:hidden`}
            >
              <Menu className="size-5" />
            </button>
          </div>
        </div>
      </header>

      <main id="icerik" inert={menuOpen} className="w-full flex-1 px-4 py-6 sm:px-6 lg:py-10">
        {children}
      </main>
      <div inert={menuOpen}>
        <SiteFooter />
      </div>
      <ConsentBanner />
      <CommandPalette />

      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label={t.shell.menu}>
          <div className="absolute inset-0 bg-slate-950/40 dark:bg-black/60" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-80 max-w-[86vw] flex-col bg-surface shadow-xl">
            <div className="flex h-[var(--header-h)] items-center justify-between border-b border-line px-4">
              <LanguageSwitch />
              <button type="button" onClick={() => setMenuOpen(false)} aria-label={t.shell.closeMenu} className={`${iconButton} inline-flex`} autoFocus>
                <X className="size-5" />
              </button>
            </div>
            <nav aria-label={t.shell.menu} className="flex-1 overflow-y-auto px-3 py-2">
              {menuSections.map((section, index) => (
                <div key={index} className="py-2">
                  {section.title && <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">{section.title}</p>}
                  {section.links.map((link) => (
                    <Link
                      key={link.href}
                      href={href(link.href)}
                      onClick={() => setMenuOpen(false)}
                      aria-current={pathname === href(link.href) ? 'page' : undefined}
                      className="flex min-h-11 items-center rounded-lg px-3 text-[15px] text-fg hover:bg-surface-muted aria-[current=page]:bg-primary-soft aria-[current=page]:text-primary-soft-fg"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
