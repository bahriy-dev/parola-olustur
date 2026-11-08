'use client';
import { useLocale } from '@/lib/i18n';
import { localizeMessage } from '@/lib/i18n/messages';
import { Button,CopyButton,Field,Notice,TextInput } from '@/components/ui/form';
import { workerJob } from '@/lib/worker-client';
import { useCallback,useEffect,useId,useRef,useState } from 'react';

const STEP = 30;

/** Current code first, then time left; the code refreshes itself when its 30 s window ends. */
export function TotpTool() {
  const { t, lang } = useLocale();
  const id = useId();
  const [secret, setSecret] = useState('');
  const [active, setActive] = useState(false);
  const [code, setCode] = useState('');
  const [remaining, setRemaining] = useState(0);
  const [error, setError] = useState('');
  const windowRef = useRef(-1);

  const compute = useCallback(async () => {
    try {
      const { token } = JSON.parse(await workerJob<string>({ tool: { id: 'totp-generator', inputVal: secret, secondaryInput: '', tertiaryInput: '', optionNumber: 0, mode: '' } })) as { token: string };
      setCode(token);
      setError('');
    } catch (e) {
      setActive(false);
      setCode('');
      setError(e instanceof Error ? localizeMessage(e.message, lang) : t.totp.failed);
    }
  }, [secret, lang, t.totp.failed]);

  useEffect(() => {
    if (!active) return;
    const tick = () => {
      const now = Math.floor(Date.now() / 1000);
      setRemaining(STEP - (now % STEP));
      const current = Math.floor(now / STEP);
      if (current !== windowRef.current) {
        windowRef.current = current;
        compute();
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [active, compute]);

  return (
    <div className="space-y-5">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          windowRef.current = -1;
          setActive(true);
        }}
      >
        <Field label={t.totp.secret} htmlFor={id} hint={t.totp.secretHint}>
          <TextInput
            id={id}
            type="password"
            mono
            value={secret}
            onChange={(e) => {
              setSecret(e.target.value.replace(/\s/g, ''));
              setActive(false);
              setCode('');
            }}
            placeholder="JBSWY3DPEHPK3PXP"
            autoComplete="off"
            spellCheck={false}
          />
        </Field>
        <p className="text-[13px] text-slate-600 dark:text-zinc-400">
          <span className="font-medium text-slate-700 dark:text-zinc-300">{t.runner.params}</span> {t.totp.params}
        </p>
        <Button type="submit" variant="primary" disabled={!secret}>
          {t.totp.generate}
        </Button>
      </form>

      {error && <Notice tone="error">{error}</Notice>}

      {active && code && (
        <section aria-label={t.totp.code} className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 px-4 py-3">
          <div>
            <output aria-live="polite" className="font-mono text-3xl tracking-[0.2em] text-slate-900 dark:text-zinc-100 tabular-nums">
              {code.slice(0, 3)} {code.slice(3)}
            </output>
            <div className="mt-2 flex items-center gap-2 text-[13px] text-slate-600 dark:text-zinc-400">
              <span className="h-1 w-32 overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800" aria-hidden>
                <span className={`block h-full rounded-full ${remaining <= 5 ? 'bg-amber-500' : 'bg-blue-600'}`} style={{ width: `${(remaining / STEP) * 100}%` }} />
              </span>
              <span className="tabular-nums">{t.totp.remaining(remaining)}</span>
            </div>
          </div>
          <CopyButton value={code} size="md" />
        </section>
      )}
    </div>
  );
}
