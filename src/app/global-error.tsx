'use client';

import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="tr">
      <body className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 px-4 font-sans antialiased">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-rose-500 to-orange-500">
              Hata
            </h1>
            <p className="text-sm font-mono text-slate-600 dark:text-zinc-400 uppercase tracking-widest">
              Beklenmeyen Bir Sorun Oluştu
            </p>
          </div>

          <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
            İşlem sırasında beklenmeyen bir hata meydana geldi. Lütfen tekrar deneyin.
          </p>

          {process.env.NODE_ENV === 'development' && error?.message && (
            <pre className="text-xs text-left bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 overflow-auto max-h-40 font-mono text-rose-700 dark:text-rose-300">
              {error.message}
            </pre>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
            >
              <span>↻</span>
              <span>Tekrar Dene</span>
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <span>←</span>
              <span>Ana Sayfaya Dön</span>
            </Link>
          </div>

          <p className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 pt-4">
            Parola Oluştur &bull; parolaolustur.com
          </p>
        </div>
      </body>
    </html>
  );
}
