'use client';

import { useLocale } from '@/lib/i18n';
import { AlertTriangle,Check,CheckCircle2,Copy,Info,XCircle } from 'lucide-react';
import { cloneElement,forwardRef,isValidElement,useId,useState,type ButtonHTMLAttributes,type KeyboardEvent,type InputHTMLAttributes,type ReactNode,type SelectHTMLAttributes,type TextareaHTMLAttributes } from 'react';

// Shared form vocabulary: every tool composes these so spacing, focus and type stay consistent.

const control =
  'w-full rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950/40 px-3 py-2 text-sm text-slate-900 dark:text-zinc-100 shadow-[0_1px_2px_rgba(15,23,42,0.04)] placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-[border-color,box-shadow] hover:border-slate-400 dark:hover:border-zinc-600 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-600/10 dark:focus:ring-blue-500/20 focus-visible:outline-none disabled:opacity-60';

export const controlClass = control;

/** Selected state for toggle chips (presets, filters): a blue tint that matches the primary action colour. */
export const selectedClass = 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-200';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white shadow-[0_1px_2px_rgba(37,99,235,0.3),inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-blue-700 dark:hover:bg-blue-500',
  secondary: 'border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 shadow-[0_1px_2px_rgba(15,23,42,0.05)] hover:border-slate-400 hover:bg-slate-50 dark:hover:border-zinc-600 dark:hover:bg-zinc-800',
  ghost: 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800',
};

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: 'sm' | 'md' }>(
  function Button({ variant = 'secondary', size = 'md', className = '', type = 'button', ...props }, ref) {
    const sizing = size === 'sm' ? 'h-8 px-2.5 text-[13px] gap-1.5' : 'h-10 px-4 text-sm gap-2';
    return (
      <button
        ref={ref}
        type={type}
        className={`inline-flex shrink-0 items-center justify-center rounded-lg font-medium transition-[color,background-color,border-color,transform] active:translate-y-px cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0 ${sizing} ${buttonVariants[variant]} ${className}`}
        {...props}
      />
    );
  },
);

