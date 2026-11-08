// English counterpart of TOOL_UI in tool-ui.ts, generated from it with the same structure (a test keeps them in sync).
import type { InputKey,InputSpec,ToolUi } from './tool-ui';

const text = (label: InputSpec['label'], extra: Partial<InputSpec> = {}): InputSpec => ({ key: 'inputVal', label, kind: 'textarea', rows: 4, ...extra });
const secret = (key: InputKey, label: string, extra: Partial<InputSpec> = {}): InputSpec => ({ key, label, kind: 'secret', ...extra });
const pem = (key: InputKey, label: string | Record<string, string>, extra: Partial<InputSpec> = {}): InputSpec => ({ key, label, kind: 'textarea', rows: 6, mono: true, placeholder: '-----BEGIN …-----', ...extra });

const ENCODE = [{ value: 'encode', label: 'Encode' }, { value: 'decode', label: 'Decode' }];
const CRYPT = [{ value: 'encrypt', label: 'Encrypt' }, { value: 'decrypt', label: 'Decrypt' }];
const HMAC = [{ value: 'sha256', label: 'SHA-256' }, { value: 'sha512', label: 'SHA-512' }];
const SIGN = [{ value: 'sign', label: 'Sign' }, { value: 'verify', label: 'Verify' }];

const KDF_PARAMS: Record<string, string> = {
  bcrypt: 'bcrypt, cost 12 (2¹² rounds), random 16-byte salt. Password at most 72 UTF-8 bytes.',
  argon2: 'm = 19,456 KiB (19 MiB), t = 2, p = 1, random 16-byte salt, 32-byte output (OWASP recommendation).',
  scrypt: 'N = 2¹⁷, r = 8, p = 1, random 16-byte salt, 32-byte output.',
  'pbkdf2-sha256': '600,000 iterations, random 16-byte salt, 32-byte output.',
  'pbkdf2-sha512': '220,000 iterations, random 16-byte salt, 32-byte output.',
  'pbkdf2-sha1': '1,300,000 iterations, random 16-byte salt, 32-byte output. For legacy compatibility only.',
};

function kdfGenerator(params: string): ToolUi {
  return {
    inputs: [secret('inputVal', 'Password', { placeholder: 'Password to hash' })],
    action: 'Create hash',
    resultLabel: 'Encoded hash',
    params,
    note: 'Each run uses a new salt, so the same password gives a different hash. Store the whole output to verify later.',
  };
}

function kdfVerifier(placeholder: string): ToolUi {
  return {
    inputs: [secret('inputVal', 'Password'), { key: 'secondaryInput', label: 'Stored hash', kind: 'text', mono: true, placeholder }],
    action: 'Verify',
    result: 'verdict',
  };
}

const HASH_NOTE = 'For file hashes, HMAC and other algorithms, use the hash calculator page.';
const hashTool = (name: string): ToolUi => ({ inputs: [text('Text', { placeholder: 'Text to hash' })], action: 'Compute', resultLabel: `${name} (hex)`, note: HASH_NOTE });
const generate = (action: string, resultLabel: string): ToolUi => ({ inputs: [], action, resultLabel });

