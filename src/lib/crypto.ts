import {
PassphraseOptions,
PinOptions,
RandomPasswordOptions,
} from '@/types/password';
import { ENGLISH_WORDS,TURKISH_WORDS } from './wordlists';

export const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
export const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const NUMBER_CHARS = '0123456789';
export const SYMBOL_CHARS = '!@#$%^&*()-_=+[]{};:,.?';
export const SIMILAR_CHARS = 'il1Lo0O';

/**
 * Cryptographically secure unbiased random integer generator in range [0, max - 1].
 * Uses rejection sampling to completely eliminate modulo bias.
 */
export function getSecureRandomInt(max: number): number {
  if (!Number.isInteger(max) || max < 1 || max > 4294967296) throw new Error('Geçersiz rastgele sayı sınırı.');
  if (max === 1) return 0;

  // Max value of 32-bit unsigned integer is 2^32 - 1 = 4294967295
  const maxUint32 = 4294967296;
  const limit = maxUint32 - (maxUint32 % max);
  const buffer = new Uint32Array(1);

  while (true) {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(buffer);
    } else {
      // Fallback for SSR or non-browser execution (node:crypto if available)
      const cryptoObj = (globalThis as unknown as { crypto?: Crypto }).crypto;
      if (cryptoObj && cryptoObj.getRandomValues) {
        cryptoObj.getRandomValues(buffer);
      } else {
        throw new Error('Web Crypto API is not available.');
      }
    }

    const val = buffer[0];
    if (val < limit) {
      return val % max;
    }
  }
}

/**
 * Fisher-Yates array shuffle using cryptographically secure unbiased random values.
 */
export function secureShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * Generate a random cryptographically secure password based on options.
 */
export function generateRandomPassword(options: RandomPasswordOptions): string {
  let activeLowercase = options.lowercase ? LOWERCASE_CHARS : '';
  let activeUppercase = options.uppercase ? UPPERCASE_CHARS : '';
  let activeNumbers = options.numbers ? NUMBER_CHARS : '';
  let activeSymbols = options.symbols ? SYMBOL_CHARS : '';

  if (options.excludeSimilar) {
    const simSet = new Set(SIMILAR_CHARS.split(''));
    activeLowercase = activeLowercase.split('').filter((c) => !simSet.has(c)).join('');
    activeUppercase = activeUppercase.split('').filter((c) => !simSet.has(c)).join('');
    activeNumbers = activeNumbers.split('').filter((c) => !simSet.has(c)).join('');
  }

  if (options.excludedChars.length > 0) {
    const exSet = new Set(options.excludedChars.split(''));
    activeLowercase = activeLowercase.split('').filter((c) => !exSet.has(c)).join('');
    activeUppercase = activeUppercase.split('').filter((c) => !exSet.has(c)).join('');
    activeNumbers = activeNumbers.split('').filter((c) => !exSet.has(c)).join('');
    activeSymbols = activeSymbols.split('').filter((c) => !exSet.has(c)).join('');
  }

  // Handle custom charset if provided
  let pool = '';
  if (options.customCharset.trim().length > 0) {
    let custom = options.customCharset.trim();
    if (options.excludedChars.length > 0) {
      const exSet = new Set(options.excludedChars.split(''));
      custom = custom.split('').filter((c) => !exSet.has(c)).join('');
    }
    pool = custom;
  } else {
    pool = activeLowercase + activeUppercase + activeNumbers + activeSymbols;
  }

  const chars = [...new Set(Array.from(pool))];
  if (!chars.length) throw new Error('İzin verilen karakter kalmadı.');
  const length = options.length;
  if (!Number.isInteger(length) || length < 4 || length > 128) throw new Error('Uzunluk 4–128 olmalı.');
  const categories = [activeLowercase, activeUppercase, activeNumbers, activeSymbols];
  const enabled = [options.lowercase, options.uppercase, options.numbers, options.symbols];
  const required = options.requireEachCategory && !options.customCharset.trim()
    ? categories.filter((_, i) => enabled[i]) : [];
  if (required.some(c => !c.length)) throw new Error('Zorunlu karakter kategorisi tamamen dışlanmış.');
  if (options.noAdjacentDuplicates && chars.length < 2) throw new Error('Tek karakterle tekrarsız üretim mümkün değil.');
  // Uniform proposals followed by whole-output rejection preserve the constraints.
  for (let attempt = 0; attempt < 10000; attempt++) {
    const result: string[] = [];
    for (let i = 0; i < length; i++) {
      const candidates = options.noAdjacentDuplicates ? chars.filter(c => c !== result[i - 1]) : chars;
      result.push(candidates[getSecureRandomInt(candidates.length)]);
    }
    if (required.every(c => result.some(x => c.includes(x)))) return result.join('');
  }
  throw new Error('Bu kurallarla üretim tamamlanamadı; seçenekleri değiştirin.');
}

