import {isExecutableToolId} from './tool-capabilities';
import { computeHash } from '@/lib/hash/engine';
import { identifyHash } from '@/lib/hash/identifier';
import {
aesGcmDecrypt,
aesGcmEncrypt,
base64ToBytes,bytesToBase64,
bytesToString,
caesarCipher,
comparePasswords,
computeGeneralHash,
createJwt,
decodeJwt,
deriveHkdf,
evaluatePasswordStrength,
generateHotp,
generateKdf,
generateNanoId,
generateSecureToken,
generateTotp,
generateUuidV4,
generateUuidV7,
rot13,
stringToBytes,
validateJwtClaims,
validatePasswordPolicy,
verifyJwtSignature,
verifyKdf,
vigenereCipher,
} from '@/lib/tools-engine';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { ecdhDemo,fingerprint,generateKeyPair,pemBytes,rsaCrypt,signature } from './asymmetric';
import { equalText } from './security';

const NAMED_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0' };
// Worker has no DOM, so entities are decoded explicitly; unknown names are left untouched.
function decodeHtmlEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body: string) => {
    if (body[0] !== '#') return NAMED_ENTITIES[body.toLowerCase()] ?? match;
    const code = body[1].toLowerCase() === 'x' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
    return code >= 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : match;
  });
}

