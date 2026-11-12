import zxcvbn from 'zxcvbn';
import { equalText,randomBytes } from './security';
/**
 * Cryptographic Engineering Toolkit Engine
 * Local cryptographic computations; page assets may use the network.
 */

import { blake256 } from '@noble/hashes/blake1.js';
import { blake2b,blake2s } from '@noble/hashes/blake2.js';
import { blake3 } from '@noble/hashes/blake3.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { hmac } from '@noble/hashes/hmac.js';
import { md5,ripemd160,sha1 } from '@noble/hashes/legacy.js';
import { sha224,sha256,sha384,sha512 } from '@noble/hashes/sha2.js';
import { sha3_224,sha3_256,sha3_384,sha3_512 } from '@noble/hashes/sha3.js';
import { bytesToHex } from '@noble/hashes/utils.js';

// --- Utility Functions ---
export function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

export function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function base64UrlEncode(str: string): string {
  return bytesToBase64(stringToBytes(str)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(base64ToBytes(base64));
}

// --- CATEGORY 1: Password & Security Tools ---
export interface PasswordStrengthReport {
  score: number; // 0 to 100
  level: 'Zayıf' | 'Orta' | 'Güçlü' | 'Çok Güçlü';
  entropyBits: number;
  crackTimeEstimate: string;
  feedback: string[];
}

export function evaluatePasswordStrength(password: string): PasswordStrengthReport {
  if(password.length>256)throw new Error('Güç analizi en fazla 256 karakter kabul eder.');
  const estimate=zxcvbn(password);
  const levels:PasswordStrengthReport['level'][]=['Zayıf','Zayıf','Orta','Güçlü','Çok Güçlü'];
  return {score:estimate.score*25,level:levels[estimate.score],entropyBits:Math.round(estimate.guesses_log10/Math.log10(2)*10)/10,crackTimeEstimate:'Kesin kırılma süresi hesaplanamaz; bu bir örüntü tahminidir.',feedback:[estimate.feedback.warning,...estimate.feedback.suggestions].filter(Boolean)};
}

export function validatePasswordPolicy(password: string, minLength = 12): { valid: boolean; rules: { name: string; passed: boolean }[] } {
  const rules = [
    { name: `En az ${minLength} karakter (yerel politika)`, passed: Array.from(password).length >= minLength },
    { name: 'Yaygın örnek parola değil (sınırlı yerel liste)', passed: !/^(password|parola|qwerty|123456|admin|letmein)([0-9!@.]*)$/i.test(password) },
  ];
  return { valid: rules.every((r) => r.passed), rules };
}

// Compare two passwords securely with timing-safe check
export function comparePasswords(p1: string, p2: string): { match: boolean; similarity: number } {
  if (p1.length === 0 || p2.length === 0) return { match: false, similarity: 0 };
  const match = equalText(p1, p2);
  return { match, similarity: match ? 100 : 0 };
}

export { generateKdf,verifyKdf } from './kdf';
// --- CATEGORY 3: General Hash Algorithms ---
export function computeGeneralHash(algorithm: string, input: string): string {
  const bytes = stringToBytes(input);
  switch (algorithm.toLowerCase()) {
    case 'md5': return bytesToHex(md5(bytes));
    case 'sha1':
    case 'sha-1': return bytesToHex(sha1(bytes));
    case 'sha224':
    case 'sha-224': return bytesToHex(sha224(bytes));
    case 'sha256':
    case 'sha-256': return bytesToHex(sha256(bytes));
    case 'sha384':
    case 'sha-384': return bytesToHex(sha384(bytes));
    case 'sha512':
    case 'sha-512': return bytesToHex(sha512(bytes));
    case 'sha3-224': return bytesToHex(sha3_224(bytes));
    case 'sha3-256': return bytesToHex(sha3_256(bytes));
    case 'sha3-384': return bytesToHex(sha3_384(bytes));
    case 'sha3-512': return bytesToHex(sha3_512(bytes));
    case 'blake2b': return bytesToHex(blake2b(bytes));
    case 'blake2s': return bytesToHex(blake2s(bytes));
    case 'blake3': return bytesToHex(blake3(bytes));
    case 'blake256':
    case 'blake-256': return bytesToHex(blake256(bytes));
    case 'ripemd160':
    case 'ripemd-160': return bytesToHex(ripemd160(bytes));
    default: throw new Error(`Desteklenmeyen algoritma: ${algorithm}`);
  }
}

// --- CATEGORY 4: JWT, Token & Encoding Tools ---
export function createJwt(payload: Record<string, unknown>, secret: string, algorithm = 'HS256'): string {
  if (!['HS256', 'HS384', 'HS512'].includes(algorithm)) throw new Error('Desteklenmeyen JWT algoritması.');
  if (stringToBytes(secret).length < 32) throw new Error('JWT anahtarı en az 32 bayt olmalı.');
  const header = { alg: algorithm, typ: 'JWT' };
  const encHeader = base64UrlEncode(JSON.stringify(header));
  const encPayload = base64UrlEncode(JSON.stringify(payload));
  const message = `${encHeader}.${encPayload}`;

  const secretBytes = stringToBytes(secret);
  const msgBytes = stringToBytes(message);
  let sigBytes: Uint8Array;

  if (algorithm === 'HS512') {
    sigBytes = hmac(sha512, secretBytes, msgBytes);
  } else if (algorithm === 'HS384') {
    sigBytes = hmac(sha384, secretBytes, msgBytes);
  } else {
    sigBytes = hmac(sha256, secretBytes, msgBytes);
  }

  const signature = bytesToBase64(sigBytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${message}.${signature}`;
}

export function decodeJwt(token: string): { header: unknown; payload: unknown; signature: string; validFormat: boolean } {
  try {
    const parts = token.trim().split('.');
    if (parts.length !== 3) {
      return { header: null, payload: null, signature: '', validFormat: false };
    }
    const header = JSON.parse(base64UrlDecode(parts[0]));
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    return { header, payload, signature: parts[2], validFormat: true };
  } catch {
    return { header: null, payload: null, signature: '', validFormat: false };
  }
}

export function verifyJwtSignature(token: string, secret: string, expectedAlgorithm: 'HS256' | 'HS384' | 'HS512' = 'HS256'): boolean {
  try {
    const parts = token.trim().split('.');
    if (parts.length !== 3) return false;
    const message = `${parts[0]}.${parts[1]}`;
    const header = JSON.parse(base64UrlDecode(parts[0]));
    const alg = header.alg;
    if (alg !== expectedAlgorithm || !['HS256', 'HS384', 'HS512'].includes(alg) || header.crit || header.b64 === false || stringToBytes(secret).length < 32) return false;

    const secretBytes = stringToBytes(secret);
    const msgBytes = stringToBytes(message);
    let sigBytes: Uint8Array;

    if (alg === 'HS512') sigBytes = hmac(sha512, secretBytes, msgBytes);
    else if (alg === 'HS384') sigBytes = hmac(sha384, secretBytes, msgBytes);
    else sigBytes = hmac(sha256, secretBytes, msgBytes);

    const expectedSig = bytesToBase64(sigBytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return equalText(expectedSig, parts[2]);
  } catch {
    return false;
  }
}

export function generateUuidV4(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  const bytes = randomBytes(16);
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = bytesToHex(bytes);
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

export function generateUuidV7(): string {
  const timestamp = Date.now();
  const timeHex = timestamp.toString(16).padStart(12, '0');
  const randomHex = bytesToHex(randomBytes(10));
  return `${timeHex.slice(0, 8)}-${timeHex.slice(8, 12)}-7${randomHex.slice(0, 3)}-${((parseInt(randomHex[3], 16) & 3) | 8).toString(16)}${randomHex.slice(4, 7)}-${randomHex.slice(7, 19)}`;
}

export function generateNanoId(size = 21): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  let id = '';
  const bytes = randomBytes(size);
  for (let i = 0; i < size; i++) {
    // The alphabet has exactly 64 symbols, so the low six bits pick one without bias.
    id += alphabet[bytes[i] & 63];
  }
  return id;
}

export function generateSecureToken(bytesLength = 32, format: 'hex' | 'base64' | 'base64url' = 'hex'): string {
  const bytes = randomBytes(bytesLength);
  if (format === 'hex') return bytesToHex(bytes);
  if (format === 'base64') return bytesToBase64(bytes);
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeBase32(input: string): Uint8Array {
  const text = input.toUpperCase().replace(/=+$/, '');
  if (!/^[A-Z2-7]+$/.test(text) || ![0,2,4,5,7].includes(text.length % 8)) throw new Error('Geçersiz Base32 anahtarı.');
  let buffer = 0, bits = 0;
  const bytes: number[] = [];
  for (const char of text) {
    buffer = (buffer << 5) | 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.indexOf(char);
    bits += 5;
    if (bits >= 8) { bits -= 8; bytes.push((buffer >>> bits) & 255); }
  }
  if ((buffer & ((1 << bits) - 1)) !== 0) throw new Error('Geçersiz Base32 dolgu bitleri.');
  return new Uint8Array(bytes);
}
export function generateHotp(secret: string, counter: number, digits = 6): string {
  if (!Number.isSafeInteger(counter) || counter < 0 || ![6,7,8].includes(digits)) throw new Error('Geçersiz OTP parametreleri.');
  const data = new Uint8Array(8);
  new DataView(data.buffer).setBigUint64(0, BigInt(counter));
  const digest = hmac(sha1, decodeBase32(secret), data);
  const offset = digest[digest.length - 1] & 15;
  const value = new DataView(digest.buffer, digest.byteOffset).getUint32(offset) & 0x7fffffff;
  return String(value % 10 ** digits).padStart(digits, '0');
}
export function generateTotp(secret: string, timeStep = 30, epoch = Math.floor(Date.now()/1000), digits = 6): { token: string; secondsRemaining: number } {
  if (!Number.isSafeInteger(timeStep) || timeStep < 1 || !Number.isSafeInteger(epoch) || epoch < 0) throw new Error('Geçersiz zaman.');
  return { token: generateHotp(secret, Math.floor(epoch / timeStep), digits), secondsRemaining: timeStep - epoch % timeStep };
}

// Classical Ciphers
export function rot13(str: string): string {
  return str.replace(/[a-zA-Z]/g, (c) => {
    const code = c.charCodeAt(0);
    const base = code >= 97 ? 97 : 65;
    return String.fromCharCode(((code - base + 13) % 26) + base);
  });
}

export function caesarCipher(str: string, shift = 3, decrypt = false): string {
  const s = decrypt ? (26 - (shift % 26)) % 26 : shift % 26;
  return str.replace(/[a-zA-Z]/g, (c) => {
    const code = c.charCodeAt(0);
    const base = code >= 97 ? 97 : 65;
    return String.fromCharCode(((code - base + s) % 26) + base);
  });
}

export function vigenereCipher(text: string, key: string, decrypt = false): string {
  if (!key) return text;
  let result = '';
  const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, '') || 'KEY';
  let keyIndex = 0;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (/[a-zA-Z]/.test(c)) {
      const isLower = c === c.toLowerCase();
      const code = c.toUpperCase().charCodeAt(0) - 65;
      const kCode = cleanKey[keyIndex % cleanKey.length].charCodeAt(0) - 65;
      const shift = decrypt ? (code - kCode + 26) % 26 : (code + kCode) % 26;
      const resChar = String.fromCharCode(shift + 65);
      result += isLower ? resChar.toLowerCase() : resChar;
      keyIndex++;
    } else {
      result += c;
    }
  }
  return result;
}

// Versioned authenticated envelope. PBKDF2 derives a fresh key for each salt.
async function aesKey(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  if (!password) throw new Error('Şifreleme parolası gerekli.');
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function aesGcmEncrypt(plaintext: string, password: string): Promise<string> {
  const salt = randomBytes(16), iv = randomBytes(12), iterations = 600000;
  const key = await aesKey(password, salt, iterations);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: new TextEncoder().encode('parola:v1') }, key, new TextEncoder().encode(plaintext));
  return JSON.stringify({ v: 1, kdf: 'PBKDF2-SHA256', iterations, salt: bytesToBase64(salt), iv: bytesToBase64(iv), ciphertext: bytesToBase64(new Uint8Array(ciphertext)) });
}
export async function aesGcmDecrypt(envelope: string, password: string): Promise<string> {
  let data;
  try {
    data = JSON.parse(envelope);
  } catch {
    throw new Error('Şifreli veri geçerli değil. Şifreleme çıktısının tamamını ({"v":1,… ile başlayan metni) yapıştırın.');
  }
  if (data?.v !== 1 || data.kdf !== 'PBKDF2-SHA256' || data.iterations !== 600000) throw new Error('Desteklenmeyen şifreli veri biçimi.');
  const salt = new Uint8Array(base64ToBytes(data.salt)), iv = new Uint8Array(base64ToBytes(data.iv)), ciphertext = new Uint8Array(base64ToBytes(data.ciphertext));
  if (salt.length !== 16 || iv.length !== 12 || ciphertext.length < 16) throw new Error('Bozuk şifreli veri.');
  const key = await aesKey(password, salt, data.iterations);
  let plain: ArrayBuffer;
  try {
    plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: new TextEncoder().encode('parola:v1') }, key, ciphertext);
  } catch {
    // GCM cannot tell a wrong password from tampered data: both fail the authentication tag.
    throw new Error('Çözülemedi: parola yanlış ya da şifreli veri değiştirilmiş.');
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(plain);
}

// HKDF (RFC 5869)
export function deriveHkdf(ikm: string, salt: string, info: string, length = 32): string {
  const derived = hkdf(sha256, stringToBytes(ikm), stringToBytes(salt), stringToBytes(info), length);
  return bytesToHex(derived);
}

export function validateJwtClaims(payload: unknown, issuer?: string, audience?: string, now = Math.floor(Date.now()/1000)): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {valid:false,errors:['Payload nesne olmalı.']};
  const p = payload as Record<string, unknown>;
  for (const name of ['exp','nbf']) if (p[name] !== undefined && (typeof p[name] !== 'number' || !Number.isFinite(p[name]))) errors.push(`${name} sayısal olmalı.`);
  if (typeof p.exp === 'number' && now >= p.exp) errors.push('Token süresi dolmuş.');
  if (typeof p.nbf === 'number' && now < p.nbf) errors.push('Token henüz geçerli değil.');
  if (issuer && p.iss !== issuer) errors.push('Issuer uyuşmuyor.');
  if (audience && p.aud !== audience && !(Array.isArray(p.aud) && p.aud.includes(audience))) errors.push('Audience uyuşmuyor.');
  return {valid: errors.length===0, errors};
}
