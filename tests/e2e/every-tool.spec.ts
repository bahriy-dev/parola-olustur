import { expect,test,type Page } from '@playwright/test';
import bcrypt from 'bcryptjs';
import * as nodeCrypto from 'node:crypto';
import { HASH_TOOL_SLUGS } from '../../src/lib/hash-tool-routes';
import { localizePath } from '../../src/lib/i18n/routing';
import { ALL_TOOLS } from '../../src/lib/tools-registry';

// Opens every available tool page in both languages, fills it with valid input, runs it and checks that a
// result appears without an error. Correctness of the values is covered by tests/tools.fuzz.ts.
const rsa = nodeCrypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const ec = nodeCrypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
const ed = nodeCrypto.generateKeyPairSync('ed25519');
const pem = (k: nodeCrypto.KeyObject, priv: boolean) => k.export({ type: priv ? 'pkcs8' : 'spki', format: 'pem' }).toString();
const rsaOaep = nodeCrypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const b64 = (b: Buffer) => b.toString('base64').replace(/=+$/, '');
const salt = nodeCrypto.randomBytes(16);
const argon = `$argon2id$v=19$m=19456,t=2,p=1$${b64(salt)}$${b64(nodeCrypto.argon2Sync('argon2id', { message: 'parola', nonce: salt, parallelism: 1, tagLength: 32, memory: 19456, passes: 2 }))}`;
const scrypt = `$scrypt$ln=14,r=8,p=1$${b64(salt)}$${b64(nodeCrypto.scryptSync('parola', salt, 32, { N: 2 ** 14, r: 8, p: 1 }))}`;
const jwtSecret = 'k'.repeat(32);
const jwtBody = `${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')}.${Buffer.from('{"sub":"1"}').toString('base64url')}`;
const jwt = `${jwtBody}.${nodeCrypto.createHmac('sha256', jwtSecret).update(jwtBody).digest('base64url')}`;

/** Values for the visible text fields, in page order. Tools not listed need no input. */
const INPUTS: Record<string, string[]> = {
  'strength-checker': ['Correct-Horse-9!'], 'entropy-calculator': ['Correct-Horse-9!'], 'policy-validator': ['Correct-Horse-9!'], 'breach-checker': ['parola'],
  'hash-verifier': ['abc', 'a9993e364706816aba3e25717850c26c9cd0d89d'], 'match-checker': ['abc', 'abc'],
  'bcrypt-generator': ['parola'], 'bcrypt-verifier': ['parola', bcrypt.hashSync('parola', 4)], 'argon2id-generator': ['parola'], 'argon2id-verifier': ['parola', argon],
  'argon2i-generator': ['parola'], 'argon2d-generator': ['parola'], 'scrypt-generator': ['parola'], 'scrypt-verifier': ['parola', scrypt],
  'pbkdf2-sha256': ['parola'], 'pbkdf2-sha512': ['parola'], 'pbkdf2-sha1': ['parola'], 'hash-identifier': ['5f4dcc3b5aa765d61d8327deb882cf99'],
  'jwt-encoder': ['{"sub":"1"}', jwtSecret], 'jwt-verifier': [jwt, jwtSecret, ''], 'jwt-decoder': [jwt],
  'base64-tool': ['merhaba dünya'], 'hex-tool': ['merhaba'], 'url-tool': ['a b&c'], 'html-entity-tool': ['<a href="x">'],
  'totp-generator': ['JBSWY3DPEHPK3PXP'], 'hotp-generator': ['JBSWY3DPEHPK3PXP', '1'], 'aes-gcm': ['gizli metin', 'parola'],
  'rsa-encrypt-decrypt': ['merhaba', pem(rsaOaep.publicKey, false)], 'rsa-sign-verify': ['mesaj', pem(rsa.privateKey, true)],
  'ecdsa-sign-verify': ['mesaj', pem(ec.privateKey, true)], 'ed25519-sign-verify': ['mesaj', pem(ed.privateKey, true)],
  'caesar-cipher': ['Merhaba', '3'], 'vigenere-cipher': ['Merhaba', 'ANAHTAR'], 'rot13-cipher': ['Hello'], 'hkdf-tool': ['ikm', 'salt', 'info'],
  'hmac-generator': ['mesaj', 'anahtar'], 'hmac-verifier': ['mesaj', 'anahtar', nodeCrypto.createHmac('sha256', 'anahtar').update('mesaj').digest('hex')],
  'checksum-verifier': ['abc', '352441c2'], 'keccak256-tool': ['abc'], 'public-key-fingerprint': [pem(rsa.publicKey, false)], 'pem-parser': [pem(rsa.publicKey, false)],
};
const GENERATOR_PAGES = new Set(['password-generator', 'strong-password-generator', 'passphrase-generator', 'pin-generator']);

async function fillAndRun(page: Page, values: string[]) {
  const form = page.locator('main form').first();
  const fields = form.locator('textarea:not([readonly]), input:not([type=file]):not([type=search]):not([type=checkbox]):not([type=range])');
  for (let i = 0; i < values.length; i++) await fields.nth(i).fill(values[i]);
  await form.locator('button[type=submit]').click();
}

for (const lang of ['tr', 'en'] as const) {
  for (const tool of ALL_TOOLS.filter((t) => t.status === 'available')) {
    test(`${lang} ${tool.id} runs and shows a result`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'chromium', 'Tool sweep runs once, in Chromium.');
      test.setTimeout(60000);
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      const path = HASH_TOOL_SLUGS[tool.id] ? `/hash/${HASH_TOOL_SLUGS[tool.id]}` : `/araclar/${tool.id}`;
      await page.goto(localizePath(path, lang));
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      const main = page.locator('main');

      if (GENERATOR_PAGES.has(tool.id)) {
        await expect(main.locator('output').first()).not.toHaveText(/^—?$/);
      } else if (HASH_TOOL_SLUGS[tool.id]) {
        await fillAndRun(page, ['abc']);
        await expect(main.locator('ul li p.font-mono').first()).toHaveText(/^[0-9a-f]{20,}$/);
      } else if (tool.id === 'jwt-decoder') {
        await main.locator('textarea').first().fill(jwt);
        await expect(main.getByText('"sub"').first()).toBeVisible();
      } else if (tool.id === 'totp-generator') {
        await fillAndRun(page, INPUTS[tool.id]);
        await expect(main.locator('output')).toHaveText(/^\d{3} \d{3}$/);
      } else {
        await fillAndRun(page, INPUTS[tool.id] ?? []);
        // Any of: an output box, a report, or a status verdict; never an error.
        await expect(main.locator('textarea[readonly], [role=status], dl, p.whitespace-pre-wrap').first()).toBeVisible({ timeout: 30000 });
        await expect(main.locator('[role=status]').filter({ hasText: /uyuşmuyor|eşleşmiyor|farklı|does not match|no match|different|geçersiz|invalid/i })).toHaveCount(0);
      }
      await expect(main.locator('[role=alert]')).toHaveCount(0);
      if (lang === 'en') expect(await main.innerText()).not.toMatch(/Hesapla|Sonuç|Kopyala|Doğrula|Şifrele|Parametreler/);
      expect(errors).toEqual([]);
    });
  }
}
