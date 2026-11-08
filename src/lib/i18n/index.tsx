'use client';

import { createContext,useContext,type ReactNode } from 'react';
import { localizePath,type Locale } from './routing';
import { UI,type UiDictionary } from './ui';

export type { Locale } from './routing';

interface LocaleContext {
  lang: Locale;
  t: UiDictionary;
  /** Public URL for an internal (Turkish-segment) path in the current locale. */
  href: (path: string) => string;
}

const Context = createContext<LocaleContext>({ lang: 'tr', t: UI.tr, href: (path) => path });

/** The locale comes from the URL (/en/… or unprefixed Turkish), set once by the [lang] root layout. */
export function I18nProvider({ lang, children }: { lang: Locale; children: ReactNode }) {
  return <Context.Provider value={{ lang, t: UI[lang], href: (path) => localizePath(path, lang) }}>{children}</Context.Provider>;
}

export const useLocale = () => useContext(Context);
