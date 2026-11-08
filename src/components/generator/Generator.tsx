'use client';

import { Button,Checkbox,Field,Kbd,Notice,OutputBlock,Segmented,Select,TextInput,copyText,panelClass,selectedClass } from '@/components/ui/form';
import { generatePassphrase,generatePin,generateRandomPassword } from '@/lib/crypto';
import { analyzePassword } from '@/lib/entropy';
import { buildSnippet,SNIPPET_LANGUAGES,type SnippetLanguage } from '@/lib/snippets';
import { ENGLISH_WORDS,TURKISH_WORDS } from '@/lib/wordlists';
import type { GenerationMode,PassphraseOptions,PinOptions,RandomPasswordOptions,StrengthLevel } from '@/types/password';
import { Check,ChevronDown,ChevronRight,Copy,Eye,EyeOff,RotateCw } from 'lucide-react';
import { useLocale } from '@/lib/i18n';
import { localizeMessage } from '@/lib/i18n/messages';
import Link from 'next/link';
import { useCallback,useEffect,useMemo,useState,type CSSProperties,type ReactNode } from 'react';

type OutputFormat = 'plain' | 'hex' | 'base64' | 'base64url';

const DEFAULT_RANDOM: RandomPasswordOptions = {
  length: 20, lowercase: true, uppercase: true, numbers: true, symbols: true,
  excludeSimilar: false, noAdjacentDuplicates: false, requireEachCategory: true, customCharset: '', excludedChars: '',
};
const DEFAULT_PASSPHRASE: PassphraseOptions = { wordCount: 5, separator: '-', capitalize: true, addNumber: true, addSymbol: false, language: 'tr' };
const DEFAULT_PIN: PinOptions = { length: 6, allowRepeat: true, allowSequential: false, excludedDigits: '' };

const PRESETS: Record<'env' | 'db' | 'long', { options: Partial<RandomPasswordOptions> }> = {
  env: { options: { length: 32, symbols: false, excludeSimilar: false, noAdjacentDuplicates: false, excludedChars: '' } },
  db: { options: { length: 24, symbols: true, excludeSimilar: true, noAdjacentDuplicates: true, excludedChars: '"\'`@/:\\' } },
  long: { options: { length: 64, symbols: true, excludeSimilar: false, noAdjacentDuplicates: false, excludedChars: '' } },
};

const STRENGTH: Record<StrengthLevel, { text: string; bar: string; filled: number }> = {
  weak: { text: 'text-red-700 dark:text-red-400', bar: 'bg-red-600', filled: 1 },
  medium: { text: 'text-amber-700 dark:text-amber-400', bar: 'bg-amber-500', filled: 2 },
  strong: { text: 'text-emerald-700 dark:text-emerald-400', bar: 'bg-emerald-600', filled: 3 },
  very_strong: { text: 'text-emerald-700 dark:text-emerald-400', bar: 'bg-emerald-600', filled: 4 },
};

const MODE_VALUES = ['random', 'passphrase', 'pin'] as const;

function toFormat(raw: string, format: OutputFormat): string {
  if (!raw || format === 'plain') return raw;
  const bytes = new TextEncoder().encode(raw);
  if (format === 'hex') return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  const b64 = btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(''));
  return format === 'base64' ? b64 : b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Digits and symbols get a quiet tint so 0/O and l/1 are easier to tell apart when reading aloud. */
function Characters({ value }: { value: string }) {
  return (
    <>
      {Array.from(value).map((char, index) => (
        <span key={index} className={/[0-9]/.test(char) ? 'text-blue-700 dark:text-blue-300' : /[A-Za-z]/.test(char) ? undefined : 'text-amber-700 dark:text-amber-300'}>
          {char}
        </span>
      ))}
    </>
  );
}