export interface ToolInput { id: string; inputVal: string; secondaryInput: string; tertiaryInput: string; optionNumber: number; mode: string; }
export async function executeTool({id,inputVal,secondaryInput,tertiaryInput,optionNumber,mode}: ToolInput): Promise<string> {
  if ([inputVal,secondaryInput,tertiaryInput].some(s => s.length > 100000)) throw new Error('Girdi en fazla 100.000 karakter olabilir.');
        if(!isExecutableToolId(id))throw new Error(`Desteklenmeyen araç: ${id}`);
        switch (id) {
          case 'strength-checker': {
            const report = evaluatePasswordStrength(inputVal);
            return (
              `Güvenlik Seviyesi: ${report.level}\n` +
              `Skor: ${report.score} / 100\n` +
              `Örüntü modelinin tahmini tahmin sayısı (log2): ${report.entropyBits} bit\n` +
              `Tahmini Kırılma Süresi: ${report.crackTimeEstimate}\n` +
              (report.feedback.length > 0 ? `\nÖneriler:\n- ${report.feedback.join('\n- ')}` : '\nBu analiz güvenlik garantisi değildir.')
            );
            break;
          }

          case 'entropy-calculator': {
            const poolSize = new Set(inputVal.split('')).size || 1;
            const len = inputVal.length;
            const searchSpaceBits = Math.round(len * Math.log2(poolSize) * 100) / 100;
            const searchSpace = Math.pow(poolSize, len);
            return (
              `Eş dağılımlı örnekleme varsayımıyla üst sınır: ${searchSpaceBits} bit\n` +
              `Uzunluk: ${len} karakter\n` +
              `Benzersiz Karakter Havuzu: ${poolSize}\n` +
              `Teorik Kombinasyon Uzayı: 2^${Math.round(searchSpaceBits)} (~${searchSpace.toExponential(2)})`
            );
            break;
          }

          case 'policy-validator': {
            const { valid, rules } = validatePasswordPolicy(inputVal);
            const reportStr = rules
              .map((r) => `${r.passed ? '✓ [GEÇTİ]' : '✗ [BAŞARISIZ]'} ${r.name}`)
              .join('\n');
            return (`Politika Uyumluluğu: ${valid ? 'Uyumlu' : 'Uyumsuz'}\n\nKural Kontrolleri:\n${reportStr}`);
            break;
          }

          case 'match-checker': {
            return comparePasswords(inputVal,secondaryInput).match ? 'Eşleşiyor' : 'Farklı';
          }

          case 'breach-checker': {
            return `SHA-1 ön eki: ${computeGeneralHash('sha1', inputVal).slice(0,5).toUpperCase()}\nBu araç ihlal sorgusu yapmaz; yalnızca yerel ön ek hesaplar.`;
          }

          case 'hash-verifier': {
            if (secondaryInput.startsWith('$')) return verifyKdf(inputVal, secondaryInput.trim()) ? 'Eşleşiyor' : 'Eşleşmiyor';
            return ['md5','sha1','sha256'].find(a => equalText(computeGeneralHash(a,inputVal),secondaryInput.trim().toLowerCase())) || 'Eşleşmiyor';
          }

          case 'bcrypt-generator': {
            return generateKdf('bcrypt', inputVal);
          }

          case 'bcrypt-verifier': {
            if(!secondaryInput.trim().startsWith('$2'))throw new Error('Beklenen algoritma: bcrypt');
            return verifyKdf(inputVal, secondaryInput.trim()) ? 'Hash doğrulandı.' : 'Hash uyuşmuyor.';
          }

          case 'argon2id-generator': {
            return generateKdf('argon2id', inputVal);
          }

          case 'argon2id-verifier': {
            if(!secondaryInput.trim().startsWith('$argon2id$'))throw new Error('Beklenen algoritma: argon2id');
            return verifyKdf(inputVal, secondaryInput.trim()) ? 'Hash doğrulandı.' : 'Hash uyuşmuyor.';
          }

          case 'argon2i-generator': {
            return generateKdf('argon2i', inputVal);
          }

          case 'argon2d-generator': {
            return generateKdf('argon2d', inputVal);
          }

          case 'scrypt-generator': {
            return generateKdf('scrypt', inputVal);
          }

          case 'scrypt-verifier': {
            if(!secondaryInput.trim().startsWith('$scrypt$'))throw new Error('Beklenen algoritma: scrypt');
            return verifyKdf(inputVal, secondaryInput.trim()) ? 'Hash doğrulandı.' : 'Hash uyuşmuyor.';
          }

          case 'pbkdf2-sha256': {
            return generateKdf('pbkdf2-sha256', inputVal);
          }

          case 'pbkdf2-sha512': {
            return generateKdf('pbkdf2-sha512', inputVal);
          }

          case 'pbkdf2-sha1': {
            return generateKdf('pbkdf2-sha1', inputVal);
          }

          case 'hash-identifier': {
            const matches = identifyHash(inputVal.trim());
            if (matches.length === 0) {
              return ('Bilinmeyen veya geçersiz hash formatı.');
            } else {
              const summary = matches
                .map(
                  (m, i) =>
                    `${i + 1}. [Güven: ${m.confidence}] ${m.algorithm.name} (${m.algorithm.categoryName})\n` +
                    `   Standart: ${m.algorithm.standard} | Bit: ${m.algorithm.bits}-bit\n` +
                    `   Neden: ${m.matchReason}`
                )
                .join('\n\n');
              return (`Tespit Edilen Olası Algoritmalar:\n\n${summary}`);
            }
            break;
          }

          case 'hash-md5':
          case 'hash-sha1':
          case 'hash-sha224':
          case 'hash-sha256':
          case 'hash-sha384':
          case 'hash-sha512':
          case 'hash-sha3-224':
          case 'hash-sha3-256':
          case 'hash-sha3-384':
          case 'hash-sha3-512':
          case 'hash-blake2b':
          case 'hash-blake3': {
            const algName = id.replace('hash-', '').replace(/^sha(1|224|256|384|512)$/, 'sha-$1');
            const res = await computeHash(algName, inputVal);
            return (res.hash);
            break;
          }

          case 'jwt-encoder': {
            return createJwt(JSON.parse(inputVal),secondaryInput);
          }

          case 'jwt-decoder': {
            const { header, payload, validFormat } = decodeJwt(inputVal);
            if (!validFormat) {
              return ('Geçersiz JWT formatı. JWT token 3 parçadan oluşmalıdır (header.payload.signature).');
            } else {
              return (
                `// HEADER (Üstbilgi):\n${JSON.stringify(header, null, 2)}\n\n` +
                `// PAYLOAD (Veri İddiaları):\n${JSON.stringify(payload, null, 2)}`
              );
            }
            break;
          }

          case 'jwt-verifier': {
            const signature = verifyJwtSignature(inputVal,secondaryInput);
            const expected = tertiaryInput ? JSON.parse(tertiaryInput) : {};
            const claims = validateJwtClaims(decodeJwt(inputVal).payload, expected.iss, expected.aud);
            return JSON.stringify({signature, claims, note:'İmza algoritması HS256. iss/aud yalnız beklenti girilmişse denetlenir.'},null,2);
          }

          case 'uuid-generator': {
            const v4 = generateUuidV4();
            const v7 = generateUuidV7();
            return (`UUID v4 (Rastgele)     : ${v4}\nUUID v7 (Zaman Damgalı): ${v7}`);
            break;
          }

          case 'nanoid-generator': {
            const id = generateNanoId(21);
            return (id);
            break;
          }

          case 'base64-tool': {
            return mode === 'decode' ? bytesToString(base64ToBytes(inputVal)) : bytesToBase64(stringToBytes(inputVal));
          }

          case 'hex-tool': {
            if (mode === 'decode') {
              const clean = inputVal.replace(/^0x/i, '').replace(/[\s:]/g, '');
              if (!/^(?:[0-9a-f]{2})*$/i.test(clean)) throw new Error('Geçersiz hex: çift sayıda 0-9/a-f karakteri bekleniyor.');
              return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(clean.match(/../g) ?? [], (h) => parseInt(h, 16)));
            }
            return Array.from(new TextEncoder().encode(inputVal), (b) => b.toString(16).padStart(2, '0')).join('');
          }

          case 'url-tool': {
            return mode === 'decode' ? decodeURIComponent(inputVal) : encodeURIComponent(inputVal).replace(/[!'()*]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase());
          }

          case 'html-entity-tool': {
            if (mode === 'decode') return decodeHtmlEntities(inputVal);
            const encoded = inputVal
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
            return (encoded);
            break;
          }

          case 'secure-token-generator': {
            const hexToken = generateSecureToken(32, 'hex');
            const b64Token = generateSecureToken(32, 'base64url');
            return (`Hex Format (64 karakter / 256-bit):\n${hexToken}\n\nBase64URL Format (43 karakter):\n${b64Token}`);
            break;
          }

          case 'totp-generator': {
            return JSON.stringify(generateTotp(inputVal),null,2);
          }

          case 'hotp-generator': {
            return generateHotp(inputVal,optionNumber);
          }

          case 'api-key-generator': {
            const rand = generateSecureToken(24, 'hex');
            return (`local_${rand}`);
            break;
          }

          case 'csrf-token-generator': {
            const token = generateSecureToken(32, 'hex');
            return (token);
            break;
          }

          case 'aes-gcm': {
            return mode === 'decrypt' ? aesGcmDecrypt(inputVal,secondaryInput) : aesGcmEncrypt(inputVal,secondaryInput);
          }

          case 'aes-cbc': {
            throw new Error('Bu araç henüz desteklenmiyor.');
          }

          case 'chacha20-poly1305': {
            throw new Error('Bu araç henüz desteklenmiyor.');
          }

          case 'rsa-key-generator': {
            return generateKeyPair('RSA');
          }

          case 'caesar-cipher': {
            return caesarCipher(inputVal,optionNumber,mode==='decrypt');
          }

          case 'vigenere-cipher': {
            if (!/^[a-z]+$/i.test(secondaryInput)) throw new Error('Anahtar yalnız Latin harfleri içermeli.');
            return vigenereCipher(inputVal,secondaryInput,mode==='decrypt');
          }

          case 'rot13-cipher': {
            const rotated = rot13(inputVal);
            return (rotated);
            break;
          }

          case 'hkdf-tool': {
            if (!inputVal) throw new Error('Anahtar malzemesi gerekli.');
            return deriveHkdf(inputVal,secondaryInput,tertiaryInput);
          }

          case 'hmac-generator': {
            const res = await computeHash(mode === 'sha512' ? 'hmac-sha512' : 'hmac-sha256', inputVal, { key: secondaryInput });
            return (res.hash);
            break;
          }

          case 'hmac-verifier': {
            const res=await computeHash(mode === 'sha512' ? 'hmac-sha512' : 'hmac-sha256',inputVal,{key:secondaryInput});
            return equalText(res.hash,tertiaryInput.trim().toLowerCase()) ? 'HMAC doğrulandı.' : 'HMAC uyuşmuyor.';
          }

          case 'checksum-verifier': {
            const checksum = mode === 'adler32' ? 'adler32' : 'crc32', label = checksum === 'adler32' ? 'Adler-32' : 'CRC32';
            if (!/^[a-f0-9]{8}$/i.test(secondaryInput.trim())) throw new Error(`Beklenen ${label}: 8 hex karakter girin.`);
            const res=await computeHash(checksum,inputVal);
            return equalText(res.hash,secondaryInput.trim().toLowerCase()) ? `${label} doğrulandı.` : `${label} uyuşmuyor.`;
          }

          case 'keccak256-tool': {
            return '0x'+bytesToHex(keccak_256(stringToBytes(inputVal)));
          }

          case 'ripemd160-tool': {
            const res = await computeHash('ripemd-160', inputVal);
            return (res.hash);
            break;
          }

          case 'ecdsa-key-generator': return generateKeyPair('EC');
          case 'rsa-encrypt-decrypt': return rsaCrypt(inputVal,secondaryInput,mode==='decrypt');
          case 'rsa-sign-verify': return signature('RSA',inputVal,secondaryInput,tertiaryInput,mode==='verify');
          case 'ecdsa-sign-verify': return signature('EC',inputVal,secondaryInput,tertiaryInput,mode==='verify');
          case 'ed25519-sign-verify': return mode==='generate'?generateKeyPair('Ed25519'):signature('Ed25519',inputVal,secondaryInput,tertiaryInput,mode==='verify');
          case 'pem-parser': return JSON.stringify({type:inputVal.match(/BEGIN ([A-Z ]+)/)?.[1],bytes:pemBytes(inputVal).length,note:'Yalnız PEM kapsayıcı analizi; sertifika güven zinciri doğrulanmaz.'});
          case 'public-key-fingerprint': return fingerprint(inputVal);
          case 'ecdh-demo': return ecdhDemo();
          default: {const exhaustive:never=id;throw new Error(`Desteklenmeyen araç: ${exhaustive}`);}
        }
}
