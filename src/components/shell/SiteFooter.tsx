'use client';


import { BrandMark } from '@/components/ui/BrandLogo';
import { SITE_HOST,SITE_NAME } from '@/lib/site';
import { ANALYTICS_ENABLED } from '@/lib/analytics';
import { Cookie,Lock,ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from '@/lib/i18n';
import type { UiDictionary } from '@/lib/i18n/ui';
import { OPEN_CONSENT_EVENT } from './ConsentBanner';
import { hashLinks,infoLinks,toolHref } from './nav-data';

const columns = (t: UiDictionary): { title: string; links: { href: string; label: string }[] }[] => [
  {
    title: t.footer.generators,
    links: [
      { href: '/', label: t.nav.generator },
      { href: toolHref({ id: 'passphrase-generator' }), label: t.footer.passphrase },
      { href: toolHref({ id: 'pin-generator' }), label: t.footer.pin },
      { href: '/toplu-parola', label: t.nav.bulk },
    ],
  },
  { title: t.nav.hashSection, links: hashLinks(t) },
  {
    title: t.nav.tools,
    links: [
      { href: toolHref({ id: 'bcrypt-generator' }), label: 'bcrypt' },
      { href: toolHref({ id: 'argon2id-generator' }), label: 'Argon2id' },
      { href: toolHref({ id: 'jwt-decoder' }), label: t.footer.jwtDecoder },
      { href: '/araclar', label: t.nav.allTools },
    ],
  },
  { title: t.nav.info, links: infoLinks(t).map((link) => (link.href === '/sss' ? { ...link, label: t.footer.faq } : link)) },
];

// Each claim matches the privacy page: local processing, inputs never sent, analytics only after consent.
const PROMISE_ICONS = [ShieldCheck, Lock, Cookie];

export function SiteFooter() {
  const { t, href } = useLocale();
  return (
    <footer className="mt-16 border-t border-slate-200/80 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-0">
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(4,1fr)] lg:gap-8">
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <Link href={href('/')} className="inline-flex items-center gap-2.5 rounded-md" aria-label={t.shell.homeLabel(SITE_NAME)}>
              <BrandMark className="size-7" />
              <span className="text-[15px] font-semibold tracking-[-0.015em] text-slate-950 dark:text-white">{SITE_NAME}</span>
            </Link>
            <p className="max-w-xs text-[13px] leading-relaxed text-slate-600 dark:text-zinc-400">
              {t.footer.tagline}
            </p>
            <ul className="flex flex-col gap-1.5 text-[13px] text-slate-600 dark:text-zinc-400">
              {t.footer.promises.map((label, index) => {
                const Icon = PROMISE_ICONS[index];
                return (
                <li key={label} className="flex items-center gap-2">
                  <Icon className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  {label}
                </li>
                );
              })}
            </ul>
          </div>
          {columns(t).map((column) => (
            <nav key={column.title} aria-label={column.title} className="space-y-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-zinc-400">{column.title}</h2>
              <ul className="space-y-2 text-[13px]">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={href(link.href)} className="text-slate-700 transition-colors hover:text-blue-700 dark:text-zinc-300 dark:hover:text-blue-400">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="flex flex-col gap-2 border-t border-slate-200/80 dark:border-zinc-800 py-6 text-[12px] text-slate-500 dark:text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © <span suppressHydrationWarning>{new Date().getFullYear()}</span> {SITE_NAME} · {SITE_HOST}
          </p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>{t.footer.randomness}</span>
            {ANALYTICS_ENABLED && (
              <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))} className="cursor-pointer underline underline-offset-2 hover:text-slate-900 dark:hover:text-zinc-100">
                {t.footer.cookieSettings}
              </button>
            )}
          </p>
        </div>
      </div>
    </footer>
  );
}
