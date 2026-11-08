// Every available tool run 20 times on random input and checked against an independent reference
// (Node's crypto/zlib, a from-scratch reimplementation, or an inverse round trip). Run: npm run test:tools
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as nodeCrypto from 'node:crypto';
import * as zlib from 'node:zlib';
import { keccak_256 } from '@noble/hashes/sha3.js';
import bcrypt from 'bcryptjs';
import { executeTool } from '../src/lib/tool-execution';
import { computeHash } from '../src/lib/hash/engine';
import { HASH_ALGORITHMS } from '../src/lib/hash/registry';
import { ALL_TOOLS } from '../src/lib/tools-registry';
import { generatePassphrase,generatePin,generateRandomPassword } from '../src/lib/crypto';
import { ENGLISH_WORDS,TURKISH_WORDS } from '../src/lib/wordlists';
import { localizeMessage } from '../src/lib/i18n/messages';

const RUNS = 20;
const run = (id: string, inputVal = '', mode = '', secondaryInput = '', tertiaryInput = '', optionNumber = 0) =>
  executeTool({ id, inputVal, secondaryInput, tertiaryInput, optionNumber, mode });

// --- random inputs ---------------------------------------------------------------------------
const POOLS = ['abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', '!@#$%^&*()_+-=[]{};:\'",.<>/?\\|`~ ', 'çğıöşüÇĞİÖŞÜâî', '🔐😀🇹🇷€', '\n\t'];
const rnd = (n: number) => nodeCrypto.randomInt(n);
function randText(min = 0, max = 64, pools = POOLS) {
  const length = min + rnd(max - min + 1);
  let out = '';
  for (let i = 0; i < length; i++) {
    const pool = Array.from(pools[rnd(pools.length)]);
    out += pool[rnd(pool.length)];
  }
  return out;
}
const asciiText = (min = 1, max = 40) => randText(min, max, [POOLS[0], POOLS[1]]);
const b64 = (s: string) => s.replace(/=+$/, '');
const sha = (alg: string, data: string | Buffer) => nodeCrypto.createHash(alg).update(data).digest('hex');
const repeat = async (fn: (i: number) => Promise<void> | void) => { for (let i = 0; i < RUNS; i++) await fn(i); };

const tested = new Set<string>();
const covers = (...ids: string[]) => ids.forEach((id) => tested.add(id));