/**
 * Generate a memorable passphrase using curated wordlists.
 */
export function generatePassphrase(options: PassphraseOptions): string {
  const wordlist = options.language === 'en' ? ENGLISH_WORDS : TURKISH_WORDS;
  const count = options.wordCount;
  if(!Number.isInteger(count)||count<3||count>10)throw new Error('Kelime sayısı 3–10 olmalı.');
  const chosenWords: string[] = [];
  const sampled = secureShuffle([...new Set(wordlist)]).slice(0, count);
  for (let i = 0; i < count; i++) {
    let word = sampled[i];
    if (options.capitalize) {
      // Locale-aware so Turkish words get a dotted capital İ (izci → İzci, not Izci).
      word = word.charAt(0).toLocaleUpperCase(options.language) + word.slice(1);
    }
    chosenWords.push(word);
  }

  let phrase = chosenWords.join(options.separator);

  if (options.addNumber) {
    const num = getSecureRandomInt(900) + 100; // 3-digit number e.g. 100-999
    phrase += `${options.separator}${num}`;
  }

  if (options.addSymbol) {
    const symbols = '!@#$%&*';
    const sym = symbols[getSecureRandomInt(symbols.length)];
    phrase += `${options.separator}${sym}`;
  }

  return phrase;
}

/**
 * Generate a cryptographically secure numeric PIN.
 */
export function generatePin(options: PinOptions): string {
  const length = options.length;
  if(!Number.isInteger(length)||length<4||length>32)throw new Error('PIN uzunluğu 4–32 olmalı.');
  const excluded = new Set(options.excludedDigits.split(''));
  const digits = '0123456789'.split('').filter((d) => !excluded.has(d));

  if (digits.length === 0) {
    throw new Error('İzin verilen PIN rakamı kalmadı.');
  }

  if (!options.allowRepeat && length > digits.length) throw new Error('Tekrarsız PIN uzunluğu kullanılabilir rakam sayısını aşamaz.');
  let pin = '';
  let attempts = 0;

  while (attempts < 200) {
    const chosen: string[] = [];
    let valid = true;

    for (let i = 0; i < length; i++) {
      let pool = digits;
      if (!options.allowRepeat && chosen.length > 0) {
        pool = digits.filter((d) => !chosen.includes(d));
        if (pool.length === 0) {
          // If length exceeds pool, we have to allow repeat or truncate
          throw new Error('PIN rakam havuzu tükendi.');
        }
      }

      const digit = pool[getSecureRandomInt(pool.length)];
      chosen.push(digit);
    }

    // Check sequential pattern if prohibited
    if (!options.allowSequential && chosen.length >= 3) {
      let isSequential = false;
      for (let i = 0; i <= chosen.length - 3; i++) {
        const d1 = parseInt(chosen[i], 10);
        const d2 = parseInt(chosen[i + 1], 10);
        const d3 = parseInt(chosen[i + 2], 10);
        // Ascending (e.g. 1-2-3) or descending (e.g. 3-2-1)
        if (d2 === d1 + 1 && d3 === d2 + 1) {
          isSequential = true;
          break;
        }
        if (d2 === d1 - 1 && d3 === d2 - 1) {
          isSequential = true;
          break;
        }
      }
      if (isSequential) {
        valid = false;
      }
    }

    if (valid) {
      pin = chosen.join('');
      break;
    }
    attempts++;
  }

  if (!pin) {
    throw new Error('PIN kuralları sağlanamadı; seçenekleri değiştirin.');
  }

  return pin;
}
