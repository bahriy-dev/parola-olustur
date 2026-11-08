'use client';
import { Button,Field,Notice,OutputBlock,Segmented,TextArea,TextInput,CopyButton } from '@/components/ui/form';
import type { SecurityTool } from '@/lib/tools-registry';
import { workerJob } from '@/lib/worker-client';
import { Eye,EyeOff } from 'lucide-react';
import { useEffect,useId,useRef,useState } from 'react';
import { JwtDecoder } from './JwtDecoder';
import { TotpTool } from './TotpTool';
import { useLocale } from '@/lib/i18n';
import { localizeMessage } from '@/lib/i18n/messages';
import type { Locale } from '@/lib/i18n/routing';
import type { UiDictionary } from '@/lib/i18n/ui';
import { resolve,TOOL_UI,type InputKey,type InputSpec } from './tool-ui';
import { TOOL_UI_EN } from './tool-ui-en';

type Values = Record<Exclude<InputKey, 'optionNumber'>, string> & { optionNumber: number };

function SecretInput({ id, value, onChange, placeholder, mono }: { id: string; value: string; onChange: (value: string) => void; placeholder?: string; mono?: boolean }) {
  const [visible, setVisible] = useState(false);
  const { t } = useLocale();
  return (
    <div className="relative">
      <TextInput id={id} type={visible ? 'text' : 'password'} mono={mono} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete="off" spellCheck={false} maxLength={100000} className="pr-10" />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        aria-label={visible ? t.common.hide : t.common.show}
        aria-pressed={visible}
        className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1.5 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function InputField({ spec, mode, value, onChange }: { spec: InputSpec; mode: string; value: string | number; onChange: (value: string) => void }) {
  const id = useId();
  const { t } = useLocale();
  const label = resolve(spec.label, mode)!;
  const placeholder = resolve(spec.placeholder, mode);
  const labelNode = spec.optional ? <>{label} <span className="font-normal text-slate-500 dark:text-zinc-400">({t.common.optional})</span></> : label;
  return (
    <Field label={labelNode} htmlFor={id} hint={spec.hint}>
      {spec.kind === 'secret' ? (
        <SecretInput id={id} value={String(value)} onChange={onChange} placeholder={placeholder} mono={spec.mono} />
      ) : spec.kind === 'textarea' ? (
        <TextArea id={id} rows={spec.rows} mono={spec.mono} value={String(value)} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} spellCheck={false} maxLength={100000} />
      ) : spec.kind === 'number' ? (
        <TextInput id={id} type="number" inputMode="numeric" min={0} value={value} onChange={(e) => onChange(e.target.value)} className="max-w-48 tabular-nums" />
      ) : (
        <TextInput id={id} mono={spec.mono} value={String(value)} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete="off" spellCheck={false} maxLength={100000} />
      )}
    </Field>
  );
}

const NEGATIVE = /uyuşmuyor|eşleşmiyor|^farklı$/i;

/** Modes that undo each other: switching between them right after a run reuses the output as input. */
const INVERSE: Record<string, string> = { encrypt: 'decrypt', decrypt: 'encrypt', encode: 'decode', decode: 'encode' };
function verdictOf(toolId: string, result: string, t: UiDictionary, lang: Locale): { ok: boolean; text: string } {
  if (NEGATIVE.test(result.trim())) return { ok: false, text: toolId === 'match-checker' ? t.runner.passwordsDiffer : localizeMessage(result, lang) };
  if (toolId === 'hash-verifier' && /^(md5|sha1|sha256)$/.test(result)) return { ok: true, text: t.runner.matches(result.toUpperCase().replace('SHA', 'SHA-')) };
  if (toolId === 'match-checker') return { ok: true, text: t.runner.passwordsSame };
  return { ok: true, text: localizeMessage(result, lang) };
}

/** Value results are shown verbatim, except for tools whose output itself contains labels. */
const LABELLED_VALUES = new Set(['uuid-generator']);

/** Renders key/value JSON reports as a definition list, anything else as wrapped text. */
function Report({ label, value }: { label: string; value: string }) {
  let entries: [string, unknown][] | null = null;
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) entries = Object.entries(parsed);
  } catch { /* plain text report */ }
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-slate-800 dark:text-zinc-200">{label}</h3>
        <CopyButton value={value} />
      </div>
      <div className="rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 px-3 py-2.5 text-sm">
        {entries ? (
          <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5">
            {entries.map(([key, val]) => (
              <div key={key} className="contents">
                <dt className="text-slate-600 dark:text-zinc-400">{key}</dt>
                <dd className="min-w-0 break-all font-mono text-[13px] text-slate-900 dark:text-zinc-100">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="whitespace-pre-wrap break-words text-slate-800 dark:text-zinc-200">{value}</p>
        )}
      </div>
    </div>
  );
}

function JwtVerification({ value }: { value: string }) {
  const { t, lang } = useLocale();
  const parsed = JSON.parse(value) as { signature: boolean; claims: { valid: boolean; errors: string[] } };
  return (
    <div className="space-y-2">
      <Notice tone={parsed.signature ? 'success' : 'error'} role="status">
        <span className="font-medium">{t.runner.signature}</span> {parsed.signature ? t.runner.signatureValid : t.runner.signatureInvalid}
      </Notice>
      <Notice tone={parsed.claims.valid ? 'success' : 'warning'} role="status">
        <span className="font-medium">{t.runner.claims}</span> {parsed.claims.valid ? t.runner.claimsValid : localizeMessage(parsed.claims.errors.join(' '), lang)}
      </Notice>
    </div>
  );
}

export function ToolRunner({ tool }: { tool: SecurityTool }) {
  const { lang, t } = useLocale();
  const ui = (lang === 'en' ? TOOL_UI_EN : TOOL_UI)[tool.id];
  const [values, setValues] = useState<Values>({ inputVal: '', secondaryInput: '', tertiaryInput: '', optionNumber: tool.id === 'caesar-cipher' ? 3 : 0 });
  const [mode, setMode] = useState(ui?.modes?.[0]?.value ?? '');
  const [result, setResult] = useState('');
  const [resultMode, setResultMode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [carried, setCarried] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);

  if (tool.status === 'unavailable') {
    return <Notice role="status">{t.runner.unavailable}</Notice>;
  }
  if (tool.id === 'jwt-decoder') return <JwtDecoder />;
  if (tool.id === 'totp-generator') return <TotpTool />;
  if (!ui) return <Notice role="status">{t.runner.noUi}</Notice>;

  // Any edit discards the previous result so a stale output is never shown next to new input.
  function invalidate() {
    controller.current?.abort();
    controller.current = null;
    setBusy(false);
    setResult('');
    setError('');
    setCarried(false);
  }

  async function execute() {
    invalidate();
    const job = new AbortController();
    controller.current = job;
    setBusy(true);
    try {
      const value = await workerJob<string>({ tool: { id: tool.id, ...values, mode } }, job.signal);
      if (controller.current === job) {
        setResult(value);
        setResultMode(mode);
      }
    } catch (e) {
      if (controller.current === job) setError(e instanceof Error ? localizeMessage(e.message, lang) : t.common.failed);
    } finally {
      if (controller.current === job) setBusy(false);
    }
  }

  const visibleInputs = ui.inputs.filter((spec) => !spec.modes || spec.modes.includes(mode));
  const resultKind = tool.id === 'jwt-verifier' ? 'jwt' : ui.result === 'verdict' || resultMode === 'verify' ? 'verdict' : ui.result ?? 'value';
  const resultLabel = resultMode === 'generate' ? t.runner.keyPair : ui.resultLabel ?? t.common.result;

  return (
    <div className="space-y-5">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) execute();
        }}
      >
        {ui.modes && (
          <Segmented
            label={t.runner.operation}
            value={mode}
            options={ui.modes}
            onChange={(next) => {
              // "Şifrele" then "Çöz" works without copy and paste: the output becomes the new input. Fields whose
              // meaning flips with the direction (RSA public vs private key) are cleared; shared ones (password) stay.
              const carry = result && INVERSE[resultMode] === next ? result : null;
              invalidate();
              setMode(next);
              if (carry !== null) {
                setValues((prev) => {
                  const updated = { ...prev, inputVal: carry };
                  for (const spec of ui.inputs) if (spec.key !== 'inputVal' && spec.key !== 'optionNumber' && typeof spec.label !== 'string') updated[spec.key] = '';
                  return updated;
                });
                setCarried(true);
              }
            }}
          />
        )}
        {carried && (
          <p role="status" className="text-[13px] text-emerald-700 dark:text-emerald-400">
            {t.runner.carried}
          </p>
        )}
        {visibleInputs.map((spec) => (
          <InputField
            key={spec.key}
            spec={spec}
            mode={mode}
            value={values[spec.key]}
            onChange={(value) => {
              invalidate();
              setValues((prev) => ({ ...prev, [spec.key]: spec.kind === 'number' ? Number(value) : value }));
            }}
          />
        ))}
        {ui.params && (
          <p className="text-[13px] text-slate-600 dark:text-zinc-400">
            <span className="font-medium text-slate-700 dark:text-zinc-300">{t.runner.params}</span> {ui.params}
          </p>
        )}
        <div className="flex items-center gap-2">
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? t.common.computing : resolve(ui.action, mode)}
          </Button>
          {busy && (
            <Button variant="ghost" onClick={invalidate}>
              {t.common.cancel}
            </Button>
          )}
        </div>
      </form>

      {error && <Notice tone="error">{error}</Notice>}

      {result &&
        (resultKind === 'jwt' ? (
          <JwtVerification value={result} />
        ) : resultKind === 'verdict' ? (
          (() => {
            const verdict = verdictOf(tool.id, result, t, lang);
            return (
              <Notice tone={verdict.ok ? 'success' : 'error'} role="status">
                {verdict.text}
              </Notice>
            );
          })()
        ) : resultKind === 'report' ? (
          <Report label={resultLabel} value={localizeMessage(result, lang)} />
        ) : (
          <OutputBlock label={resultLabel} value={LABELLED_VALUES.has(tool.id) ? localizeMessage(result, lang) : result} />
        ))}

      {ui.note && <p className="border-t border-slate-200 dark:border-zinc-800 pt-4 text-[13px] leading-relaxed text-slate-600 dark:text-zinc-400">{ui.note}</p>}
    </div>
  );
}