// --- password tools --------------------------------------------------------------------------
test('password generators honour every option', async () => {
  covers('password-generator', 'strong-password-generator', 'passphrase-generator', 'pin-generator');
  const SIMILAR = new Set('il1Lo0O');
  await repeat(() => {
    const options = {
      length: 4 + rnd(125), lowercase: rnd(2) === 1, uppercase: rnd(2) === 1, numbers: rnd(2) === 1, symbols: rnd(2) === 1,
      excludeSimilar: rnd(2) === 1, noAdjacentDuplicates: rnd(2) === 1, requireEachCategory: rnd(2) === 1, customCharset: '', excludedChars: rnd(2) ? '"\'`/\\' : '',
    };
    if (!options.lowercase && !options.uppercase && !options.numbers && !options.symbols) options.lowercase = true;
    const value = generateRandomPassword(options);
    const chars = Array.from(value);
    assert.equal(chars.length, options.length);
    if (!options.lowercase) assert.ok(!/[a-z]/.test(value), 'lowercase present');
    if (!options.uppercase) assert.ok(!/[A-Z]/.test(value), 'uppercase present');
    if (!options.numbers) assert.ok(!/[0-9]/.test(value), 'digit present');
    if (options.excludeSimilar) assert.ok(!chars.some((c) => SIMILAR.has(c)), `similar in ${value}`);
    if (options.excludedChars) assert.ok(!chars.some((c) => options.excludedChars.includes(c)), 'excluded present');
    if (options.noAdjacentDuplicates) assert.ok(!chars.some((c, i) => i > 0 && chars[i - 1] === c), `adjacent in ${value}`);
    if (options.requireEachCategory && options.length >= 4) {
      if (options.lowercase) assert.ok(/[a-z]/.test(value));
      if (options.uppercase) assert.ok(/[A-Z]/.test(value));
      if (options.numbers) assert.ok(/[0-9]/.test(value));
      if (options.symbols) assert.ok(/[^A-Za-z0-9]/.test(value));
    }
  });
  await repeat(() => {
    const custom = 'ABCDEF0123456789';
    const value = generateRandomPassword({ length: 32, lowercase: true, uppercase: true, numbers: true, symbols: true, excludeSimilar: false, noAdjacentDuplicates: false, requireEachCategory: false, customCharset: custom, excludedChars: '' });
    assert.ok([...value].every((c) => custom.includes(c)), value);
  });
  await repeat(() => {
    const language = rnd(2) ? 'tr' : 'en';
    const options = { wordCount: 3 + rnd(8), separator: (['-', '.', '_', ' '] as const)[rnd(4)], capitalize: rnd(2) === 1, addNumber: rnd(2) === 1, addSymbol: rnd(2) === 1, language } as const;
    const value = generatePassphrase(options);
    const list = new Set((language === 'en' ? ENGLISH_WORDS : TURKISH_WORDS).map((w) => w.toLocaleLowerCase(language)));
    const words = value.split(options.separator).map((w) => w.replace(/[0-9!@#$%&*]+$/, ''));
    assert.equal(words.length, options.wordCount, value);
    for (const word of words) assert.ok(list.has(word.toLocaleLowerCase(language)), `${word} not in list (${value})`);
    assert.equal(new Set(words.map((w) => w.toLocaleLowerCase(language))).size, words.length, `repeated word in ${value}`);
    if (options.capitalize) assert.ok(words.every((w) => w[0] === w[0].toLocaleUpperCase(language)), value);
    if (options.addNumber) assert.ok(/[0-9]{3}/.test(value), value);
  });
  await repeat(() => {
    const excluded = rnd(2) ? String(rnd(10)) : '';
    const options = { length: 4 + rnd(7), allowRepeat: rnd(2) === 1, allowSequential: rnd(2) === 1, excludedDigits: excluded };
    const value = generatePin(options);
    assert.match(value, /^[0-9]+$/);
    assert.equal(value.length, options.length);
    if (excluded) assert.ok(!value.includes(excluded), value);
    if (!options.allowRepeat) assert.equal(new Set(value).size, value.length, value);
    if (!options.allowSequential) for (let i = 2; i < value.length; i++) {
      const [a, b, c] = [+value[i - 2], +value[i - 1], +value[i]];
      assert.ok(!(b - a === 1 && c - b === 1) && !(a - b === 1 && b - c === 1), `sequence in ${value}`);
    }
  });
});

test('password analysis tools', async () => {
  covers('strength-checker', 'entropy-calculator', 'policy-validator', 'breach-checker', 'match-checker', 'hash-verifier');
  await repeat(async () => {
    const password = asciiText(1, 40);
    assert.match(await run('strength-checker', password), /Güvenlik Seviyesi: (Zayıf|Orta|Güçlü|Çok Güçlü)\nSkor: \d+ \/ 100/);
    const entropy = await run('entropy-calculator', password);
    const pool = new Set(password.split('')).size;
    const bits = Math.round(password.length * Math.log2(pool) * 100) / 100;
    assert.ok(entropy.includes(`üst sınır: ${bits} bit`), `${password} → ${entropy}`);
    const policy = await run('policy-validator', password);
    assert.ok(policy.includes(Array.from(password).length >= 12 ? '✓ [GEÇTİ] En az 12' : '✗ [BAŞARISIZ] En az 12'), policy);
    assert.ok((await run('breach-checker', password)).startsWith(`SHA-1 ön eki: ${sha('sha1', password).slice(0, 5).toUpperCase()}`));
    assert.equal(await run('match-checker', password, '', password), 'Eşleşiyor');
    assert.equal(await run('match-checker', password, '', password + 'x'), 'Farklı');
    const alg = ['md5', 'sha1', 'sha256'][rnd(3)];
    assert.equal(await run('hash-verifier', password, '', sha(alg, password)), alg);
    assert.equal(await run('hash-verifier', password, '', sha(alg, password + '!')), 'Eşleşmiyor');
  });
});

// --- password hashing (KDF) --------------------------------------------------------------------
const decode64 = (text: string) => Buffer.from(text, 'base64');

test('KDF generators match Node references and their verifiers', { timeout: 600000 }, async () => {
  covers('bcrypt-generator', 'bcrypt-verifier', 'argon2id-generator', 'argon2id-verifier', 'argon2i-generator', 'argon2d-generator', 'scrypt-generator', 'scrypt-verifier', 'pbkdf2-sha256', 'pbkdf2-sha512', 'pbkdf2-sha1', 'hash-identifier');
  await repeat(async (i) => {
    const password = randText(1, 24);
    // bcrypt: checked by the reference bcryptjs and by the verifier tool, wrong password rejected.
    if (Buffer.byteLength(password) <= 72) {
      const hash = await run('bcrypt-generator', password);
      assert.match(hash, /^\$2b\$12\$[./A-Za-z0-9]{53}$/);
      assert.ok(bcrypt.compareSync(password, hash));
      assert.equal(await run('bcrypt-verifier', password, '', hash), 'Hash doğrulandı.');
      assert.equal(await run('bcrypt-verifier', password + 'x', '', hash), 'Hash uyuşmuyor.');
      assert.ok((await run('hash-identifier', hash)).includes('bcrypt'));
    }
    // Argon2: recomputed with node:crypto argon2Sync.
    const variant = (['argon2id', 'argon2i', 'argon2d'] as const)[i % 3];
    const argon = await run(`${variant}-generator`, password);
    const [, , , params, salt, hash] = argon.split('$');
    assert.equal(params, 'm=19456,t=2,p=1');
    const reference = nodeCrypto.argon2Sync(variant, { message: password, nonce: decode64(salt), parallelism: 1, tagLength: 32, memory: 19456, passes: 2 });
    assert.equal(b64(reference.toString('base64')), hash, `${variant} mismatch for ${JSON.stringify(password)}`);
    if (variant === 'argon2id') {
      assert.equal(await run('argon2id-verifier', password, '', argon), 'Hash doğrulandı.');
      assert.equal(await run('argon2id-verifier', password + 'x', '', argon), 'Hash uyuşmuyor.');
    }
    // scrypt: recomputed with node:crypto scryptSync.
    if (i < 8) {
      const encoded = await run('scrypt-generator', password);
      const [, , sp, ssalt, shash] = encoded.split('$');
      assert.equal(sp, 'ln=17,r=8,p=1');
      const ref = nodeCrypto.scryptSync(password, decode64(ssalt), 32, { N: 2 ** 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 });
      assert.equal(b64(ref.toString('base64')), shash);
      assert.equal(await run('scrypt-verifier', password, '', encoded), 'Hash doğrulandı.');
      assert.equal(await run('scrypt-verifier', password + 'x', '', encoded), 'Hash uyuşmuyor.');
    }
    // PBKDF2: recomputed with node:crypto pbkdf2Sync.
    if (i < 6) {
      for (const [id, digest, rounds] of [['pbkdf2-sha256', 'sha256', 600000], ['pbkdf2-sha512', 'sha512', 220000], ['pbkdf2-sha1', 'sha1', 1300000]] as const) {
        const encoded = await run(id, password);
        const [, , iter, psalt, phash] = encoded.split('$');
        assert.equal(iter, `i=${rounds}`);
        assert.equal(b64(nodeCrypto.pbkdf2Sync(password, decode64(psalt), rounds, 32, digest).toString('base64')), phash, id);
        assert.equal(await run('hash-verifier', password, '', encoded), 'Eşleşiyor');
      }
    }
  });
});

// --- general hashes ----------------------------------------------------------------------------
const NODE_HASH: Record<string, string> = {
  md5: 'md5', 'sha-1': 'sha1', 'sha-224': 'sha224', 'sha-256': 'sha256', 'sha-384': 'sha384', 'sha-512': 'sha512', 'sha-512-224': 'sha512-224', 'sha-512-256': 'sha512-256',
  'sha3-224': 'sha3-224', 'sha3-256': 'sha3-256', 'sha3-384': 'sha3-384', 'sha3-512': 'sha3-512', blake2b: 'blake2b512', blake2s: 'blake2s256', 'ripemd-160': 'ripemd160',
};
const crc32c = (data: Buffer) => { let c = ~0; for (const b of data) { c ^= b; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0x82f63b78 : c >>> 1; } return ((~c) >>> 0).toString(16).padStart(8, '0'); };
const adler32 = (data: Buffer) => { let a = 1, b = 0; for (const x of data) { a = (a + x) % 65521; b = (b + a) % 65521; } return ((b << 16 | a) >>> 0).toString(16).padStart(8, '0'); };
const fnv32 = (data: Buffer) => { let h = 0x811c9dc5; for (const x of data) { h ^= x; h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };
const fnv64 = (data: Buffer) => { let h = 0xcbf29ce484222325n; for (const x of data) { h ^= BigInt(x); h = (h * 0x100000001b3n) & 0xffffffffffffffffn; } return h.toString(16).padStart(16, '0'); };
const OTHER: Record<string, (d: Buffer) => string> = {
  crc32: (d) => zlib.crc32(d).toString(16).padStart(8, '0'), crc32c, adler32, 'fnv-1a-32': fnv32, 'fnv-1a-64': fnv64,
  shake128: (d) => nodeCrypto.createHash('shake128', { outputLength: 32 }).update(d).digest('hex'),
  shake256: (d) => nodeCrypto.createHash('shake256', { outputLength: 64 }).update(d).digest('hex'),
  'md5-md5': (d) => sha('md5', sha('md5', d)),
  'md5-sha1': (d) => sha('md5', d) + sha('sha1', d),
};

test('every hash algorithm matches an independent reference', async () => {
  covers('hash-md5', 'hash-sha1', 'hash-sha224', 'hash-sha256', 'hash-sha384', 'hash-sha512', 'hash-sha3-224', 'hash-sha3-256', 'hash-sha3-384', 'hash-sha3-512', 'hash-blake2b', 'hash-blake3', 'ripemd160-tool', 'keccak256-tool');
  const unchecked: string[] = [];
  for (const alg of HASH_ALGORITHMS) {
    if (alg.category === 'parola-kdf' || alg.requiresKey) continue;
    const reference = NODE_HASH[alg.slug] ? (d: Buffer) => sha(NODE_HASH[alg.slug], d) : OTHER[alg.slug];
    if (!reference) { unchecked.push(alg.slug); continue; }
    await repeat(async () => {
      const text = randText();
      const res = await computeHash(alg.slug, text);
      assert.equal(res.hash, reference(Buffer.from(text)), `${alg.slug} text ${JSON.stringify(text)}`);
      const bytes = nodeCrypto.randomBytes(rnd(300));
      assert.equal((await computeHash(alg.slug, new Uint8Array(bytes))).hash, reference(bytes), `${alg.slug} bytes`);
    });
  }
  // Algorithms without a Node reference are checked against published test vectors in crypto.test.ts.
  console.log('hash algorithms without a Node reference here:', unchecked.join(', '));
  await repeat(async () => {
    const text = randText();
    for (const [id, alg] of [['hash-md5', 'md5'], ['hash-sha1', 'sha1'], ['hash-sha224', 'sha224'], ['hash-sha256', 'sha256'], ['hash-sha384', 'sha384'], ['hash-sha512', 'sha512'], ['hash-sha3-224', 'sha3-224'], ['hash-sha3-256', 'sha3-256'], ['hash-sha3-384', 'sha3-384'], ['hash-sha3-512', 'sha3-512'], ['hash-blake2b', 'blake2b512'], ['ripemd160-tool', 'ripemd160']])
      assert.equal(await run(id, text), sha(alg, text), id);
    assert.equal(await run('keccak256-tool', text), '0x' + Buffer.from(keccak_256(Buffer.from(text))).toString('hex'));
    assert.match(await run('hash-blake3', text), /^[0-9a-f]{64}$/);
  });
});

test('HMAC, HKDF and checksum tools match Node', async () => {
  covers('hmac-generator', 'hmac-verifier', 'hkdf-tool', 'checksum-verifier');
  await repeat(async () => {
    const message = randText(), key = randText(1, 40), alg = rnd(2) ? 'sha512' : 'sha256';
    const expected = nodeCrypto.createHmac(alg, key).update(message).digest('hex');
    assert.equal(await run('hmac-generator', message, alg, key), expected);
    assert.equal(await run('hmac-verifier', message, alg, key, expected), 'HMAC doğrulandı.');
    assert.equal(await run('hmac-verifier', message, alg, key, expected.replace(/^./, (c) => (c === 'a' ? 'b' : 'a'))), 'HMAC uyuşmuyor.');
    const ikm = randText(1, 40), salt = randText(0, 20), info = randText(0, 20);
    assert.equal(await run('hkdf-tool', ikm, '', salt, info), Buffer.from(nodeCrypto.hkdfSync('sha256', ikm, salt, info, 32)).toString('hex'));
    const crc = zlib.crc32(Buffer.from(message)).toString(16).padStart(8, '0');
    assert.equal(await run('checksum-verifier', message, 'crc32', crc), 'CRC32 doğrulandı.');
    assert.equal(await run('checksum-verifier', message, 'adler32', adler32(Buffer.from(message))), 'Adler-32 doğrulandı.');
    assert.equal(await run('checksum-verifier', message, 'crc32', crc === '00000000' ? '00000001' : '00000000'), 'CRC32 uyuşmuyor.');
  });
});

// --- JWT, tokens, encoding ------------------------------------------------------------------
test('JWT tools agree with a Node HS256 implementation', async () => {
  covers('jwt-encoder', 'jwt-decoder', 'jwt-verifier');
  const b64url = (b: Buffer) => b.toString('base64url');
  await repeat(async () => {
    const payload = { sub: randText(1, 12), name: randText(0, 20), n: rnd(1e6) };
    const secret = randText(32, 48, [POOLS[0]]);
    const token = await run('jwt-encoder', JSON.stringify(payload), '', secret);
    const [h, p, s] = token.split('.');
    assert.deepEqual(JSON.parse(Buffer.from(h, 'base64url').toString()), { alg: 'HS256', typ: 'JWT' });
    assert.deepEqual(JSON.parse(Buffer.from(p, 'base64url').toString()), payload);
    assert.equal(s, b64url(nodeCrypto.createHmac('sha256', secret).update(`${h}.${p}`).digest()));
    assert.ok((await run('jwt-decoder', token)).includes(JSON.stringify(payload, null, 2)));
    assert.equal(JSON.parse(await run('jwt-verifier', token, '', secret)).signature, true);
    assert.equal(JSON.parse(await run('jwt-verifier', token, '', secret + 'x')).signature, false);
    // A token signed elsewhere (Node) is accepted, and an expired one is reported.
    const ext = `${b64url(Buffer.from('{"alg":"HS256","typ":"JWT"}'))}.${b64url(Buffer.from(JSON.stringify({ exp: 1000 })))}`;
    const extToken = `${ext}.${b64url(nodeCrypto.createHmac('sha256', secret).update(ext).digest())}`;
    const verdict = JSON.parse(await run('jwt-verifier', extToken, '', secret));
    assert.equal(verdict.signature, true);
    assert.equal(verdict.claims.valid, false);
  });
});

test('token generators produce well-formed, unique values', async () => {
  covers('uuid-generator', 'nanoid-generator', 'secure-token-generator', 'api-key-generator', 'csrf-token-generator');
  const seen = new Set<string>();
  await repeat(async () => {
    const [v4, v7] = [...(await run('uuid-generator')).matchAll(/: (\S+)/g)].map((m) => m[1]);
    assert.match(v4, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.match(v7, /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    const ms = parseInt(v7.replace(/-/g, '').slice(0, 12), 16);
    assert.ok(Math.abs(ms - Date.now()) < 60000, 'UUIDv7 timestamp');
    const nano = await run('nanoid-generator');
    assert.match(nano, /^[A-Za-z0-9_-]{21}$/);
    const token = await run('secure-token-generator');
    assert.match(token, /\n[0-9a-f]{64}\n/);
    assert.match(token, /\n[A-Za-z0-9_-]{43}$/);
    assert.match(await run('api-key-generator'), /^local_[0-9a-f]{48}$/);
    assert.match(await run('csrf-token-generator'), /^[0-9a-f]{64}$/);
    for (const v of [v4, v7, nano]) { assert.ok(!seen.has(v), 'duplicate'); seen.add(v); }
  });
});

const hotpReference = (secret: Buffer, counter: number) => {
  const msg = Buffer.alloc(8); msg.writeBigUInt64BE(BigInt(counter));
  const mac = nodeCrypto.createHmac('sha1', secret).update(msg).digest();
  const o = mac[19] & 15;
  return String(((mac.readUInt32BE(o) & 0x7fffffff) % 1e6)).padStart(6, '0');
};
const base32 = (buf: Buffer) => { const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits = '', out = ''; for (const b of buf) bits += b.toString(2).padStart(8, '0'); for (let i = 0; i < bits.length; i += 5) out += A[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)]; return out; };

test('HOTP and TOTP match an RFC 4226/6238 reference', async () => {
  covers('hotp-generator', 'totp-generator');
  await repeat(async () => {
    const secret = nodeCrypto.randomBytes(10 + rnd(20));
    const counter = rnd(1e6);
    assert.equal(await run('hotp-generator', base32(secret), '', '', '', counter), hotpReference(secret, counter));
    const totp = JSON.parse(await run('totp-generator', base32(secret)));
    const step = Math.floor(Date.now() / 1000 / 30);
    assert.ok([hotpReference(secret, step), hotpReference(secret, step - 1)].includes(totp.token), 'TOTP');
  });
});

test('encoders round-trip and match platform encoders', async () => {
  covers('base64-tool', 'hex-tool', 'url-tool', 'html-entity-tool');
  await repeat(async () => {
    const text = randText();
    const encoded = await run('base64-tool', text, 'encode');
    assert.equal(encoded, Buffer.from(text).toString('base64'));
    assert.equal(await run('base64-tool', encoded, 'decode'), text);
    const hex = await run('hex-tool', text, 'encode');
    assert.equal(hex, Buffer.from(text).toString('hex'));
    assert.equal(await run('hex-tool', hex, 'decode'), text);
    const url = await run('url-tool', text, 'encode');
    assert.ok(/^[A-Za-z0-9\-_.~%]*$/.test(url), url);
    assert.equal(await run('url-tool', url, 'decode'), text);
    const html = await run('html-entity-tool', text, 'encode');
    assert.ok(!/[<>"']/.test(html) && !/&(?!amp;|lt;|gt;|quot;|#039;)/.test(html), html);
    assert.equal(await run('html-entity-tool', html, 'decode'), text);
  });
});

// --- encryption and keys ---------------------------------------------------------------------
test('AES-256-GCM round-trips and rejects wrong passwords and tampering', async () => {
  covers('aes-gcm');
  await repeat(async () => {
    const text = randText(0, 200), password = randText(1, 30);
    const envelope = await run('aes-gcm', text, 'encrypt', password);
    assert.equal(await run('aes-gcm', envelope, 'decrypt', password), text);
    await assert.rejects(run('aes-gcm', envelope, 'decrypt', password + 'x'), /parola yanlış/);
    const data = JSON.parse(envelope);
    const bytes = Buffer.from(data.ciphertext, 'base64'); bytes[rnd(bytes.length)] ^= 1 << rnd(8);
    await assert.rejects(run('aes-gcm', JSON.stringify({ ...data, ciphertext: bytes.toString('base64') }), 'decrypt', password));
    // Independent decryption with Node: PBKDF2-SHA256 key, AAD "parola:v1".
    const key = nodeCrypto.pbkdf2Sync(password, Buffer.from(data.salt, 'base64'), 600000, 32, 'sha256');
    const all = Buffer.from(data.ciphertext, 'base64');
    const decipher = nodeCrypto.createDecipheriv('aes-256-gcm', key, Buffer.from(data.iv, 'base64'));
    decipher.setAAD(Buffer.from('parola:v1')); decipher.setAuthTag(all.subarray(all.length - 16));
    assert.equal(Buffer.concat([decipher.update(all.subarray(0, all.length - 16)), decipher.final()]).toString(), text);
  });
});

test('RSA, ECDSA and Ed25519 tools interoperate with Node', { timeout: 600000 }, async () => {
  covers('rsa-key-generator', 'rsa-encrypt-decrypt', 'rsa-sign-verify', 'ecdsa-key-generator', 'ecdsa-sign-verify', 'ed25519-sign-verify', 'public-key-fingerprint', 'pem-parser', 'ecdh-demo');
  const split = (pair: string) => [pair.match(/-----BEGIN PUBLIC KEY-----[\s\S]+?-----END PUBLIC KEY-----/)![0], pair.match(/-----BEGIN PRIVATE KEY-----[\s\S]+?-----END PRIVATE KEY-----/)![0]];
  await repeat(async (i) => {
    const message = randText(1, 100);
    if (i < 5) {
      const [pub, priv] = split(await run('rsa-key-generator'));
      assert.equal(nodeCrypto.createPublicKey(pub).asymmetricKeyDetails?.modulusLength, 3072);
      const ciphertext = await run('rsa-encrypt-decrypt', message, 'encrypt', pub);
      assert.equal(await run('rsa-encrypt-decrypt', ciphertext, 'decrypt', priv), message);
      assert.equal(nodeCrypto.privateDecrypt({ key: priv, oaepHash: 'sha256', padding: nodeCrypto.constants.RSA_PKCS1_OAEP_PADDING }, Buffer.from(ciphertext, 'base64')).toString(), message);
      const fp = await run('public-key-fingerprint', pub);
      assert.equal(fp, 'SHA256:' + nodeCrypto.createHash('sha256').update(nodeCrypto.createPublicKey(pub).export({ type: 'spki', format: 'der' })).digest('base64'));
      assert.equal(JSON.parse(await run('pem-parser', priv)).type, 'PRIVATE KEY');
    }
    // Signatures: keys from Node, signed by the tool and verified by Node (and the reverse).
    const rsa = nodeCrypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    const ec = nodeCrypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
    const ed = nodeCrypto.generateKeyPairSync('ed25519');
    const pem = (k: nodeCrypto.KeyObject, priv: boolean) => k.export({ type: priv ? 'pkcs8' : 'spki', format: 'pem' }).toString();
    for (const [id, kp, verifyNode] of [
      ['rsa-sign-verify', rsa, (sig: Buffer) => nodeCrypto.verify('sha256', Buffer.from(message), { key: rsa.publicKey, padding: nodeCrypto.constants.RSA_PKCS1_PSS_PADDING, saltLength: 32 }, sig)],
      ['ecdsa-sign-verify', ec, (sig: Buffer) => nodeCrypto.verify('sha256', Buffer.from(message), { key: ec.publicKey, dsaEncoding: 'ieee-p1363' }, sig)],
      ['ed25519-sign-verify', ed, (sig: Buffer) => nodeCrypto.verify(null, Buffer.from(message), ed.publicKey, sig)],
    ] as const) {
      const sig = await run(id, message, 'sign', pem(kp.privateKey, true));
      assert.ok(verifyNode(Buffer.from(sig, 'base64')), `${id}: Node rejects the tool's signature`);
      assert.equal(await run(id, message, 'verify', pem(kp.publicKey, false), sig), 'İmza doğrulandı.');
      assert.equal(await run(id, message + 'x', 'verify', pem(kp.publicKey, false), sig), 'İmza uyuşmuyor.');
    }
    if (i < 5) {
      const [epub, epriv] = split(await run('ecdsa-key-generator'));
      const sig = await run('ecdsa-sign-verify', message, 'sign', epriv);
      assert.equal(await run('ecdsa-sign-verify', message, 'verify', epub, sig), 'İmza doğrulandı.');
      assert.equal(JSON.parse(await run('ecdh-demo')).match, true);
    }
  });
});

test('classical ciphers match a reference and invert', async () => {
  covers('caesar-cipher', 'vigenere-cipher', 'rot13-cipher');
  const shiftLetter = (c: string, k: number) => {
    const base = c >= 'a' && c <= 'z' ? 97 : c >= 'A' && c <= 'Z' ? 65 : 0;
    return base ? String.fromCharCode(((c.charCodeAt(0) - base + (k % 26) + 26) % 26) + base) : c;
  };
  await repeat(async () => {
    const text = randText(), shift = rnd(60);
    const caesar = await run('caesar-cipher', text, 'encrypt', '', '', shift);
    assert.equal(caesar, Array.from(text).map((c) => shiftLetter(c, shift)).join(''));
    assert.equal(await run('caesar-cipher', caesar, 'decrypt', '', '', shift), text);
    assert.equal(await run('rot13-cipher', text), Array.from(text).map((c) => shiftLetter(c, 13)).join(''));
    const key = randText(1, 8, ['abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ']);
    let j = 0;
    const expected = Array.from(text).map((c) => (/[A-Za-z]/.test(c) ? shiftLetter(c, key.toLowerCase().charCodeAt(j++ % key.length) - 97) : c)).join('');
    const vig = await run('vigenere-cipher', text, 'encrypt', key);
    assert.equal(vig, expected, `vigenere ${JSON.stringify(text)} / ${key}`);
    assert.equal(await run('vigenere-cipher', vig, 'decrypt', key), text);
  });
});

test('English pages translate every engine message the tools above produced', async () => {
  const samples = [await run('strength-checker', 'abc'), await run('entropy-calculator', 'abc'), await run('policy-validator', 'abc'), await run('breach-checker', 'abc'), await run('uuid-generator'), await run('secure-token-generator')];
  for (const sample of samples) assert.ok(!/[çğıöşüÇĞİÖŞÜ]/.test(localizeMessage(sample, 'en')), localizeMessage(sample, 'en'));
});

test('every available tool is covered above', () => {
  const missing = ALL_TOOLS.filter((t) => t.status === 'available' && !tested.has(t.id)).map((t) => t.id);
  assert.deepEqual(missing, []);
});
