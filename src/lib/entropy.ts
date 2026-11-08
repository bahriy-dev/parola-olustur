import {
GenerationMode,
PassphraseOptions,
PasswordAnalysis,
PinOptions,
RandomPasswordOptions,
StrengthLevel,
} from '@/types/password';
import {
LOWERCASE_CHARS,
NUMBER_CHARS,
SIMILAR_CHARS,
SYMBOL_CHARS,
UPPERCASE_CHARS,
} from './crypto';
import { ENGLISH_WORDS,TURKISH_WORDS } from './wordlists';

/**
 * Calculate the theoretical available character pool size based on active options.
 */
export function getActivePoolSize(options: RandomPasswordOptions): number {
  if (options.customCharset.trim().length > 0) {
    let custom = options.customCharset.trim();
    if (options.excludedChars.length > 0) {
      const exSet = new Set(options.excludedChars.split(''));
      custom = custom.split('').filter((c) => !exSet.has(c)).join('');
    }
    return new Set(custom.split('')).size || 1;
  }

  let chars = '';
  if (options.lowercase) chars += LOWERCASE_CHARS;
  if (options.uppercase) chars += UPPERCASE_CHARS;
  if (options.numbers) chars += NUMBER_CHARS;
  if (options.symbols) chars += SYMBOL_CHARS;

  if (options.excludeSimilar) {
    const simSet = new Set(SIMILAR_CHARS.split(''));
    chars = chars.split('').filter((c) => !simSet.has(c)).join('');
  }

  if (options.excludedChars.length > 0) {
    const exSet = new Set(options.excludedChars.split(''));
    chars = chars.split('').filter((c) => !exSet.has(c)).join('');
  }

  return new Set(chars.split('')).size || 1;
}

/**
 * log2 of a BigInt without overflowing Number for counts above ~2^1024.
 */
export function log2BigInt(value: bigint): number {
  if (value <= 0n) return 0;
  const extraBits = value.toString(2).length - 53;
  if (extraBits <= 0) return Math.log2(Number(value));
  return Math.log2(Number(value >> BigInt(extraBits))) + extraBits;
}

/**
 * Determine strength level based on entropy in bits.
 */
export function getStrengthLevel(entropyBits: number): StrengthLevel {
  if (entropyBits < 45) return 'weak';
  if (entropyBits < 70) return 'medium';
  if (entropyBits < 100) return 'strong';
  return 'very_strong';
}

/**
 * Formats a theoretical combination count into human-readable scientific notation.
 */
export function formatSearchSpace(base: number, exponent: number): string {
  if (base <= 0 || exponent <= 0) return '0';
  const totalLog10 = exponent * Math.log10(base);

  if (totalLog10 < 4) {
    const total = Math.pow(base, exponent);
    return Math.round(total).toLocaleString('tr-TR');
  }

  const exp10 = Math.floor(totalLog10);
  const mantissa = Math.pow(10, totalLog10 - exp10);
  return `${mantissa.toFixed(2)} × 10^${exp10}`;
}

/**
 * Analyze a generated password or input string and calculate all security metrics.
 */
