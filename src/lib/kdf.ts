import { argon2d,argon2i,argon2id } from '@noble/hashes/argon2.js';
import { sha1 } from '@noble/hashes/legacy.js';
import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import { scrypt } from '@noble/hashes/scrypt.js';
import { sha256,sha512 } from '@noble/hashes/sha2.js';
import bcrypt from 'bcryptjs';
import { equalBytes,randomBytes } from './security';
const encode = (bytes: Uint8Array) => btoa(Array.from(bytes, b => String.fromCharCode(b)).join('')).replace(/=+$/, '');
const decode = (text: string) => Uint8Array.from(atob(text), c => c.charCodeAt(0));
export type KdfType = 'argon2id' | 'argon2i' | 'argon2d' | 'scrypt' | 'pbkdf2-sha256' | 'pbkdf2-sha512' | 'pbkdf2-sha1' | 'bcrypt';
export function generateKdf(type: KdfType, password: string): string {
  if(!['argon2id','argon2i','argon2d','scrypt','pbkdf2-sha256','pbkdf2-sha512','pbkdf2-sha1','bcrypt'].includes(type))throw new Error('Desteklenmeyen KDF.');
  if (!password || password.length > 4096) throw new Error('Parola 1–4096 karakter olmalı.');
  if (type === 'bcrypt') {
    if (new TextEncoder().encode(password).length > 72) throw new Error('bcrypt en fazla 72 UTF-8 bayt kabul eder.');
    return bcrypt.hashSync(password, 12);
  }
  const salt = randomBytes(16);
  if (type.startsWith('argon2')) {
    const fn = { argon2id, argon2i, argon2d }[type as 'argon2id'];
    const hash = fn(password, salt, { m: 19456, t: 2, p: 1, dkLen: 32 });
    return `$${type}$v=19$m=19456,t=2,p=1$${encode(salt)}$${encode(hash)}`;
  }
  if (type === 'scrypt') {
    const hash = scrypt(password, salt, { N: 131072, r: 8, p: 1, dkLen: 32, maxmem: 256 * 1024 * 1024 });
    return `$scrypt$ln=17,r=8,p=1$${encode(salt)}$${encode(hash)}`;
  }
  const algorithm = type === 'pbkdf2-sha512' ? sha512 : type === 'pbkdf2-sha1' ? sha1 : sha256;
  const c = type === 'pbkdf2-sha512' ? 220000 : type === 'pbkdf2-sha1' ? 1300000 : 600000;
  return `$${type}$i=${c}$${encode(salt)}$${encode(pbkdf2(algorithm, password, salt, { c, dkLen: 32 }))}`;
}
export function verifyKdf(password: string, encoded: string): boolean {
  if (password.length > 4096 || encoded.length > 1024) throw new Error('Girdi sınırı aşıldı.');
  if (/^\$2[ab]\$\d\d\$[./A-Za-z0-9]{53}$/.test(encoded)) {
    const cost = Number(encoded.split('$')[2]);
    if (cost < 4 || cost > 14 || new TextEncoder().encode(password).length > 72) throw new Error('bcrypt maliyet/uzunluk sınırı aşıldı.');
    return bcrypt.compareSync(password, encoded);
  }
  const argon = encoded.match(/^\$(argon2id|argon2i|argon2d)\$v=19\$m=(\d+),t=(\d+),p=(\d+)\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/);
  if (argon) {
    const [,type,memory,time,parallel,saltText,hashText] = argon;
    const m = Number(memory), t = Number(time), p = Number(parallel);
    const salt = decode(saltText), expected = decode(hashText);
    if (p < 1 || p > 4 || m < 8*p || m > 65536 || t < 1 || t > 6 || salt.length < 8 || salt.length > 64 || expected.length !== 32) throw new Error('Argon2 parametreleri destek sınırları dışında.');
    const argon2 = type === 'argon2id' ? argon2id : type === 'argon2i' ? argon2i : argon2d;
    return equalBytes(argon2(password, salt, {m,t,p,dkLen:32}), expected);
  }
  const sc = encoded.match(/^\$scrypt\$ln=(\d+),r=(\d+),p=(\d+)\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/);
  if (sc) {
    const [,lnText,rText,pText,saltText,hashText] = sc;
    const ln=Number(lnText), r=Number(rText), p=Number(pText), salt=decode(saltText), expected=decode(hashText);
    if (ln < 10 || ln > 17 || r < 1 || r > 8 || p < 1 || p > 2 || salt.length < 8 || salt.length > 64 || expected.length !== 32) throw new Error('scrypt parametre sınırı.');
    return equalBytes(scrypt(password,salt,{N:2**ln,r,p,dkLen:32,maxmem:256*1024*1024}),expected);
  }
  const pb = encoded.match(/^\$pbkdf2-(sha256|sha512|sha1)\$i=(\d+)\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/);
  if (pb) {
    const [,alg,iterations,saltText,hashText]=pb, c=Number(iterations),salt=decode(saltText),expected=decode(hashText);
    if(c<1 || c>2000000 || salt.length<8 || salt.length>64 || expected.length!==32) throw new Error('PBKDF2 parametre sınırı.');
    const hash=alg==='sha512'?sha512:alg==='sha1'?sha1:sha256;
    return equalBytes(pbkdf2(hash,password,salt,{c,dkLen:32}),expected);
  }
  throw new Error('Desteklenmeyen encoded hash biçimi.');
}
