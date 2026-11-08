import { SITE_NAME } from '@/lib/site';

/** Masked-password mark: two hidden characters and a caret. */
export function BrandMark({ className = 'size-8' }: { className?: string }) {
  return (
    <span aria-hidden className={`flex shrink-0 items-center justify-center rounded-[9px] bg-gradient-to-b from-slate-800 to-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_1px_2px_rgba(15,23,42,0.25)] dark:from-white dark:to-zinc-200 ${className}`}>
      <svg viewBox="0 0 20 20" className="size-[62%]">
        <circle cx="5" cy="10" r="1.9" className="fill-white dark:fill-slate-950" />
        <circle cx="10" cy="10" r="1.9" className="fill-white dark:fill-slate-950" />
        <rect x="13.4" y="5.5" width="1.8" height="9" rx="0.9" className="fill-blue-400 dark:fill-blue-600" />
      </svg>
    </span>
  );
}

/** Wordmark used in the header, mobile drawer and footer. */
export function BrandLogo() {
  return (
    <span className="flex items-center gap-2.5 select-none">
      <BrandMark />
      <span className="text-[15px] font-semibold tracking-[-0.015em] text-slate-950 dark:text-white">{SITE_NAME}</span>
    </span>
  );
}
