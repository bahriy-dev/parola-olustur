'use client';

import { ANALYTICS_ENABLED } from '@/lib/analytics';
import { useLocale } from '@/lib/i18n';
import { SITE_NAME } from '@/lib/site';
import Link from 'next/link';
import { OPEN_CONSENT_EVENT } from './ConsentBanner';

const REPOSITORY = 'https://github.com/bahriy-dev/parola-olustur';
const link = 'transition-colors hover:text-fg';

/** One quiet row: name and year, then the few links people look for at the bottom of a page. */
export function SiteFooter() {
  const { t, href } = useLocale();
  return (
    <footer className="mt-12 border-t border-line">
      <div className="mx-auto flex max-w-site flex-col gap-3 px-4 py-6 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          © <span suppressHydrationWarning>{new Date().getFullYear()}</span> {SITE_NAME}
        </p>
        <nav aria-label={t.footer.label} className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link href={href('/araclar')} className={link}>{t.nav.tools}</Link>
          <Link href={href('/gizlilik')} className={link}>{t.nav.privacy}</Link>
          {ANALYTICS_ENABLED && (
            <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))} className={`${link} cursor-pointer`}>
              {t.footer.cookieSettings}
            </button>
          )}
          <a href={REPOSITORY} target="_blank" rel="noopener noreferrer" className={link}>
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
