import type { BulkPasswordItem,GenerationMode,PassphraseOptions,PinOptions,RandomPasswordOptions } from '@/types/password';
import { generatePassphrase,generatePin,generateRandomPassword } from './crypto';
import { analyzePassword } from './entropy';
export function generateBulk(count:number,mode:GenerationMode,options:{randomOptions:RandomPasswordOptions;passphraseOptions:PassphraseOptions;pinOptions:PinOptions}):BulkPasswordItem[] {
  if(!Number.isInteger(count)||count<1||count>1000)throw new Error('Toplu üretim sayısı 1–1000 olmalı.');
  return Array.from({length:count},()=>{
    const password=mode==='random'?generateRandomPassword(options.randomOptions):mode==='pin'?generatePin(options.pinOptions):generatePassphrase(options.passphraseOptions);
    const analysis=analyzePassword(password,mode,options);
    return {id:crypto.randomUUID(),password,length:analysis.length,entropyBits:analysis.entropyBits,strengthLevel:analysis.strengthLevel};
  });
}
