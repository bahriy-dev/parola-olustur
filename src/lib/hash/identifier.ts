import { HASH_ALGORITHMS,HashAlgorithmMeta } from './registry';

export interface HashIdentificationMatch {
  algorithm: HashAlgorithmMeta;
  confidence: 'Yüksek' | 'Orta' | 'Düşük';
  matchReason: string;
}

export function identifyHash(rawHash: string): HashIdentificationMatch[] {
  const hash = rawHash.trim();
  if (!hash) return [];

  const matches: HashIdentificationMatch[] = [];

  // 1. Check for bcrypt signature
  if (/^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(hash)) {
    const alg = HASH_ALGORITHMS.find((a) => a.slug === 'bcrypt');
    if (alg) {
      matches.push({
        algorithm: alg,
        confidence: 'Yüksek',
        matchReason: 'Standart $2a$/$2b$ modular crypt biçimiyle birebir eşleşiyor.',
      });
      return matches;
    }
  }

  // 2. Check for Argon2 signature
  if (/^\$argon2(id|i|d)\$v=\d+\$m=\d+,t=\d+,p=\d+\$/.test(hash)) {
    const alg = HASH_ALGORITHMS.find((a) => a.slug === hash.split('$')[1]);
    if (alg) {
      matches.push({
        algorithm: alg,
        confidence: 'Yüksek',
        matchReason: 'Standart Argon2 PHC dize biçimiyle birebir eşleşiyor.',
      });
      return matches;
    }
  }

  // 3. Hexadecimal length checks
  const isHex = /^[0-9a-fA-F]+$/.test(hash);
  const len = hash.length;

  if (isHex) {
    const hexBits = len * 4;

    const candidates = HASH_ALGORITHMS.filter((a) => a.hexLength === len);

    for (const cand of candidates) {
      const confidence = 'Düşük' as const;
      const reason = `${len} hex basamak (${hexBits}-bit). Yalnız uzunluk eşleşmesi; algoritma kesin belirlenemez.`;

      matches.push({
        algorithm: cand,
        confidence,
        matchReason: reason,
      });
    }
  }

  // Sort by confidence
  const rank = { Yüksek: 3, Orta: 2, Düşük: 1 };
  matches.sort((a, b) => rank[b.confidence] - rank[a.confidence]);

  return matches;
}
