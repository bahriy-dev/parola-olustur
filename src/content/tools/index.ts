import type { Locale } from '@/lib/i18n/routing';
import { cryptoContent } from './crypto';
import { TOOL_CONTENT_EN } from './en';
import { hashContent } from './hash';
import { jwtContent } from './jwt';
import { kdfContent } from './kdf';
import { keysContent } from './keys';
import { passwordContent } from './password';
import type { ContentMap,ToolContent } from './types';

export const TOOL_CONTENT: ContentMap = { ...passwordContent, ...kdfContent, ...hashContent, ...jwtContent, ...cryptoContent, ...keysContent };
export { TOOL_CONTENT_EN };

/** The article for a tool in a locale, or undefined while that translation does not exist. */
export const getToolContent = (id: string, lang: Locale): ToolContent | undefined => (lang === 'tr' ? TOOL_CONTENT : TOOL_CONTENT_EN)[id];

/** Whether a tool's article exists in English, which makes the English page complete enough to index. */
export const isToolTranslated = (id: string) => id in TOOL_CONTENT_EN;
