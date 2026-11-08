export type GenerationMode = 'random' | 'passphrase' | 'pin';

export interface RandomPasswordOptions {
  length: number; // 4 to 128
  lowercase: boolean;
  uppercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeSimilar: boolean; // i, l, 1, L, o, 0, O
  noAdjacentDuplicates: boolean;
  requireEachCategory: boolean;
  customCharset: string;
  excludedChars: string;
}

export interface PassphraseOptions {
  wordCount: number; // 3 to 10
  separator: '-' | '.' | '_' | ' ';
  capitalize: boolean;
  addNumber: boolean;
  addSymbol: boolean;
  language: 'tr' | 'en';
}

export interface PinOptions {
  length: number; // 4 to 32
  allowRepeat: boolean;
  allowSequential: boolean; // e.g. 1234, 4321
  excludedDigits: string;
}

export type StrengthLevel = 'weak' | 'medium' | 'strong' | 'very_strong';

export interface PasswordAnalysis {
  password: string;
  length: number;
  entropyBits: number;
  strengthLevel: StrengthLevel;
  uniqueChars: number;
  repeatedChars: number;
  consecutiveDuplicates: number;
  lowercaseCount: number;
  uppercaseCount: number;
  numbersCount: number;
  symbolsCount: number;
  poolSize: number;
  searchSpaceText: string;
  searchSpaceBase2: number;
  mode: GenerationMode;
}

export interface BulkPasswordItem {
  id: string;
  password: string;
  length: number;
  entropyBits: number;
  strengthLevel: StrengthLevel;
}
