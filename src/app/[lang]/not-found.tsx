'use client';

import { useLocale } from '@/lib/i18n';
import { SITE_NAME } from '@/lib/site';
import Link from 'next/link';

// Rendered inside the [lang] root layout, so the locale (and with it every string) comes from the URL.
export default function NotFound() {
  const { t, href } = useLocale();
  return (
    <div className="mx-auto max-w-4xl space-y-4 py-12">
      <title>{`${t.notFound.metaTitle} | ${SITE_NAME}`}</title>
      <meta name="robots" content="noindex, follow" />
      <p className="text-sm font-medium text-slate-600 dark:text-zinc-400">404</p>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">{t.notFound.title}</h1>
      <p className="text-[15px] text-slate-600 dark:text-zinc-400">{t.notFound.text}</p>
      <div className="flex flex-wrap gap-2 pt-2">
        <Link href={href('/')} className="inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700">{t.notFound.generator}</Link>
        <Link href={href('/araclar')} className="inline-flex h-10 items-center rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 text-sm font-medium text-slate-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800">{t.notFound.allTools}</Link>
      </div>
    </div>
  );
}
