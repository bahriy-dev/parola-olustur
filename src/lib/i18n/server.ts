import { notFound } from 'next/navigation';
import { isLocale,type Locale } from './routing';

export type LangParams = { params: Promise<{ lang: string }> };

/** Locale of a page under app/[lang]; anything else is a 404. */
export async function pageLang(params: Promise<{ lang: string }>): Promise<Locale> {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return lang;
}
