'use client';
import { Button,CopyButton,Field,Notice,Segmented,Select,TextArea,TextInput } from '@/components/ui/form';
import type { HashExecutionResult } from '@/lib/hash/engine';
import { identifyHash } from '@/lib/hash/identifier';
import { HASH_ALGORITHMS,HASH_CATEGORIES,type HashCategoryKey } from '@/lib/hash/registry';
import { equalText } from '@/lib/security';
import { useLocale } from '@/lib/i18n';
import { hashCategoryName } from '@/lib/i18n/hash-text';
import { localizeMessage } from '@/lib/i18n/messages';
import { workerJob } from '@/lib/worker-client';
import { useEffect,useId,useRef,useState } from 'react';

type Tab = 'single' | 'multi' | 'identify' | 'verify';
type Message = { tone: 'info' | 'success' | 'error'; text: string };

const TAB_VALUES = ['single', 'multi', 'identify', 'verify'] as const;

const MAX_FILE = 10 * 1024 * 1024;

export function MasterHashTool({ initialAlgorithm = 'sha-256', initialCategory, initialTab = 'single' }: { initialAlgorithm?: string; initialCategory?: HashCategoryKey; initialTab?: Tab }) {
  const { lang, t } = useLocale();
  const h = t.hash;
  const pool = HASH_ALGORITHMS.filter((a) => !initialCategory || a.category === initialCategory);
  const groups = HASH_CATEGORIES.map((c) => ({ ...c, name: hashCategoryName(c.key, lang), algorithms: pool.filter((a) => a.category === c.key) })).filter((g) => g.algorithms.length);
  // Slow password KDFs are excluded from multi-hash; a page whose pool has nothing else gets no multi tab.
  const multiGroups = groups.filter((g) => g.key !== 'parola-kdf');
  const multiSlugs = multiGroups.flatMap((g) => g.algorithms.map((a) => a.slug));
  const tabs = TAB_VALUES.filter((value) => value !== 'multi' || multiSlugs.length).map((value) => ({ value, label: h.tabs[value] }));

  const ids = { text: useId(), file: useId(), algorithm: useId(), key: useId(), expected: useId() };
  const [tab, setTab] = useState<Tab>(initialTab === 'multi' && !multiSlugs.length ? 'single' : initialTab);
  const [algorithm, setAlgorithm] = useState(initialAlgorithm);
  // Default selection is always drawn from the checkboxes this page actually shows.
  const [selected, setSelected] = useState(() =>
    [...new Set([...(initialCategory ? [initialAlgorithm] : ['sha-256', 'sha-512']), ...multiSlugs])].filter((slug) => multiSlugs.includes(slug)).slice(0, 2),
  );
  const [text, setText] = useState('');
  const [key, setKey] = useState('');
  const [expected, setExpected] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<HashExecutionResult[]>([]);
  const [identified, setIdentified] = useState<ReturnType<typeof identifyHash> | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [busy, setBusy] = useState(false);
  const job = useRef<AbortController | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => () => job.current?.abort(), []);

  // Every edit clears previous output so results always correspond to the current input.
  const invalidate = () => {
    job.current?.abort();
    job.current = null;
    setBusy(false);
    setResults([]);
    setIdentified(null);
    setMessage(null);
  };

  const active = tab === 'multi' ? HASH_ALGORITHMS.filter((a) => selected.includes(a.slug)) : HASH_ALGORITHMS.filter((a) => a.slug === algorithm);
  const needsKey = tab !== 'identify' && active.some((a) => a.requiresKey);

  async function run() {
    invalidate();
    const current = new AbortController();
    job.current = current;
    setBusy(true);
    try {
      if (tab === 'identify') {
        setIdentified(identifyHash(text.trim()));
        return;
      }
      if (tab === 'verify' && expected.trim().startsWith('$')) {
        if (file) throw new Error(h.kdfNeedsText);
        const value = await workerJob<string>({ tool: { id: 'hash-verifier', inputVal: text, secondaryInput: expected.trim(), tertiaryInput: '', mode: '', optionNumber: 0 } }, current.signal);
        if (job.current === current) setMessage({ tone: value === 'Eşleşmiyor' ? 'error' : 'success', text: value === 'Eşleşmiyor' ? h.mismatch : h.verified });
        return;
      }
      const input = file ? new Uint8Array(await file.arrayBuffer()) : text;
      const list = await workerJob<HashExecutionResult[]>({ hashes: { algorithms: tab === 'multi' ? selected : [algorithm], input, key } }, current.signal);
      if (job.current !== current) return;
      setResults(list);
      if (tab === 'verify') {
        const ok = equalText(list[0].hash, expected.trim().toLowerCase());
        setMessage({ tone: ok ? 'success' : 'error', text: ok ? h.verified : h.mismatch });
      }
    } catch (e) {
      if (job.current === current) setMessage({ tone: 'error', text: e instanceof Error ? localizeMessage(e.message, lang) : t.common.failed });
    } finally {
      if (job.current === current) setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <Segmented
        label={h.operation}
        value={tab}
        options={tabs}
        onChange={(next) => {
          invalidate();
          setTab(next);
        }}
      />

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) run();
        }}
      >
        <Field label={tab === 'identify' ? h.hashValue : tab === 'verify' ? h.textOrPassword : h.text} htmlFor={ids.text} hint={file ? h.fileIgnoresText : undefined}>
          <TextArea
            id={ids.text}
            rows={tab === 'identify' ? 2 : 4}
            mono={tab === 'identify'}
            maxLength={100000}
            value={text}
            placeholder={tab === 'identify' ? h.identifyPlaceholder : h.textPlaceholder}
            onChange={(e) => {
              invalidate();
              setText(e.target.value);
            }}
          />
        </Field>

        {tab !== 'identify' && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <input
              ref={fileInput}
              id={ids.file}
              type="file"
              aria-label={h.fileLabel}
              tabIndex={-1}
              className="sr-only"
              onChange={(e) => {
                invalidate();
                const f = e.target.files?.[0] ?? null;
                if (f && f.size > MAX_FILE) {
                  setFile(null);
                  setMessage({ tone: 'error', text: h.fileTooLarge });
                  e.target.value = '';
                } else setFile(f);
              }}
            />
            <Button size="sm" onClick={() => fileInput.current?.click()}>
              {file ? h.chooseOther : h.chooseFile}
            </Button>
            {file ? (
              <>
                <span className="min-w-0 truncate text-slate-700 dark:text-zinc-300">{file.name} · {file.size.toLocaleString(t.common.numberLocale)} {t.common.bytes}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    invalidate();
                    setFile(null);
                    if (fileInput.current) fileInput.current.value = '';
                  }}
                >
                  {h.remove}
                </Button>
              </>
            ) : (
              <span className="text-[13px] text-slate-600 dark:text-zinc-400">{h.fileHint}</span>
            )}
          </div>
        )}

        {tab === 'multi' ? (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-800 dark:text-zinc-200">{h.algorithms} <span className="font-normal text-slate-600 dark:text-zinc-400">{h.selected(selected.length)}</span></legend>
            <div className="space-y-3">
              {multiGroups.map((group) => (
                <div key={group.key}>
                  <p className="mb-1.5 text-[13px] text-slate-600 dark:text-zinc-400">{group.name}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3 lg:grid-cols-4">
                    {group.algorithms.map((a) => (
                      <label key={a.slug} className="flex items-center gap-2 text-sm text-slate-800 dark:text-zinc-200 cursor-pointer">
                        <input
                          type="checkbox"
                          className="size-5 accent-blue-600 sm:size-4"
                          checked={selected.includes(a.slug)}
                          onChange={(e) => {
                            invalidate();
                            setSelected(e.target.checked ? [...selected, a.slug] : selected.filter((x) => x !== a.slug));
                          }}
                        />
                        <span className="truncate">{a.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>
        ) : tab !== 'identify' ? (
          <Field label={h.algorithm} htmlFor={ids.algorithm} className="max-w-sm">
            <Select
              id={ids.algorithm}
              value={algorithm}
              onChange={(e) => {
                invalidate();
                setAlgorithm(e.target.value);
              }}
            >
              {groups.map((group) => (
                <optgroup key={group.key} label={group.name}>
                  {group.algorithms.map((a) => (
                    <option value={a.slug} key={a.slug}>{a.name}</option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </Field>
        ) : null}

        {needsKey && (
          <Field label={h.hmacKey} htmlFor={ids.key} className="max-w-xl">
            <TextInput id={ids.key} type="password" autoComplete="off" value={key} maxLength={4096} onChange={(e) => { invalidate(); setKey(e.target.value); }} />
          </Field>
        )}

        {tab === 'verify' && (
          <Field label={h.expected} htmlFor={ids.expected} hint={h.expectedHint}>
            <TextInput id={ids.expected} mono value={expected} maxLength={4096} onChange={(e) => { invalidate(); setExpected(e.target.value); }} />
          </Field>
        )}

        <div className="flex items-center gap-2">
          <Button type="submit" variant="primary" disabled={busy || (tab === 'multi' && !selected.length)}>
            {busy ? t.common.computing : h.actions[tab]}
          </Button>
          {busy && <Button variant="ghost" onClick={invalidate}>{t.common.cancel}</Button>}
        </div>
      </form>

      {message && <Notice tone={message.tone} role={message.tone === 'error' ? 'alert' : 'status'}>{message.text}</Notice>}

      {identified && (
        identified.length === 0 ? (
          <Notice role="status">{h.noMatch}</Notice>
        ) : (
          <ol className="divide-y divide-slate-200 dark:divide-zinc-800 rounded-md border border-slate-200 dark:border-zinc-800">
            {identified.map((m) => (
              <li key={m.algorithm.slug} className="flex flex-col gap-0.5 px-3 py-2.5 sm:flex-row sm:items-baseline sm:gap-4">
                <span className="text-sm font-medium text-slate-900 dark:text-zinc-100 sm:w-48">{m.algorithm.name}</span>
                <span className="text-[13px] text-slate-600 dark:text-zinc-400">{h.confidence}: {h.confidenceLevels[m.confidence] ?? m.confidence} · {localizeMessage(m.matchReason, lang)}</span>
              </li>
            ))}
          </ol>
        )
      )}

      {results.length > 0 && (
        <ul className="divide-y divide-slate-200 dark:divide-zinc-800 rounded-md border border-slate-200 dark:border-zinc-800">
          {results.map((r) => (
            <li key={r.algorithm} className="space-y-1.5 px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-900 dark:text-zinc-100">
                  {HASH_ALGORITHMS.find((a) => a.slug === r.algorithm)?.name ?? r.algorithm}{' '}
                  <span className="font-normal text-slate-600 dark:text-zinc-400">· {h.inputBytes(r.inputBytes.toLocaleString(t.common.numberLocale))}</span>
                </span>
                <CopyButton value={r.hash} />
              </div>
              <p className="select-all break-all font-mono text-[13px] leading-relaxed text-slate-800 dark:text-zinc-200">{r.hash}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
