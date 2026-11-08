import type { SecurityTool,ToolCategoryKey } from '../tools-registry';
import { TOOL_CATEGORIES } from '../tools-registry';
import { TOOL_CATEGORIES_EN,TOOLS_EN } from './catalog-en';
import type { Locale } from './routing';

/** Registry category names carry an ordinal prefix ("1. Parola & Güvenlik"); the UI shows the plain name. */
const stripOrdinal = (name: string) => name.replace(/^\d+\.\s*/, '');

export function categoryText(key: ToolCategoryKey, lang: Locale): { name: string; shortDesc: string } {
  if (lang === 'en') return TOOL_CATEGORIES_EN[key];
  const category = TOOL_CATEGORIES.find((c) => c.key === key)!;
  return { name: stripOrdinal(category.name), shortDesc: category.shortDesc };
}

/** Localized name and description of a tool. Disabled tools say so in their name. */
export function toolText(tool: SecurityTool, lang: Locale): { name: string; description: string } {
  if (lang === 'tr') return { name: tool.name, description: tool.description };
  const text = TOOLS_EN[tool.id];
  return { name: tool.status === 'unavailable' ? `${text.name} (not available yet)` : text.name, description: text.description };
}
