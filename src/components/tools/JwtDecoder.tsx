'use client';
import { CopyButton,Field,Notice,TextArea } from '@/components/ui/form';
import { useLocale } from '@/lib/i18n';
import type { UiDictionary } from '@/lib/i18n/ui';
import Link from 'next/link';
import { useId,useMemo,useState,type ReactNode } from 'react';

function base64UrlToText(part: string): string {
  const b64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

type Decoded = { header: Record<string, unknown>; payload: unknown; signature: string } | { error: string };

// Decoding is pure parsing with no secret involved, so it runs as the user types.
function decode(token: string, t: UiDictionary): Decoded | null {
  const trimmed = token.trim();
  if (!trimmed) return null;
  const parts = trimmed.split('.');
  if (parts.length !== 3) return { error: t.jwt.errors.parts(parts.length) };
  try {
    return { header: JSON.parse(base64UrlToText(parts[0])), payload: JSON.parse(base64UrlToText(parts[1])), signature: parts[2] };
  } catch {
    return { error: t.jwt.errors.decode };
  }
}

const TOKEN = /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;

/** Minimal JSON syntax colouring: keys, strings, numbers and literals in calm, readable tones. */
function HighlightedJson({ value }: { value: unknown }) {
  const json = JSON.stringify(value, null, 2);
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of json.matchAll(TOKEN)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push(json.slice(last, index));
    const [token, str, colon, literal] = match;
    const cls = str ? (colon ? 'text-slate-900 dark:text-zinc-100 font-medium' : 'text-emerald-800 dark:text-emerald-300') : literal ? 'text-violet-700 dark:text-violet-300' : 'text-blue-800 dark:text-blue-300';
    nodes.push(<span key={index} className={cls}>{str ?? token}</span>);
    if (colon) nodes.push(colon);
    last = index + token.length;
  }
  nodes.push(json.slice(last));
  return <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-slate-700 dark:text-zinc-300">{nodes}</pre>;
}

function Section({ title, aside, copy, children }: { title: string; aside?: ReactNode; copy: string; children: ReactNode }) {
  return (
    <section className="rounded-md border border-slate-200 dark:border-zinc-800">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-zinc-800 px-3 py-2">
        <h3 className="text-sm font-medium text-slate-800 dark:text-zinc-200">
          {title} {aside && <span className="font-normal text-slate-600 dark:text-zinc-400">· {aside}</span>}
        </h3>
        <CopyButton value={copy} />
      </div>
      <div className="bg-slate-50 dark:bg-zinc-950 px-3 py-2.5">{children}</div>
    </section>
  );
}


export function JwtDecoder() {
  const id = useId();
  const { t, href } = useLocale();
  const [token, setToken] = useState('');
  const decoded = useMemo(() => decode(token, t), [token, t]);
  // Reference time for exp/nbf status, taken when the token is entered.
  const [now, setNow] = useState(0);

  const times = decoded && 'payload' in decoded && decoded.payload && typeof decoded.payload === 'object'
    ? Object.entries(t.jwt.claims).flatMap(([claim, label]) => {
        const value = (decoded.payload as Record<string, unknown>)[claim];
        return typeof value === 'number' ? [{ claim, label, value }] : [];
      })
    : [];

  return (
    <div className="space-y-5">
      <Field label="Token" htmlFor={id} hint={t.jwt.hint}>
        <TextArea id={id} mono rows={4} value={token} onChange={(e) => {
            setToken(e.target.value);
            setNow(Math.floor(Date.now() / 1000));
          }} placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0In0.…" spellCheck={false} className="break-all" />
      </Field>

      {decoded && 'error' in decoded && <Notice tone="error">{decoded.error}</Notice>}

      {decoded && 'header' in decoded && (
        <>
          <Notice role="status">
            {t.jwt.notVerifiedBefore} <strong className="font-medium">{t.jwt.notVerified}</strong>{t.jwt.notVerifiedAfter}{' '}
            <Link href={href('/araclar/jwt-verifier')} className="text-blue-700 dark:text-blue-400 underline underline-offset-4">{t.jwt.verifierLink}</Link> {t.jwt.notVerifiedEnd}
          </Notice>
          <div className="grid gap-4 lg:grid-cols-2">
            <Section title="Header" aside={typeof decoded.header.alg === 'string' ? decoded.header.alg : undefined} copy={JSON.stringify(decoded.header, null, 2)}>
              <HighlightedJson value={decoded.header} />
            </Section>
            <Section title="Payload" copy={JSON.stringify(decoded.payload, null, 2)}>
              <HighlightedJson value={decoded.payload} />
            </Section>
          </div>
          {times.length > 0 && (
            <table className="w-full text-sm">
              <caption className="pb-1.5 text-left text-sm font-medium text-slate-800 dark:text-zinc-200">{t.jwt.times}</caption>
              <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
                {times.map(({ claim, label, value }) => (
                  <tr key={claim}>
                    <th scope="row" className="py-1.5 pr-4 text-left font-normal text-slate-600 dark:text-zinc-400">{label}</th>
                    <td className="py-1.5 font-mono text-[13px] tabular-nums">{new Date(value * 1000).toLocaleString(t.common.numberLocale)}</td>
                    <td className="py-1.5 pl-4 text-right text-[13px] text-slate-600 dark:text-zinc-400">
                      {claim === 'exp' ? (value <= now ? t.jwt.expired : t.jwt.notExpired) : claim === 'nbf' ? (value > now ? t.jwt.notYetValid : t.jwt.valid) : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Section title="Signature" aside="Base64URL" copy={decoded.signature}>
            <p className="break-all font-mono text-[13px] text-slate-700 dark:text-zinc-300">{decoded.signature || t.jwt.unsigned}</p>
          </Section>
        </>
      )}
    </div>
  );
}