function LengthControl({ label, value, min, max, presets, unit, onChange }: { label: string; value: number; min: number; max: number; presets: number[]; unit: string; onChange: (value: number) => void }) {
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n)));
  // Typed text is kept as a draft so intermediate values ("1" on the way to "12") are not clamped mid-keystroke.
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft !== null && draft.trim() !== '' && Number.isFinite(Number(draft))) onChange(clamp(Number(draft)));
    setDraft(null);
  };
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={`len-${label}`} className="text-sm font-medium text-slate-800 dark:text-zinc-200">
          {label}
        </label>
        <div className="flex items-center gap-1">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onChange(preset)}
              aria-pressed={value === preset}
              className={`h-9 min-w-9 rounded border px-1.5 text-[13px] tabular-nums cursor-pointer transition-colors sm:h-7 sm:min-w-8 ${value === preset ? selectedClass : 'border-transparent text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'}`}
            >
              {preset}
            </button>
          ))}
          <TextInput
            id={`len-${label}`}
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            value={draft ?? value}
            onChange={(e) => {
              const next = e.target.value;
              setDraft(next);
              const n = Number(next);
              if (next !== '' && Number.isInteger(n) && n >= min && n <= max) onChange(n);
            }}
            onBlur={commit}
            onKeyDown={(e) => e.key === 'Enter' && commit()}
            className="h-9! ml-1 w-16 px-2 text-right tabular-nums sm:h-7!"
            aria-describedby={`len-${label}-unit`}
          />
          <span id={`len-${label}-unit`} className="text-[13px] text-slate-600 dark:text-zinc-400">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        style={{ '--fill': `${((value - min) / (max - min)) * 100}%` } as CSSProperties}
        className="w-full"
      />
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-slate-800 dark:text-zinc-200">{title}</legend>
      {children}
    </fieldset>
  );
}