export const TOOL_UI_EN: Record<string, ToolUi> = {
  'strength-checker': { inputs: [secret('inputVal', 'Password')], action: 'Analyze', result: 'report', resultLabel: 'Analysis', note: 'The analysis is based on the zxcvbn pattern model; it does not guarantee a real cracking time.' },
  'entropy-calculator': { inputs: [secret('inputVal', 'Password')], action: 'Compute', result: 'report', resultLabel: 'Search space', note: 'An upper bound is computed from the unique characters in the input; for human-chosen passwords the real entropy is much lower.' },
  'policy-validator': { inputs: [secret('inputVal', 'Password')], action: 'Check', result: 'report', resultLabel: 'Policy result' },
  'breach-checker': { inputs: [secret('inputVal', 'Password')], action: 'Compute prefix', result: 'report', resultLabel: 'SHA-1 prefix', note: 'No database is queried; only the 5-character prefix used in k-anonymity lookups is computed locally.' },
  'hash-verifier': { inputs: [secret('inputVal', 'Password or text'), { key: 'secondaryInput', label: 'Hash', kind: 'text', mono: true, placeholder: 'MD5 / SHA-1 / SHA-256 hex or an encoded hash such as $argon2id$…' }], action: 'Verify', result: 'verdict' },
  'match-checker': { inputs: [secret('inputVal', 'First password'), secret('secondaryInput', 'Second password')], action: 'Compare', result: 'verdict' },

  'bcrypt-generator': kdfGenerator(KDF_PARAMS.bcrypt),
  'bcrypt-verifier': kdfVerifier('$2b$12$…'),
  'argon2id-generator': kdfGenerator(KDF_PARAMS.argon2),
  'argon2id-verifier': kdfVerifier('$argon2id$v=19$m=19456,t=2,p=1$…'),
  'argon2i-generator': kdfGenerator(KDF_PARAMS.argon2),
  'argon2d-generator': kdfGenerator(KDF_PARAMS.argon2),
  'scrypt-generator': kdfGenerator(KDF_PARAMS.scrypt),
  'scrypt-verifier': kdfVerifier('$scrypt$ln=17,r=8,p=1$…'),
  'pbkdf2-sha256': kdfGenerator(KDF_PARAMS['pbkdf2-sha256']),
  'pbkdf2-sha512': kdfGenerator(KDF_PARAMS['pbkdf2-sha512']),
  'pbkdf2-sha1': kdfGenerator(KDF_PARAMS['pbkdf2-sha1']),
  'hash-identifier': { inputs: [{ key: 'inputVal', label: 'Hash value', kind: 'text', mono: true, placeholder: 'E.g. 5f4dcc3b5aa765d61d8327deb882cf99' }], action: 'Identify', result: 'report', resultLabel: 'Possible formats', note: 'Only the length and character set are examined; results are probabilities.' },

  'hash-md5': { ...hashTool('MD5'), note: 'MD5 is vulnerable to collisions; use it only for legacy compatibility or corruption checks. ' + HASH_NOTE },
  'hash-sha1': { ...hashTool('SHA-1'), note: 'SHA-1 is vulnerable to collisions; prefer SHA-256 in new systems. ' + HASH_NOTE },
  'hash-sha224': hashTool('SHA-224'),
  'hash-sha256': hashTool('SHA-256'),
  'hash-sha384': hashTool('SHA-384'),
  'hash-sha512': hashTool('SHA-512'),
  'hash-sha3-224': hashTool('SHA3-224'),
  'hash-sha3-256': hashTool('SHA3-256'),
  'hash-sha3-384': hashTool('SHA3-384'),
  'hash-sha3-512': hashTool('SHA3-512'),
  'hash-blake2b': hashTool('BLAKE2b-512'),
  'hash-blake3': hashTool('BLAKE3'),

  'jwt-encoder': {
    inputs: [
      text('Payload (JSON)', { mono: true, rows: 6, placeholder: '{\n  "sub": "1234",\n  "exp": 1893456000\n}' }),
      secret('secondaryInput', 'Secret key', { hint: 'At least 32 bytes for HS256.' }),
    ],
    action: 'Sign',
    resultLabel: 'JWT (HS256)',
  },
  'jwt-verifier': {
    inputs: [
      text('Token', { mono: true, rows: 4, placeholder: 'eyJhbGciOi…' }),
      secret('secondaryInput', 'Secret key'),
      { key: 'tertiaryInput', label: 'Expected iss / aud', kind: 'text', mono: true, optional: true, placeholder: '{"iss":"https://auth.example.com","aud":"api"}', hint: 'Optional. When given, the issuer and audience are checked too.' },
    ],
    action: 'Verify',
  },
  'uuid-generator': generate('Generate', 'UUID'),
  'nanoid-generator': generate('Generate', 'NanoID (21 characters)'),
  'base64-tool': { inputs: [text('Text', { placeholder: { encode: 'Text to encode', decode: 'Base64 value' } })], modes: ENCODE, action: { encode: 'Encode', decode: 'Decode' }, resultLabel: 'Result' },
  'hex-tool': { inputs: [text({ encode: 'Text', decode: 'Hex' }, { placeholder: { encode: 'Text to convert to hex', decode: '48656c6c6f' } })], modes: ENCODE, action: { encode: 'To hex', decode: 'To text' }, resultLabel: 'Result', note: 'Encoding uses the UTF-8 bytes of the text; decoding ignores spaces, colons and a 0x prefix.' },
  'url-tool': { inputs: [text('Text', { placeholder: { encode: 'Text to encode', decode: 'Percent-encoded text' } })], modes: ENCODE, action: { encode: 'Encode', decode: 'Decode' }, resultLabel: 'Result' },
  'html-entity-tool': { inputs: [text('Text', { placeholder: { encode: '<a href="…">', decode: '&lt;a href=&quot;…&quot;&gt;' } })], modes: ENCODE, action: { encode: 'Escape', decode: 'Decode' }, resultLabel: 'Result', note: 'Encoding escapes & < > " \'. Decoding supports the basic named entities and &#…; numeric references.' },
  'secure-token-generator': generate('Generate', '256-bit token'),
  'hotp-generator': {
    inputs: [
      { key: 'inputVal', label: 'Secret key (Base32)', kind: 'secret', mono: true, placeholder: 'JBSWY3DPEHPK3PXP' },
      { key: 'optionNumber', label: 'Counter', kind: 'number', hint: 'RFC 4226: starts at 0 and increases by one with each use.' },
    ],
    action: 'Generate code',
    resultLabel: 'HOTP code',
  },
  'api-key-generator': generate('Generate', 'API key'),
  'csrf-token-generator': generate('Generate', 'CSRF token'),

  'aes-gcm': {
    inputs: [
      text({ encrypt: 'Text', decrypt: 'Encrypted data (JSON)' }, { mono: false, rows: 5, placeholder: { encrypt: 'Text to encrypt', decrypt: '{"v":1,"kdf":"PBKDF2-SHA256",…}' } }),
      secret('secondaryInput', 'Password'),
    ],
    modes: CRYPT,
    action: { encrypt: 'Encrypt', decrypt: 'Decrypt' },
    resultLabel: 'Result',
    params: 'AES-256-GCM · key from PBKDF2-SHA256 with 600,000 iterations · 16-byte salt · 12-byte IV · authentication tag.',
    note: 'The encrypted output is JSON carrying the salt, IV and parameters; to decrypt, enter all of it and the same password.',
  },
  'rsa-key-generator': { ...generate('Generate key pair', 'Key pair (PEM)'), params: 'RSA-OAEP · 3072 bit · SHA-256 · SPKI / PKCS#8 PEM.', note: 'Keep the private key only somewhere you trust.' },
  'rsa-encrypt-decrypt': {
    inputs: [
      text({ encrypt: 'Text', decrypt: 'Ciphertext (Base64)' }, { rows: 4 }),
      pem('secondaryInput', { encrypt: 'Public key (SPKI PEM)', decrypt: 'Private key (PKCS#8 PEM)' }),
    ],
    modes: CRYPT,
    action: { encrypt: 'Encrypt', decrypt: 'Decrypt' },
    resultLabel: 'Result',
    params: 'RSA-OAEP, SHA-256.',
  },
  'ecdsa-key-generator': { ...generate('Generate key pair', 'Key pair (PEM)'), params: 'ECDSA · P-256 · SPKI / PKCS#8 PEM.' },
  'caesar-cipher': { inputs: [text('Text'), { key: 'optionNumber', label: 'Shift', kind: 'number' }], modes: CRYPT, action: { encrypt: 'Encrypt', decrypt: 'Decrypt' }, resultLabel: 'Result', note: 'Educational only; it does not protect data.' },
  'vigenere-cipher': { inputs: [text('Text'), { key: 'secondaryInput', label: 'Key', kind: 'text', placeholder: 'Latin letters only' }], modes: CRYPT, action: { encrypt: 'Encrypt', decrypt: 'Decrypt' }, resultLabel: 'Result', note: 'Educational only; it does not protect data.' },
  'rot13-cipher': { inputs: [text('Text')], action: 'Convert', resultLabel: 'ROT13', note: 'ROT13 is its own inverse: applying it again restores the text. Educational only.' },

  'hkdf-tool': {
    inputs: [
      secret('inputVal', 'Input key material (IKM)'),
      { key: 'secondaryInput', label: 'Salt', kind: 'text', mono: true, optional: true },
      { key: 'tertiaryInput', label: 'Info (context)', kind: 'text', mono: true, optional: true },
    ],
    action: 'Derive',
    resultLabel: 'Derived key (32 bytes, hex)',
    params: 'HKDF-SHA256 (RFC 5869). Inputs are taken as UTF-8 text.',
  },
  'hmac-generator': { inputs: [text('Message'), secret('secondaryInput', 'Key')], modes: HMAC, action: 'Compute', resultLabel: 'HMAC (hex)' },
  'hmac-verifier': { inputs: [text('Message'), secret('secondaryInput', 'Key'), { key: 'tertiaryInput', label: 'Expected HMAC (hex)', kind: 'text', mono: true }], modes: HMAC, action: 'Verify', result: 'verdict' },
  'checksum-verifier': { inputs: [text('Text'), { key: 'secondaryInput', label: 'Expected value (hex)', kind: 'text', mono: true, placeholder: { crc32: '8 hex characters, e.g. 352441c2', adler32: '8 hex characters, e.g. 024d0127' } }], modes: [{ value: 'crc32', label: 'CRC32' }, { value: 'adler32', label: 'Adler-32' }], action: 'Verify', result: 'verdict', note: 'Checksums catch accidental corruption; to protect against deliberate changes, use SHA-256 or HMAC.' },
  'keccak256-tool': { ...hashTool('Keccak-256'), note: 'The original Keccak used by Ethereum; not the same as NIST SHA3-256.' },
  'ripemd160-tool': hashTool('RIPEMD-160'),

  'rsa-sign-verify': signTool('RSA-PSS, SHA-256, 32-byte salt.'),
  'ecdsa-sign-verify': signTool('ECDSA P-256, SHA-256.'),
  'ed25519-sign-verify': {
    ...signTool('Ed25519. Requires browser support.'),
    modes: [...SIGN, { value: 'generate', label: 'Generate key' }],
    action: { sign: 'Sign', verify: 'Verify', generate: 'Generate key pair' },
  },
  'pem-parser': { inputs: [pem('inputVal', 'PEM')], action: 'Inspect', result: 'report', resultLabel: 'PEM details', note: 'Only the PEM container is read; the certificate chain is not validated.' },
  'public-key-fingerprint': { inputs: [pem('inputVal', 'Public key (SPKI PEM)', { placeholder: '-----BEGIN PUBLIC KEY-----' })], action: 'Compute', resultLabel: 'SHA-256 fingerprint' },
  'ecdh-demo': { ...generate('Run', 'Result'), result: 'report', note: 'Two ephemeral P-256 key pairs are generated and both sides are shown to reach the same shared secret. The secret itself is not shown.' },
};

function signTool(params: string): ToolUi {
  return {
    inputs: [
      text('Message', { modes: ['sign', 'verify'] }),
      pem('secondaryInput', { sign: 'Private key (PKCS#8 PEM)', verify: 'Public key (SPKI PEM)' }, { modes: ['sign', 'verify'] }),
      { key: 'tertiaryInput', label: 'Signature (Base64)', kind: 'text', mono: true, modes: ['verify'] },
    ],
    modes: SIGN,
    action: { sign: 'Sign', verify: 'Verify' },
    resultLabel: 'Signature (Base64)',
    params,
  };
}

