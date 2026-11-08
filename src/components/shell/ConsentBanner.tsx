'use client';

import { Button } from '@/components/ui/form';
import { ANALYTICS_ENABLED,CONSENT_KEY,GA_ID,GTM_ID,META_PIXEL_ID } from '@/lib/analytics';
import { useLocale } from '@/lib/i18n';
import { usePreference } from '@/lib/preferences';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect,useRef,useState } from 'react';

/** Fired by the footer's "cookie settings" link to show the banner again. */
export const OPEN_CONSENT_EVENT = 'parola-consent-open';

type Gtag = (...args: unknown[]) => void;
type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue: unknown[]; loaded: boolean; version: string; push: unknown };
declare global {
  interface Window { dataLayer?: unknown[]; gtag?: Gtag; fbq?: Fbq; _fbq?: Fbq }
}

function addScript(src: string) {
  const script = document.createElement('script');
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function loadGa() {
  if ((!GA_ID && !GTM_ID) || window.gtag) return;
  window.dataLayer = window.dataLayer || [];
  // gtag.js reads the `arguments` object itself, so this must stay a plain function.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  if (GTM_ID) {
    // The container's own GA4 tag sends the data; configuring gtag here as well would count every visit twice.
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    addScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`);
    return;
  }
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);
  addScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`);
}

function loadPixel() {
  if (!META_PIXEL_ID || window.fbq) return;
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  } as Fbq;
  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.push = fbq;
  window.fbq = window._fbq = fbq;
  addScript('https://connect.facebook.net/en_US/fbevents.js');
  // No automatic button/form scraping and no automatic advanced matching: only explicit page views are sent.
  fbq('set', 'autoConfig', false, META_PIXEL_ID);
  fbq('init', META_PIXEL_ID);
}

/**
 * KVKK/GDPR consent: GA4 and the Meta Pixel load only after "Accept"; "Reject" is equally prominent and loads
 * nothing. The choice is stored locally and can be changed from the footer. Renders nothing when no tracker is configured.
 */
export function ConsentBanner() {
  const { t, href } = useLocale();
  const pathname = usePathname();
  const [consent, setConsent] = usePreference<'granted' | 'denied' | 'unset'>(CONSENT_KEY, 'unset', ['granted', 'denied', 'unset']);
  const [reopened, setReopened] = useState(false);
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const open = () => setReopened(true);
    window.addEventListener(OPEN_CONSENT_EVENT, open);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, open);
  }, []);

  // Load once consent is given; Meta needs an explicit page view per client-side navigation (GA4 tracks history itself).
  useEffect(() => {
    if (!ANALYTICS_ENABLED || consent !== 'granted') return;
    loadGa();
    loadPixel();
    if (META_PIXEL_ID && lastPath.current !== pathname) window.fbq?.('track', 'PageView');
    lastPath.current = pathname;
  }, [consent, pathname]);

  if (!ANALYTICS_ENABLED || (consent !== 'unset' && !reopened)) return null;

  const choose = (value: 'granted' | 'denied') => {
    setConsent(value);
    setReopened(false);
    // Withdrawing consent cannot unload scripts already running; a reload starts the page without them.
    if (value === 'denied' && (window.gtag || window.fbq)) window.location.reload();
  };

  return (
    <section
      role="dialog"
      aria-label={t.consent.title}
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xl shadow-slate-900/10 dark:shadow-black/40 sm:bottom-4 sm:p-5"
    >
      <h2 className="text-sm font-semibold text-slate-950 dark:text-white">{t.consent.title}</h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600 dark:text-zinc-400">
        {META_PIXEL_ID ? t.consent.textWithPixel : t.consent.text}{' '}
        <Link href={href('/gizlilik')} className="font-medium text-blue-700 underline underline-offset-2 dark:text-blue-400">{t.consent.more}</Link>
      </p>
      <div className="mt-3.5 grid grid-cols-2 gap-2">
        <Button onClick={() => choose('denied')}>{t.consent.reject}</Button>
        <Button onClick={() => choose('granted')}>{t.consent.accept}</Button>
      </div>
    </section>
  );
}
