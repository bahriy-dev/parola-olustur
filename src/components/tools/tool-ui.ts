// Per-tool form description. ToolRunner renders these with the shared form components, so each
// tool gets labels, modes and result presentation that match its purpose without bespoke markup.

export type InputKey = 'inputVal' | 'secondaryInput' | 'tertiaryInput' | 'optionNumber';

export interface InputSpec {
  key: InputKey;
  label: string | Record<string, string>;
  kind: 'textarea' | 'text' | 'secret' | 'number';
  placeholder?: string | Record<string, string>;
  hint?: string;
  rows?: number;
  mono?: boolean;
  optional?: boolean;
  /** Only shown for these modes. */
  modes?: string[];
}

export type ResultKind = 'value' | 'report' | 'verdict';

export interface ToolUi {
  inputs: InputSpec[];
  modes?: { value: string; label: string }[];
  action: string | Record<string, string>;
  resultLabel?: string;
  result?: ResultKind;
  /** Fixed parameters the computation uses, shown so the output can be reproduced elsewhere. */
  params?: string;
  note?: string;
}

const text = (label: InputSpec['label'], extra: Partial<InputSpec> = {}): InputSpec => ({ key: 'inputVal', label, kind: 'textarea', rows: 4, ...extra });
const secret = (key: InputKey, label: string, extra: Partial<InputSpec> = {}): InputSpec => ({ key, label, kind: 'secret', ...extra });
const pem = (key: InputKey, label: string | Record<string, string>, extra: Partial<InputSpec> = {}): InputSpec => ({ key, label, kind: 'textarea', rows: 6, mono: true, placeholder: '-----BEGIN …-----', ...extra });

const ENCODE = [{ value: 'encode', label: 'Kodla' }, { value: 'decode', label: 'Çöz' }];
const CRYPT = [{ value: 'encrypt', label: 'Şifrele' }, { value: 'decrypt', label: 'Çöz' }];
const HMAC = [{ value: 'sha256', label: 'SHA-256' }, { value: 'sha512', label: 'SHA-512' }];
const SIGN = [{ value: 'sign', label: 'İmzala' }, { value: 'verify', label: 'Doğrula' }];

const KDF_PARAMS: Record<string, string> = {
  bcrypt: 'bcrypt, maliyet 12 (2¹² tur), rastgele 16 bayt salt. Parola en fazla 72 UTF-8 bayt.',
  argon2: 'm = 19 456 KiB (19 MiB), t = 2, p = 1, 16 bayt rastgele salt, 32 bayt çıktı (OWASP önerisi).',
  scrypt: 'N = 2¹⁷, r = 8, p = 1, 16 bayt rastgele salt, 32 bayt çıktı.',
  'pbkdf2-sha256': '600 000 iterasyon, 16 bayt rastgele salt, 32 bayt çıktı.',
  'pbkdf2-sha512': '220 000 iterasyon, 16 bayt rastgele salt, 32 bayt çıktı.',
  'pbkdf2-sha1': '1 300 000 iterasyon, 16 bayt rastgele salt, 32 bayt çıktı. Yalnız eski sistemlerle uyumluluk için.',
};

function kdfGenerator(params: string): ToolUi {
  return {
    inputs: [secret('inputVal', 'Parola', { placeholder: 'Hashlenecek parola' })],
    action: 'Hash oluştur',
    resultLabel: 'Encoded hash',
    params,
    note: 'Her çalıştırmada yeni bir salt kullanılır; aynı parola farklı hash üretir. Doğrulama için çıktının tamamını saklayın.',
  };
}

function kdfVerifier(placeholder: string): ToolUi {
  return {
    inputs: [secret('inputVal', 'Parola'), { key: 'secondaryInput', label: 'Saklanan hash', kind: 'text', mono: true, placeholder }],
    action: 'Doğrula',
    result: 'verdict',
  };
}

const HASH_NOTE = 'Dosya hash’i, HMAC ve diğer algoritmalar için Hash hesaplama sayfasını kullanın.';
const hashTool = (name: string): ToolUi => ({ inputs: [text('Metin', { placeholder: 'Hash’i alınacak metin' })], action: 'Hesapla', resultLabel: `${name} (hex)`, note: HASH_NOTE });
const generate = (action: string, resultLabel: string): ToolUi => ({ inputs: [], action, resultLabel });

