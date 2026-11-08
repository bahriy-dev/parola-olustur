'use client';

import { Button } from '@/components/ui/form';
import { useLocale } from '@/lib/i18n';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();
  return (
    <div className="mx-auto max-w-4xl space-y-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">{t.error.title}</h1>
      <p className="text-[15px] text-slate-600 dark:text-zinc-400">{t.error.text}</p>
      {process.env.NODE_ENV === 'development' && error?.message && (
        <pre className="max-h-32 overflow-auto rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900 p-3 font-mono text-xs text-red-700 dark:text-red-300">{error.message}</pre>
      )}
      <Button variant="primary" onClick={reset}>{t.error.retry}</Button>
    </div>
  );
}
