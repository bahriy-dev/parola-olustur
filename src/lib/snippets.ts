// Quotes a generated secret for each target so it can be pasted without escaping mistakes.
export type SnippetLanguage = 'dotenv' | 'node' | 'python' | 'bash' | 'go';

export const SNIPPET_LANGUAGES: { value: SnippetLanguage; label: string }[] = [
  { value: 'dotenv', label: '.env' },
  { value: 'node', label: 'Node.js' },
  { value: 'python', label: 'Python' },
  { value: 'bash', label: 'Bash' },
  { value: 'go', label: 'Go' },
];

const DOTENV_NOTE = {
  tr: '# Base64: özel karakterler .env ayrıştırıcılarında sorun çıkarmaz.',
  en: '# Base64, so special characters cannot confuse .env parsers.',
};

export function buildSnippet(language: SnippetLanguage, value: string, lang: 'tr' | 'en' = 'tr'): string {
  const literal = JSON.stringify(value);
  switch (language) {
    case 'dotenv':
      return DOTENV_NOTE[lang] + '\nAPP_SECRET_BASE64=' + btoa(Array.from(new TextEncoder().encode(value), (b) => String.fromCharCode(b)).join(''));
    case 'node':
      return `const secret = ${literal};`;
    case 'python':
      return `import json\nsecret = json.loads(${JSON.stringify(literal)})`;
    case 'bash':
      return `export APP_SECRET='${value.replace(/'/g, `'"'"'`)}'`;
    case 'go':
      return `secret := ${literal}`;
  }
}