export function analyzePassword(
  password: string,
  mode: GenerationMode,
  options?: {
    randomOptions?: RandomPasswordOptions;
    passphraseOptions?: PassphraseOptions;
    pinOptions?: PinOptions;
  }
): PasswordAnalysis {
  const length = password.length;
  if (length === 0) {
    return {
      password: '',
      length: 0,
      entropyBits: 0,
      strengthLevel: 'weak',
      uniqueChars: 0,
      repeatedChars: 0,
      consecutiveDuplicates: 0,
      lowercaseCount: 0,
      uppercaseCount: 0,
      numbersCount: 0,
      symbolsCount: 0,
      poolSize: 0,
      searchSpaceText: '0',
      searchSpaceBase2: 0,
      mode,
    };
  }

  // Count character categories
  let lowercaseCount = 0;
  let uppercaseCount = 0;
  let numbersCount = 0;
  let symbolsCount = 0;

  const charCounts = new Map<string, number>();
  let consecutiveDuplicates = 0;

  for (let i = 0; i < password.length; i++) {
    const char = password[i];
    charCounts.set(char, (charCounts.get(char) || 0) + 1);

    if (i > 0 && char === password[i - 1]) {
      consecutiveDuplicates++;
    }

    if (/[a-z]/.test(char)) lowercaseCount++;
    else if (/[A-Z]/.test(char)) uppercaseCount++;
    else if (/[0-9]/.test(char)) numbersCount++;
    else symbolsCount++;
  }

  const uniqueChars = charCounts.size;
  const repeatedChars = length - uniqueChars;

  // Calculate Entropy based on Generation Mode
  let entropyBits = 0;
  let poolSize = 0;
  let searchSpaceText = '';
  let searchSpaceBase2 = 0;

  if (mode === 'random') {
    poolSize = options?.randomOptions ? getActivePoolSize(options.randomOptions) : 94;
    const o=options?.randomOptions;
    const excluded=new Set([...(o?.excludedChars || ''),...(o?.excludeSimilar?SIMILAR_CHARS:'')]);
    const categories=[o?.lowercase?LOWERCASE_CHARS:'',o?.uppercase?UPPERCASE_CHARS:'',o?.numbers?NUMBER_CHARS:'',o?.symbols?SYMBOL_CHARS:''].map(c=>[...c].filter(x=>!excluded.has(x)).length).filter(Boolean);
    const countFor=(n:number)=>n<=0?0n:BigInt(n)*(BigInt(o?.noAdjacentDuplicates?Math.max(0,n-1):n)**BigInt(length-1));
    let count=countFor(poolSize);
    if(o?.requireEachCategory && !o.customCharset.trim()) {
      count=0n;
      for(let mask=0;mask<2**categories.length;mask++) {
        let omitted=0, bits=0;
        categories.forEach((n,i)=>{if(mask&(1<<i)){omitted+=n;bits++;}});
        count+=(bits%2?-1n:1n)*countFor(poolSize-omitted);
      }
    }
    entropyBits=log2BigInt(count);
    searchSpaceBase2=Math.round(entropyBits);
    searchSpaceText=`2^${entropyBits.toFixed(1)}`;
  } else if (mode === 'passphrase') {
    const wordlistSize =
      options?.passphraseOptions?.language === 'en' ? ENGLISH_WORDS.length : TURKISH_WORDS.length;
    const wordCount = options?.passphraseOptions?.wordCount || 5;

    // Base entropy from word choice: W * log2(wordlist_size)
    let baseEntropy = Array.from({length:wordCount},(_,i)=>Math.log2(wordlistSize-i)).reduce((a,b)=>a+b,0);

    // Extra randomness if capitalization or numbers or symbols applied
    if (options?.passphraseOptions?.addNumber) {
      baseEntropy += Math.log2(900); // 3-digit number (100-999) ~ 9.8 bits
    }
    if (options?.passphraseOptions?.addSymbol) {
      baseEntropy += Math.log2(7); // 7 possible symbols ~ 2.8 bits
    }

    entropyBits = baseEntropy;
    poolSize = wordlistSize;
    searchSpaceBase2 = Math.round(entropyBits);
    searchSpaceText = formatSearchSpace(wordlistSize, wordCount);
  } else if (mode === 'pin') {
    const o=options?.pinOptions;
    const excluded=new Set(o?.excludedDigits || '');
    const digits=Array.from({length:10},(_,i)=>i).filter(i=>!excluded.has(String(i)));
    poolSize=digits.length;
    const cache=new Map<string,bigint>();
    const count=(remaining:number,previous:number,before:number,mask:number):bigint=>{
      if(!remaining)return 1n;
      const key=`${remaining},${previous},${before},${mask}`;
      const cached=cache.get(key);if(cached!==undefined)return cached;
      let total=0n;
      for(const d of digits) {
        if(o && !o.allowRepeat && (mask&(1<<d)))continue;
        if(o && !o.allowSequential && before>=0 && ((previous===before+1&&d===previous+1)||(previous===before-1&&d===previous-1)))continue;
        total+=count(remaining-1,d,previous,o && !o.allowRepeat?mask|(1<<d):0);
      }
      cache.set(key,total);return total;
    };
    const combinations=count(length,-1,-1,0);
    entropyBits=log2BigInt(combinations);
    searchSpaceBase2=Math.round(entropyBits);
    searchSpaceText=`2^${entropyBits.toFixed(1)}`;
  }

  // Round entropy to 1 decimal place
  entropyBits = Math.max(0, Math.round(entropyBits * 10) / 10);
  const strengthLevel = getStrengthLevel(entropyBits);

  return {
    password,
    length,
    entropyBits,
    strengthLevel,
    uniqueChars,
    repeatedChars,
    consecutiveDuplicates,
    lowercaseCount,
    uppercaseCount,
    numbersCount,
    symbolsCount,
    poolSize,
    searchSpaceText,
    searchSpaceBase2,
    mode,
  };
}