export const TOOL_UI: Record<string, ToolUi> = {
  'strength-checker': { inputs: [secret('inputVal', 'Parola')], action: 'Analiz et', result: 'report', resultLabel: 'Analiz', note: 'Analiz zxcvbn örüntü modeline dayanır; gerçek kırılma süresini garanti etmez.' },
  'entropy-calculator': { inputs: [secret('inputVal', 'Parola')], action: 'Hesapla', result: 'report', resultLabel: 'Arama alanı', note: 'Girilen metindeki benzersiz karakterlerden üst sınır hesaplanır; insan seçimi parolalarda gerçek entropi çok daha düşüktür.' },
  'policy-validator': { inputs: [secret('inputVal', 'Parola')], action: 'Denetle', result: 'report', resultLabel: 'Politika sonucu' },
  'breach-checker': { inputs: [secret('inputVal', 'Parola')], action: 'Ön eki hesapla', result: 'report', resultLabel: 'SHA-1 ön eki', note: 'Hiçbir veritabanına sorgu gönderilmez; yalnız k-anonimlik sorgularında kullanılan 5 karakterlik ön ek yerelde hesaplanır.' },
  'hash-verifier': { inputs: [secret('inputVal', 'Parola veya metin'), { key: 'secondaryInput', label: 'Hash', kind: 'text', mono: true, placeholder: 'MD5 / SHA-1 / SHA-256 hex veya $argon2id$… encoded hash' }], action: 'Doğrula', result: 'verdict' },
  'match-checker': { inputs: [secret('inputVal', 'Birinci parola'), secret('secondaryInput', 'İkinci parola')], action: 'Karşılaştır', result: 'verdict' },

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
  'hash-identifier': { inputs: [{ key: 'inputVal', label: 'Hash değeri', kind: 'text', mono: true, placeholder: 'Örn. 5f4dcc3b5aa765d61d8327deb882cf99' }], action: 'Tanımla', result: 'report', resultLabel: 'Olası biçimler', note: 'Yalnız uzunluk ve karakter kümesine bakılır; sonuçlar olasılıktır.' },

  'hash-md5': { ...hashTool('MD5'), note: 'MD5 çarpışmaya açıktır; yalnız eski sistemlerle uyumluluk veya bozulma kontrolü için kullanın. ' + HASH_NOTE },
  'hash-sha1': { ...hashTool('SHA-1'), note: 'SHA-1 çarpışmaya açıktır; yeni sistemlerde SHA-256 tercih edin. ' + HASH_NOTE },
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
      secret('secondaryInput', 'Gizli anahtar', { hint: 'HS256 için en az 32 bayt.' }),
    ],
    action: 'İmzala',
    resultLabel: 'JWT (HS256)',
  },
  'jwt-verifier': {
    inputs: [
      text('Token', { mono: true, rows: 4, placeholder: 'eyJhbGciOi…' }),
      secret('secondaryInput', 'Gizli anahtar'),
      { key: 'tertiaryInput', label: 'Beklenen iss / aud', kind: 'text', mono: true, optional: true, placeholder: '{"iss":"https://auth.example.com","aud":"api"}', hint: 'İsteğe bağlı. Girilirse issuer ve audience da denetlenir.' },
    ],
    action: 'Doğrula',
  },
  'uuid-generator': generate('Oluştur', 'UUID'),
  'nanoid-generator': generate('Oluştur', 'NanoID (21 karakter)'),
  'base64-tool': { inputs: [text('Metin', { placeholder: { encode: 'Kodlanacak metin', decode: 'Base64 değer' } })], modes: ENCODE, action: { encode: 'Kodla', decode: 'Çöz' }, resultLabel: 'Sonuç' },
  'hex-tool': { inputs: [text({ encode: 'Metin', decode: 'Hex' }, { placeholder: { encode: 'Hex’e çevrilecek metin', decode: '48656c6c6f' } })], modes: ENCODE, action: { encode: 'Hex’e çevir', decode: 'Metne çevir' }, resultLabel: 'Sonuç', note: 'Kodlamada metnin UTF-8 baytları kullanılır; çözmede boşluk, iki nokta ve 0x ön eki yok sayılır.' },
  'url-tool': { inputs: [text('Metin', { placeholder: { encode: 'Kodlanacak metin', decode: 'Yüzde kodlu metin' } })], modes: ENCODE, action: { encode: 'Kodla', decode: 'Çöz' }, resultLabel: 'Sonuç' },
  'html-entity-tool': { inputs: [text('Metin', { placeholder: { encode: '<a href="…">', decode: '&lt;a href=&quot;…&quot;&gt;' } })], modes: ENCODE, action: { encode: 'Kaçışla', decode: 'Çöz' }, resultLabel: 'Sonuç', note: 'Kodlama & < > " \' karakterlerini kaçışlar. Çözme adlandırılmış temel varlıkları ve &#…; sayısal referansları destekler.' },
  'secure-token-generator': generate('Oluştur', '256 bit token'),
  'hotp-generator': {
    inputs: [
      { key: 'inputVal', label: 'Gizli anahtar (Base32)', kind: 'secret', mono: true, placeholder: 'JBSWY3DPEHPK3PXP' },
      { key: 'optionNumber', label: 'Sayaç', kind: 'number', hint: 'RFC 4226: 0’dan başlar ve her kullanımda bir artar.' },
    ],
    action: 'Kod üret',
    resultLabel: 'HOTP kodu',
  },
  'api-key-generator': generate('Oluştur', 'API anahtarı'),
  'csrf-token-generator': generate('Oluştur', 'CSRF token'),

  'aes-gcm': {
    inputs: [
      text({ encrypt: 'Metin', decrypt: 'Şifreli veri (JSON)' }, { mono: false, rows: 5, placeholder: { encrypt: 'Şifrelenecek metin', decrypt: '{"v":1,"kdf":"PBKDF2-SHA256",…}' } }),
      secret('secondaryInput', 'Parola'),
    ],
    modes: CRYPT,
    action: { encrypt: 'Şifrele', decrypt: 'Çöz' },
    resultLabel: 'Sonuç',
    params: 'AES-256-GCM · anahtar PBKDF2-SHA256 ile 600 000 iterasyon · 16 bayt salt · 12 bayt IV · doğrulama etiketli.',
    note: 'Şifreli çıktı salt, IV ve parametreleri içeren JSON’dur; çözmek için tamamını ve aynı parolayı girin.',
  },
  'rsa-key-generator': { ...generate('Anahtar çifti oluştur', 'Anahtar çifti (PEM)'), params: 'RSA-OAEP · 3072 bit · SHA-256 · SPKI / PKCS#8 PEM.', note: 'Özel anahtarı yalnız güvendiğiniz bir yerde saklayın.' },
  'rsa-encrypt-decrypt': {
    inputs: [
      text({ encrypt: 'Metin', decrypt: 'Şifreli metin (Base64)' }, { rows: 4 }),
      pem('secondaryInput', { encrypt: 'Açık anahtar (SPKI PEM)', decrypt: 'Özel anahtar (PKCS#8 PEM)' }),
    ],
    modes: CRYPT,
    action: { encrypt: 'Şifrele', decrypt: 'Çöz' },
    resultLabel: 'Sonuç',
    params: 'RSA-OAEP, SHA-256.',
  },
  'ecdsa-key-generator': { ...generate('Anahtar çifti oluştur', 'Anahtar çifti (PEM)'), params: 'ECDSA · P-256 · SPKI / PKCS#8 PEM.' },
  'caesar-cipher': { inputs: [text('Metin'), { key: 'optionNumber', label: 'Kaydırma', kind: 'number' }], modes: CRYPT, action: { encrypt: 'Şifrele', decrypt: 'Çöz' }, resultLabel: 'Sonuç', note: 'Eğitim amaçlıdır; veri korumaz.' },
  'vigenere-cipher': { inputs: [text('Metin'), { key: 'secondaryInput', label: 'Anahtar', kind: 'text', placeholder: 'Yalnız Latin harfleri' }], modes: CRYPT, action: { encrypt: 'Şifrele', decrypt: 'Çöz' }, resultLabel: 'Sonuç', note: 'Eğitim amaçlıdır; veri korumaz.' },
  'rot13-cipher': { inputs: [text('Metin')], action: 'Dönüştür', resultLabel: 'ROT13', note: 'ROT13 kendi tersidir: aynı işlem metni geri çevirir. Eğitim amaçlıdır.' },

  'hkdf-tool': {
    inputs: [
      secret('inputVal', 'Anahtar malzemesi (IKM)'),
      { key: 'secondaryInput', label: 'Salt', kind: 'text', mono: true, optional: true },
      { key: 'tertiaryInput', label: 'Info (bağlam)', kind: 'text', mono: true, optional: true },
    ],
    action: 'Türet',
    resultLabel: 'Türetilen anahtar (32 bayt, hex)',
    params: 'HKDF-SHA256 (RFC 5869). Girdiler UTF-8 metin olarak alınır.',
  },
  'hmac-generator': { inputs: [text('Mesaj'), secret('secondaryInput', 'Anahtar')], modes: HMAC, action: 'Hesapla', resultLabel: 'HMAC (hex)' },
  'hmac-verifier': { inputs: [text('Mesaj'), secret('secondaryInput', 'Anahtar'), { key: 'tertiaryInput', label: 'Beklenen HMAC (hex)', kind: 'text', mono: true }], modes: HMAC, action: 'Doğrula', result: 'verdict' },
  'checksum-verifier': { inputs: [text('Metin'), { key: 'secondaryInput', label: 'Beklenen değer (hex)', kind: 'text', mono: true, placeholder: { crc32: '8 hex karakter, örn. 352441c2', adler32: '8 hex karakter, örn. 024d0127' } }], modes: [{ value: 'crc32', label: 'CRC32' }, { value: 'adler32', label: 'Adler-32' }], action: 'Doğrula', result: 'verdict', note: 'Sağlama toplamları kazara bozulmayı yakalar; kasıtlı değişikliğe karşı koruma için SHA-256 veya HMAC kullanın.' },
  'keccak256-tool': { ...hashTool('Keccak-256'), note: 'Ethereum’un kullandığı orijinal Keccak; NIST SHA3-256 ile aynı değildir.' },
  'ripemd160-tool': hashTool('RIPEMD-160'),

  'rsa-sign-verify': signTool('RSA-PSS, SHA-256, 32 bayt salt.'),
  'ecdsa-sign-verify': signTool('ECDSA P-256, SHA-256.'),
  'ed25519-sign-verify': {
    ...signTool('Ed25519. Tarayıcı desteği gerekir.'),
    modes: [...SIGN, { value: 'generate', label: 'Anahtar üret' }],
    action: { sign: 'İmzala', verify: 'Doğrula', generate: 'Anahtar çifti oluştur' },
  },
  'pem-parser': { inputs: [pem('inputVal', 'PEM')], action: 'İncele', result: 'report', resultLabel: 'PEM bilgisi', note: 'Yalnız PEM kapsayıcısı okunur; sertifika zinciri doğrulanmaz.' },
  'public-key-fingerprint': { inputs: [pem('inputVal', 'Açık anahtar (SPKI PEM)', { placeholder: '-----BEGIN PUBLIC KEY-----' })], action: 'Hesapla', resultLabel: 'SHA-256 parmak izi' },
  'ecdh-demo': { ...generate('Çalıştır', 'Sonuç'), result: 'report', note: 'İki geçici P-256 anahtar çifti üretilir ve iki tarafın aynı ortak sırra ulaştığı gösterilir. Ortak sır gösterilmez.' },
};

function signTool(params: string): ToolUi {
  return {
    inputs: [
      text('Mesaj', { modes: ['sign', 'verify'] }),
      pem('secondaryInput', { sign: 'Özel anahtar (PKCS#8 PEM)', verify: 'Açık anahtar (SPKI PEM)' }, { modes: ['sign', 'verify'] }),
      { key: 'tertiaryInput', label: 'İmza (Base64)', kind: 'text', mono: true, modes: ['verify'] },
    ],
    modes: SIGN,
    action: { sign: 'İmzala', verify: 'Doğrula' },
    resultLabel: 'İmza (Base64)',
    params,
  };
}

export const resolve = (value: string | Record<string, string> | undefined, mode: string): string | undefined =>
  typeof value === 'string' || value === undefined ? value : value[mode] ?? Object.values(value)[0];