export function Generator({ initialMode = 'random', heading }: { initialMode?: GenerationMode; heading: ReactNode }) {
  const { lang, t, href } = useLocale();
  const g = t.generator;
  const [mode, setMode] = useState<GenerationMode>(initialMode);
  const [randomOptions, setRandomOptions] = useState(DEFAULT_RANDOM);
  const [passphraseOptions, setPassphraseOptions] = useState<PassphraseOptions>({ ...DEFAULT_PASSPHRASE, language: lang });
  const [pinOptions, setPinOptions] = useState(DEFAULT_PIN);
  const [format, setFormat] = useState<OutputFormat>('plain');
  // The value remembers which mode produced it, so a mode switch never pairs the old value with the new mode's analysis.
  const [generated, setGenerated] = useState<{ mode: GenerationMode; value: string }>({ mode: initialMode, value: '' });
  const password = generated.mode === mode ? generated.value : '';
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const [snippetLanguage, setSnippetLanguage] = useState<SnippetLanguage>('dotenv');
  const [nonce, setNonce] = useState(0);

  const random = (patch: Partial<RandomPasswordOptions>) => setRandomOptions((o) => ({ ...o, ...patch }));
  const passphrase = (patch: Partial<PassphraseOptions>) => setPassphraseOptions((o) => ({ ...o, ...patch }));
  const pin = (patch: Partial<PinOptions>) => setPinOptions((o) => ({ ...o, ...patch }));

  // Regenerate whenever settings change (nonce forces a fresh value with the same settings).
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setError('');
        setGenerated({ mode, value: mode === 'random' ? generateRandomPassword(randomOptions) : mode === 'passphrase' ? generatePassphrase(passphraseOptions) : generatePin(pinOptions) });
      } catch (e) {
        setGenerated({ mode, value: '' });
        setError(e instanceof Error ? localizeMessage(e.message, lang) : g.failed);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [mode, randomOptions, passphraseOptions, pinOptions, nonce, lang, g.failed]);

  const analysis = useMemo(() => analyzePassword(password, mode, { randomOptions, passphraseOptions, pinOptions }), [password, mode, randomOptions, passphraseOptions, pinOptions]);
  const displayed = useMemo(() => toFormat(password, format), [password, format]);
  const strength = STRENGTH[analysis.strengthLevel];

  const regenerate = useCallback(() => setNonce((n) => n + 1), []);
  const copy = useCallback(async () => {
    if (!displayed) return;
    if (await copyText(displayed)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  }, [displayed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) return;
      if (e.key === 'r' || e.key === 'R') regenerate();
      else if (e.key === 'c' || e.key === 'C') copy();
      else if (e.key === 'h' || e.key === 'H') setVisible((v) => !v);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [regenerate, copy]);

  const byteLength = new TextEncoder().encode(displayed).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        {heading}
        <Segmented label={g.modeLabel} value={mode} options={MODE_VALUES.map((value) => ({ value, label: g.modes[value] }))} onChange={setMode} />
      </div>

      {/* 1. Result */}
      <section aria-label={g.output} className={panelClass}>
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          <output
            aria-live="polite"
            aria-label={g.outputLabel}
            className="min-h-10 min-w-0 flex-1 select-all break-all font-mono text-[1.375rem] leading-snug tracking-[0.02em] text-slate-950 dark:text-white sm:text-[1.625rem]"
          >
            {!displayed ? <span className="text-base text-slate-500">—</span> : visible ? format === 'plain' ? <Characters value={displayed} /> : displayed : <span aria-label={g.hidden}>{'•'.repeat(Math.min(displayed.length, 40))}</span>}
          </output>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button variant="secondary" onClick={() => setVisible((v) => !v)} aria-label={visible ? t.common.hide : t.common.show} title={`${visible ? t.common.hide : t.common.show} (H)`} className="w-10 px-0!">
              {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
            <Button variant="secondary" onClick={regenerate} title={g.regenerateTitle}>
              <RotateCw className="size-4" aria-hidden />
              <span>{g.regenerate}</span>
            </Button>
            <Button variant="primary" onClick={copy} disabled={!displayed} title={g.copyTitle}>
              {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              <span aria-live="polite">{copied ? t.common.copied : t.common.copy}</span>
            </Button>
          </div>
        </div>

        {/* 3. Measurements, kept to one line of text */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-b-xl border-t border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/30 px-5 py-3 text-[13px] text-slate-600 dark:text-zinc-400 sm:px-6">
          <span className="flex items-center gap-2.5">
            <span className="flex gap-1" aria-hidden>
              {[1, 2, 3, 4].map((i) => (
                <span key={i} className={`h-1.5 w-6 rounded-full transition-colors ${password && i <= strength.filled ? strength.bar : 'bg-slate-200 dark:bg-zinc-700'}`} />
              ))}
            </span>
            <span className={`font-medium ${password ? strength.text : ''}`}>{password ? g.strength[analysis.strengthLevel] : '—'}</span>
          </span>
          <span title={g.entropyTitle}>
            <span className="tabular-nums text-slate-900 dark:text-zinc-100">{analysis.entropyBits}</span> {g.entropy}
          </span>
          <span><span className="tabular-nums text-slate-900 dark:text-zinc-100">{Array.from(displayed).length}</span> {g.characters} · {byteLength} {t.common.bytes}</span>
          {mode === 'passphrase' && <span>{g.wordList(passphraseOptions.language === 'en' ? ENGLISH_WORDS.length : TURKISH_WORDS.length)}</span>}
          <span className="ml-auto hidden items-center gap-3 lg:flex" aria-hidden>
            <span className="flex items-center gap-1.5"><Kbd>R</Kbd> {g.keys.r}</span>
            <span className="flex items-center gap-1.5"><Kbd>C</Kbd> {g.keys.c}</span>
            <span className="flex items-center gap-1.5"><Kbd>H</Kbd> {g.keys.h}</span>
          </span>
        </div>

        {error && (
          <div className="px-5 pb-5 sm:px-6">
            <Notice tone="error">{error}</Notice>
          </div>
        )}
      </section>

      {/* 2. Settings */}
      <section aria-label={g.settings} className={`${panelClass} p-5 sm:p-6`}>
        {mode === 'random' && (
          <div className="space-y-6">
            <LengthControl label={g.length} unit={g.unitChars} value={randomOptions.length} min={4} max={128} presets={[12, 16, 20, 32, 64]} onChange={(length) => random({ length })} />
            <Group title={g.charGroup}>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Checkbox label={g.upper} hint="A–Z" checked={randomOptions.uppercase} onChange={(uppercase) => random({ uppercase })} />
                <Checkbox label={g.lower} hint="a–z" checked={randomOptions.lowercase} onChange={(lowercase) => random({ lowercase })} />
                <Checkbox label={g.digits} hint="0–9" checked={randomOptions.numbers} onChange={(numbers) => random({ numbers })} />
                <Checkbox label={g.symbols} hint="!@#$%^&*…" checked={randomOptions.symbols} onChange={(symbols) => random({ symbols })} />
              </div>
            </Group>
            <details className="group border-t border-slate-200 dark:border-zinc-800 pt-4">
              <summary className="flex cursor-pointer select-none list-none items-center gap-1.5 text-sm font-medium text-slate-800 dark:text-zinc-200 [&::-webkit-details-marker]:hidden">
                <ChevronRight className="size-4 text-slate-500 transition-transform group-open:rotate-90" aria-hidden />
                {g.advanced}
              </summary>
              <div className="mt-4 grid gap-5 lg:grid-cols-2">
                <div className="space-y-3">
                  <Checkbox label={g.requireEach} checked={randomOptions.requireEachCategory} onChange={(requireEachCategory) => random({ requireEachCategory })} />
                  <Checkbox label={g.excludeSimilar} hint="i l 1 L o 0 O" checked={randomOptions.excludeSimilar} onChange={(excludeSimilar) => random({ excludeSimilar })} />
                  <Checkbox label={g.noAdjacent} checked={randomOptions.noAdjacentDuplicates} onChange={(noAdjacentDuplicates) => random({ noAdjacentDuplicates })} />
                </div>
                <div className="space-y-4">
                  <Field label={g.excluded} htmlFor="excluded-chars" hint={g.excludedHint}>
                    <TextInput id="excluded-chars" mono value={randomOptions.excludedChars} onChange={(e) => random({ excludedChars: e.target.value })} placeholder={g.optionalPlaceholder} autoComplete="off" spellCheck={false} />
                  </Field>
                  <Field label={g.customCharset} htmlFor="custom-charset" hint={g.customCharsetHint}>
                    <TextInput id="custom-charset" mono value={randomOptions.customCharset} onChange={(e) => random({ customCharset: e.target.value })} placeholder={g.customCharsetPlaceholder} autoComplete="off" spellCheck={false} />
                  </Field>
                  <Field label={g.preset} htmlFor="preset">
                    <Select id="preset" value="" onChange={(e) => e.target.value && random({ ...DEFAULT_RANDOM, ...PRESETS[e.target.value as keyof typeof PRESETS].options })}>
                      <option value="">{g.presetChoose}</option>
                      {(Object.keys(PRESETS) as (keyof typeof PRESETS)[]).map((key) => (
                        <option key={key} value={key}>{g.presets[key]}</option>
                      ))}
                    </Select>
                  </Field>
                </div>
              </div>
            </details>
          </div>
        )}

        {mode === 'passphrase' && (
          <div className="space-y-6">
            <LengthControl label={g.wordCount} unit={g.unitWords} value={passphraseOptions.wordCount} min={3} max={10} presets={[4, 5, 6, 8]} onChange={(wordCount) => passphrase({ wordCount })} />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={g.wordListLabel} htmlFor="wordlist">
                <Select id="wordlist" value={passphraseOptions.language} onChange={(e) => passphrase({ language: e.target.value as 'tr' | 'en' })}>
                  <option value="tr">{g.turkishList(TURKISH_WORDS.length)}</option>
                  <option value="en">{g.englishList(ENGLISH_WORDS.length)}</option>
                </Select>
              </Field>
              <div className="space-y-1.5">
                <span className="block text-sm font-medium text-slate-800 dark:text-zinc-200">{g.separator}</span>
                <Segmented
                  label={g.separator}
                  value={passphraseOptions.separator}
                  onChange={(separator) => passphrase({ separator })}
                  options={[
                    { value: '-', label: <span className="font-mono">-</span> },
                    { value: '.', label: <span className="font-mono">.</span> },
                    { value: '_', label: <span className="font-mono">_</span> },
                    { value: ' ', label: g.space },
                  ]}
                />
              </div>
            </div>
            <Group title={g.extras}>
              <div className="grid gap-3 sm:grid-cols-3">
                <Checkbox label={g.capitalize} checked={passphraseOptions.capitalize} onChange={(capitalize) => passphrase({ capitalize })} />
                <Checkbox label={g.addNumber} hint="100–999" checked={passphraseOptions.addNumber} onChange={(addNumber) => passphrase({ addNumber })} />
                <Checkbox label={g.addSymbol} hint="!@#$%&*" checked={passphraseOptions.addSymbol} onChange={(addSymbol) => passphrase({ addSymbol })} />
              </div>
            </Group>
          </div>
        )}

        {mode === 'pin' && (
          <div className="space-y-6">
            <LengthControl label={g.pinLength} unit={g.unitDigits} value={pinOptions.length} min={4} max={32} presets={[4, 6, 8, 12]} onChange={(length) => pin({ length })} />
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-3">
                <Checkbox label={g.allowRepeat} hint={g.allowRepeatHint} checked={pinOptions.allowRepeat} onChange={(allowRepeat) => pin({ allowRepeat })} />
                <Checkbox label={g.allowSequential} hint={g.allowSequentialHint} checked={pinOptions.allowSequential} onChange={(allowSequential) => pin({ allowSequential })} />
              </div>
              <Field label={g.excludedDigits} htmlFor="excluded-digits">
                <TextInput id="excluded-digits" mono inputMode="numeric" value={pinOptions.excludedDigits} onChange={(e) => pin({ excludedDigits: e.target.value.replace(/\D/g, '') })} placeholder={g.optionalPlaceholder} autoComplete="off" />
              </Field>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-200 dark:border-zinc-800 pt-4">
          <div className="flex items-center gap-2">
            <label htmlFor="output-format" className="text-sm text-slate-700 dark:text-zinc-300">{g.outputFormat}</label>
            <Select id="output-format" value={format} onChange={(e) => setFormat(e.target.value as OutputFormat)} className="w-auto!">
              {(Object.keys(g.formats) as OutputFormat[]).map((value) => (
                <option key={value} value={value}>{g.formats[value]}</option>
              ))}
            </Select>
          </div>
          <Link href={href('/toplu-parola')} className="text-sm text-blue-700 dark:text-blue-400 hover:underline underline-offset-4">
            {g.bulkLink}
          </Link>
        </div>
      </section>

      <details className={`group ${panelClass} px-5 py-3.5 sm:px-6`}>
        <summary className="flex cursor-pointer select-none list-none items-center justify-between text-sm font-medium text-slate-800 dark:text-zinc-200 [&::-webkit-details-marker]:hidden">
          {g.codeTitle}
          <ChevronDown className="size-4 text-slate-500 transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <div className="mt-3 space-y-3 pb-1">
          <Segmented size="sm" label={g.codeLanguage} value={snippetLanguage} options={SNIPPET_LANGUAGES} onChange={setSnippetLanguage} />
          <OutputBlock label={g.code} value={password ? buildSnippet(snippetLanguage, password, lang) : ''} rows={3} />
          <p className="text-[13px] text-slate-600 dark:text-zinc-400">{g.codeNote}</p>
        </div>
      </details>
    </div>
  );
}
