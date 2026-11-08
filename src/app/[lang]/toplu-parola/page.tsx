'use client';

import { Button,CopyButton,Field,Notice,PageHeader,Segmented,Select } from '@/components/ui/form';
import { generateBulk } from '@/lib/bulk';
import { useLocale } from '@/lib/i18n';
import { localizeMessage } from '@/lib/i18n/messages';
import type { BulkPasswordItem,GenerationMode } from '@/types/password';
import { Download,RotateCw } from 'lucide-react';
import { useCallback,useEffect,useState } from 'react';

const MODE_VALUES = ['random', 'passphrase', 'pin'] as const;

export default function BulkPasswordPage() {
  const { lang, t } = useLocale();
  const b = t.bulk;
  const [count, setCount] = useState(20);
  const [mode, setMode] = useState<GenerationMode>('random');
  const [length, setLength] = useState(20);
  const [items, setItems] = useState<BulkPasswordItem[]>([]);
  const [error, setError] = useState('');

  const generate = useCallback(() => {
    try {
      setError('');
      setItems(
        generateBulk(count, mode, {
          randomOptions: { length, lowercase: true, uppercase: true, numbers: true, symbols: true, excludeSimilar: false, noAdjacentDuplicates: false, requireEachCategory: true, customCharset: '', excludedChars: '' },
          passphraseOptions: { wordCount: 5, separator: '-', capitalize: true, addNumber: true, addSymbol: false, language: lang },
          pinOptions: { length: 6, allowRepeat: true, allowSequential: false, excludedDigits: '' },
        }),
      );
    } catch (e) {
      setItems([]);
      setError(e instanceof Error ? localizeMessage(e.message, lang) : b.failed);
    }
  }, [count, mode, length, lang, b.failed]);

  useEffect(() => {
    const timer = setTimeout(generate, 0);
    return () => clearTimeout(timer);
  }, [generate]);

  const all = items.map((i) => i.password).join('\n');

  const download = () => {
    const url = URL.createObjectURL(new Blob([all + '\n'], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = b.fileName(items.length);
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader title={b.title} description={b.description} />

      <section aria-label={t.generator.settings} className="space-y-4 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:shadow-none p-5 sm:p-6">
        <Segmented label={t.generator.modeLabel} value={mode} options={MODE_VALUES.map((value) => ({ value, label: t.generator.modes[value] }))} onChange={setMode} />
        <div className="flex flex-wrap items-end gap-4">
          <Field label={b.count} htmlFor="bulk-count" className="min-w-32 flex-1 sm:w-40 sm:flex-none">
            <Select id="bulk-count" value={count} onChange={(e) => setCount(Number(e.target.value))}>
              {[5, 10, 20, 50, 100, 250, 500].map((n) => <option key={n} value={n}>{n}</option>)}
            </Select>
          </Field>
          {mode === 'random' && (
            <Field label={b.length} htmlFor="bulk-length" className="min-w-32 flex-1 sm:w-40 sm:flex-none">
              <Select id="bulk-length" value={length} onChange={(e) => setLength(Number(e.target.value))}>
                {[12, 16, 20, 24, 32, 48, 64].map((n) => <option key={n} value={n}>{b.lengthOption(n)}</option>)}
              </Select>
            </Field>
          )}
          <div className="ml-auto flex flex-wrap gap-2">
            <Button onClick={generate}>
              <RotateCw className="size-4" aria-hidden />
              {t.generator.regenerate}
            </Button>
            <Button onClick={download} disabled={!items.length}>
              <Download className="size-4" aria-hidden />
              {b.download}
            </Button>
            <CopyButton value={all} size="md" variant="primary" label={b.copyAll} />
          </div>
        </div>
        <p className="text-[13px] text-slate-600 dark:text-zinc-400">
          {b.notes[mode]}{' '}
          {b.otherSettings}
        </p>
      </section>

      {error && <Notice tone="error">{error}</Notice>}

      {items.length > 0 && (
        <ol aria-label={b.list} className="divide-y divide-slate-200 dark:divide-zinc-800 overflow-hidden rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:shadow-none">
          {items.map((item, index) => (
            <li key={item.id} className="flex items-center gap-3 px-3 py-2 sm:px-4">
              <span className="w-8 shrink-0 text-right text-[13px] tabular-nums text-slate-500 dark:text-zinc-400">{index + 1}</span>
              <span className="min-w-0 flex-1 select-all break-all font-mono text-sm text-slate-900 dark:text-zinc-100">{item.password}</span>
              <span className="hidden shrink-0 text-[13px] tabular-nums text-slate-600 dark:text-zinc-400 sm:inline">{item.entropyBits} bit</span>
              <CopyButton value={item.password} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