/** Label + control + hint/error, with the hint or error tied to the control via aria-describedby. */
export function Field({ label, hint, error, children, htmlFor, className = '' }: { label: ReactNode; hint?: ReactNode; error?: ReactNode; children: ReactNode; htmlFor?: string; className?: string }) {
  const describedBy = htmlFor && (error ? `${htmlFor}-error` : hint ? `${htmlFor}-hint` : undefined);
  const control =
    describedBy && isValidElement<{ 'aria-describedby'?: string }>(children)
      ? cloneElement(children, { 'aria-describedby': [children.props['aria-describedby'], describedBy].filter(Boolean).join(' ') })
      : children;
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-800 dark:text-zinc-200">
        {label}
      </label>
      {control}
      {error ? (
        <p role="alert" id={htmlFor ? `${htmlFor}-error` : undefined} className="text-[13px] text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p id={htmlFor ? `${htmlFor}-hint` : undefined} className="text-[13px] text-slate-600 dark:text-zinc-400">{hint}</p>
      ) : null}
    </div>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }>(
  function TextInput({ className = '', mono, ...props }, ref) {
    return <input ref={ref} className={`${control} h-10 ${mono ? 'font-mono' : ''} ${className}`} {...props} />;
  },
);

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { mono?: boolean }>(
  function TextArea({ className = '', mono, rows = 4, ...props }, ref) {
    return <textarea ref={ref} rows={rows} className={`${control} resize-y leading-relaxed ${mono ? 'font-mono' : ''} ${className}`} {...props} />;
  },
);

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${control} h-10 pr-8 cursor-pointer ${className}`} {...props} />;
}

export function Checkbox({ label, hint, checked, onChange, disabled }: { label: ReactNode; hint?: ReactNode; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
  const id = useId();
  return (
    <div className="flex items-start gap-2.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-5 shrink-0 rounded sm:size-4 border-slate-300 dark:border-zinc-600 accent-blue-600 cursor-pointer"
      />
      <label htmlFor={id} className="text-sm text-slate-800 dark:text-zinc-200 cursor-pointer select-none leading-snug">
        {label}
        {hint && <span className="block text-[13px] text-slate-600 dark:text-zinc-400">{hint}</span>}
      </label>
    </div>
  );
}

/**
 * Keyboard model for a role="radiogroup" of buttons: arrows/Home/End move focus and selection together,
 * and only the checked radio is in the tab order (WAI-ARIA radio group pattern).
 */
export function radioGroupKeyDown<T>(e: KeyboardEvent<HTMLElement>, values: readonly T[], value: T, onChange: (value: T) => void) {
  const index = values.indexOf(value);
  const next =
    e.key === 'ArrowRight' || e.key === 'ArrowDown' ? (index + 1) % values.length
    : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? (index - 1 + values.length) % values.length
    : e.key === 'Home' ? 0
    : e.key === 'End' ? values.length - 1
    : -1;
  if (next < 0) return;
  e.preventDefault();
  onChange(values[next]);
  e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
}

/** Single-choice switcher used for modes (tabs) and small option sets. */
export function Segmented<T extends string>({ value, options, onChange, label, size = 'md' }: { value: T; options: readonly { value: T; label: ReactNode }[]; onChange: (value: T) => void; label: string; size?: 'sm' | 'md' }) {
  const values = options.map((o) => o.value);
  const focusable = values.includes(value) ? value : values[0];
  return (
    <div role="radiogroup" aria-label={label} onKeyDown={(e) => radioGroupKeyDown(e, values, value, onChange)} className="inline-flex max-w-full flex-wrap gap-0.5 rounded-lg bg-slate-100 dark:bg-zinc-800/80 p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={option.value === focusable ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={`whitespace-nowrap rounded-md font-medium transition-colors cursor-pointer ${size === 'sm' ? 'px-2.5 py-1 text-[13px]' : 'px-3 py-1.5 text-sm'} ${
              active
                ? 'bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 shadow-[0_1px_3px_rgba(15,23,42,0.1),0_0_0_1px_rgba(15,23,42,0.04)]'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function CopyButton({ value, label, size = 'sm', variant = 'secondary', className = '' }: { value: string; label?: string; size?: 'sm' | 'md'; variant?: ButtonVariant; className?: string }) {
  const { t } = useLocale();
  const [state, setState] = useState<'idle' | 'done' | 'failed'>('idle');
  return (
    <Button
      size={size}
      variant={variant}
      className={className}
      disabled={!value}
      onClick={async () => {
        const ok = await copyText(value);
        setState(ok ? 'done' : 'failed');
        setTimeout(() => setState('idle'), 1600);
      }}
    >
      {state === 'done' ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      <span aria-live="polite">{state === 'done' ? t.common.copied : state === 'failed' ? t.common.copyFailed : label ?? t.common.copy}</span>
    </Button>
  );
}

/** Read-only result: selectable monospace text that wraps instead of overflowing. */
export function OutputBlock({ label, value, rows, actions }: { label: string; value: string; rows?: number; actions?: ReactNode }) {
  const id = useId();
  const lineCount = rows ?? Math.min(12, Math.max(2, value.split('\n').length + Math.floor(value.length / 90)));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-slate-800 dark:text-zinc-200">
          {label}
        </label>
        <div className="flex items-center gap-1.5">
          {actions}
          <CopyButton value={value} />
        </div>
      </div>
      <textarea
        id={id}
        readOnly
        rows={lineCount}
        value={value}
        onFocus={(e) => e.currentTarget.select()}
        className={`${control} resize-y font-mono text-[13px] leading-relaxed bg-slate-50! dark:bg-zinc-950! break-all`}
      />
    </div>
  );
}

const NOTICE_TONES = {
  info: { box: 'border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300', icon: Info, iconClass: 'text-slate-500 dark:text-zinc-400' },
  warning: { box: 'border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200', icon: AlertTriangle, iconClass: 'text-amber-600 dark:text-amber-400' },
  error: { box: 'border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300', icon: XCircle, iconClass: 'text-red-600 dark:text-red-400' },
  success: { box: 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200', icon: CheckCircle2, iconClass: 'text-emerald-600 dark:text-emerald-400' },
};

export function Notice({ tone = 'info', children, role }: { tone?: 'info' | 'warning' | 'error' | 'success'; children: ReactNode; role?: 'status' | 'alert' }) {
  const { box, icon: Icon, iconClass } = NOTICE_TONES[tone];
  return (
    <div role={role ?? (tone === 'error' ? 'alert' : undefined)} className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm leading-relaxed ${box}`}>
      <Icon className={`mt-0.5 size-4 shrink-0 ${iconClass}`} aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Keyboard key hint, e.g. <Kbd>R</Kbd>. */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-1 font-sans text-[11px] font-medium text-slate-600 dark:text-zinc-400 shadow-[0_1px_0_rgba(15,23,42,0.06)]">
      {children}
    </kbd>
  );
}

/** Page-level heading block shared by every route: one H1, optional lead paragraph and meta row. */
export function PageHeader({ title, description, meta }: { title: ReactNode; description?: ReactNode; meta?: ReactNode }) {
  return (
    <header className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-[-0.02em] text-slate-950 dark:text-white sm:text-[1.75rem] sm:leading-tight">{title}</h1>
      {description && <p className="max-w-2xl text-[15px] leading-relaxed text-slate-600 dark:text-zinc-400">{description}</p>}
      {meta && <div className="flex flex-wrap items-center gap-2 pt-1 text-[13px] text-slate-600 dark:text-zinc-400">{meta}</div>}
    </header>
  );
}

/** Small neutral label, e.g. the standard a tool implements. */
export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-zinc-400">
      {children}
    </span>
  );
}

/** Raised surface for a tool or settings group. */
export const panelClass =
  'rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_1px_6px_-2px_rgba(15,23,42,0.06)] dark:shadow-none';

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`${panelClass} ${className}`}>{children}</section>;
}
