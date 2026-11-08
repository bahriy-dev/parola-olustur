import type { HashAlgorithmMeta,HashCategoryKey,HashSecurityLevel } from '../hash/registry';
import type { Locale } from './routing';

/**
 * Display text for the hash catalog in both locales. The registry keeps the technical data (bits, standard,
 * category); wording here is deliberately factual, without superlatives.
 */
type Text = { tr: string; en: string };

const CATEGORY: Record<HashCategoryKey, Text> = {
  md: { tr: 'MD (Message Digest) Ailesi', en: 'MD (Message Digest) Family' },
  sha: { tr: 'SHA (Secure Hash) Ailesi', en: 'SHA (Secure Hash) Family' },
  blake: { tr: 'BLAKE Ailesi', en: 'BLAKE Family' },
  ripemd: { tr: 'RIPEMD Ailesi', en: 'RIPEMD Family' },
  kriptografik: { tr: 'Diğer Kriptografik Hashler', en: 'Other Cryptographic Hashes' },
  checksum: { tr: 'Hızlı Hash & Checksum', en: 'Fast Hashes & Checksums' },
  'parola-kdf': { tr: 'Parola Hash & KDF', en: 'Password Hashing & KDF' },
  hmac: { tr: 'HMAC', en: 'HMAC' },
};

const SECURITY: Record<HashSecurityLevel, Text> = {
  kirilmis: { tr: 'Kırılmış — yalnız bütünlük denetimi', en: 'Broken — integrity checks only' },
  uyari: { tr: 'Eski — yeni sistemlerde kullanmayın', en: 'Legacy — avoid in new systems' },
  guvenli: { tr: 'Güvenli', en: 'Secure' },
  checksum: { tr: 'Kriptografik değil (sağlama toplamı)', en: 'Not cryptographic (checksum)' },
  kdf: { tr: 'Parola saklamaya uygun', en: 'Suitable for password storage' },
};

const SPEED: Record<string, string> = {
  'Çok Hızlı': 'Very fast',
  Hızlı: 'Fast',
  'Hızlı (64-bit mimari)': 'Fast (64-bit)',
  'Çok Hızlı (64-bit)': 'Very fast (64-bit)',
  Standart: 'Standard',
  'Çok Hızlı (SIMD)': 'Very fast (SIMD)',
  'Yavaş (Güvenli KDF)': 'Deliberately slow (KDF)',
};

const AUTHOR_EN: Record<string, string> = {
  'Topluluk Uygulaması, 2000': 'Community practice, 2000',
  'Keccak Ekibi / NIST, 2015': 'Keccak team / NIST, 2015',
  'Keccak Ekibi, 2016': 'Keccak team, 2016',
};

const DESCRIPTION: Record<string, Text> = {
  md5: {
    tr: '128 bit özet üreten eski algoritma. Çarpışmaları pratikte üretilebildiği için parola saklama ve imza için güvensizdir; yalnız bozulma kontrolü ve eski sistem uyumluluğu için kullanılır.',
    en: 'A legacy algorithm producing a 128-bit digest. Collisions can be produced in practice, so it is unsafe for passwords and signatures; use it only for corruption checks and legacy compatibility.',
  },
  'md5-md5': {
    tr: 'Eski forum ve içerik yönetim sistemlerinde görülen md5(md5(parola)) yapısı. Tuz ve maliyet içermediği için modern GPU saldırılarına karşı koruma sağlamaz.',
    en: 'The md5(md5(password)) construction seen in old forum and CMS software. With no salt or work factor it offers no protection against modern GPU attacks.',
  },
  'md5-sha1': {
    tr: 'SSLv3 ve TLS 1.0/1.1 el sıkışmasında kullanılan, MD5 ve SHA-1 özetlerinin yan yana birleştirilmesiyle (16 + 20 bayt) oluşan birleşik özet.',
    en: 'The concatenation of MD5 and SHA-1 digests (16 + 20 bytes) used in the SSLv3 and TLS 1.0/1.1 handshake.',
  },
  'sha-1': {
    tr: '160 bit çıktı üreten SHA standardı. 2017 SHAttered ve 2020 Shambles çalışmalarıyla pratik çarpışmalar gösterildi; imza ve sertifikalarda kullanılmamalıdır.',
    en: 'The 160-bit SHA standard. Practical collisions were shown by SHAttered (2017) and Shambles (2020); it must not be used for signatures or certificates.',
  },
  'sha-224': {
    tr: 'SHA-256 yapısından farklı başlangıç değerleriyle türetilen, 224 bite kısaltılmış SHA-2 sürümü (112 bit güvenlik düzeyi).',
    en: 'A SHA-2 variant derived from SHA-256 with different initial values and truncated to 224 bits (112-bit security level).',
  },
  'sha-256': {
    tr: 'SHA-2 ailesinin 256 bit üyesi. TLS sertifikaları, kod imzalama, paket yöneticileri ve Bitcoin gibi pek çok sistemde kullanılır.',
    en: 'The 256-bit member of SHA-2, used in TLS certificates, code signing, package managers, Bitcoin and many other systems.',
  },
  'sha-384': {
    tr: 'SHA-512 yapısından türetilip 384 bite kısaltılan SHA-2 sürümü; 192 bit güvenlik düzeyi sunar ve uzunluk uzatma saldırısına karşı korumalıdır.',
    en: 'A SHA-2 variant derived from SHA-512 and truncated to 384 bits; it offers a 192-bit security level and resists length-extension attacks.',
  },
  'sha-512': {
    tr: '64 bit sözcüklerle çalışan, 512 bit çıktı üreten SHA-2 üyesi; 64 bit işlemcilerde çoğu zaman SHA-256’dan hızlıdır.',
    en: 'The SHA-2 member that works on 64-bit words and outputs 512 bits; on 64-bit processors it is often faster than SHA-256.',
  },
  'sha-512-224': {
    tr: 'SHA-512 yapısını kullanıp 224 bit çıktı veren SHA-2 sürümü; kısaltma sayesinde uzunluk uzatma saldırısından etkilenmez.',
    en: 'A SHA-2 variant using the SHA-512 structure with 224-bit output; truncation makes it immune to length extension.',
  },
  'sha-512-256': {
    tr: 'SHA-512 yapısını kullanıp 256 bit çıktı veren SHA-2 sürümü; 64 bit işlemcilerde SHA-256’dan hızlı ve uzunluk uzatmaya karşı korumalıdır.',
    en: 'A SHA-2 variant using the SHA-512 structure with 256-bit output; faster than SHA-256 on 64-bit CPUs and immune to length extension.',
  },
  'sha3-224': {
    tr: 'Keccak sünger yapısına dayanan 224 bit SHA-3 hash’i; SHA-2’nin Merkle–Damgård yapısından bağımsızdır.',
    en: 'The 224-bit SHA-3 hash built on the Keccak sponge, independent of the Merkle–Damgård structure of SHA-2.',
  },
  'sha3-256': {
    tr: 'SHA-2’ye yapısal olarak farklı bir alternatif olarak standartlaştırılan, Keccak sünger yapılı 256 bit NIST hash’i.',
    en: 'The 256-bit NIST hash built on the Keccak sponge, standardized as a structurally different alternative to SHA-2.',
  },
  'sha3-384': { tr: '384 bit çıktı veren, Keccak sünger yapılı SHA-3 hash’i.', en: 'The 384-bit SHA-3 hash built on the Keccak sponge.' },
  'sha3-512': { tr: 'SHA-3 ailesinin 512 bit çıktı veren üyesi.', en: 'The 512-bit member of the SHA-3 family.' },
  shake128: {
    tr: 'İstenen uzunlukta çıktı üretebilen, Keccak tabanlı genişletilebilir çıktı fonksiyonu (XOF); 128 bit güvenlik düzeyi.',
    en: 'A Keccak-based extendable-output function (XOF) that can produce output of any length; 128-bit security level.',
  },
  shake256: { tr: '256 bit güvenlik düzeyi sunan genişletilebilir çıktı fonksiyonu (XOF).', en: 'An extendable-output function (XOF) with a 256-bit security level.' },
  cshake128: {
    tr: 'NIST SP 800-185’te tanımlanan, işlev adı ve özelleştirme dizesiyle alan ayrımı sağlayan SHAKE128 sürümü.',
    en: 'The SHAKE128 variant from NIST SP 800-185 that adds a function name and customization string for domain separation.',
  },
  cshake256: { tr: 'Özelleştirme dizesi destekleyen, 256 bit güvenlik düzeyli SHAKE sürümü (NIST SP 800-185).', en: 'The SHAKE variant with customization strings and a 256-bit security level (NIST SP 800-185).' },
  kangarootwelve: {
    tr: 'Keccak ekibinin 12 turlu permütasyon ve ağaç yapısıyla tasarladığı, büyük girdilerde SHA-3’ten çok daha hızlı çalışan XOF.',
    en: 'An XOF from the Keccak team using a 12-round permutation and a tree mode; much faster than SHA-3 on large inputs.',
  },
  'blake-224': { tr: 'SHA-3 yarışması finalisti BLAKE’in 224 bit sürümü.', en: 'The 224-bit version of BLAKE, a SHA-3 competition finalist.' },
  'blake-256': {
    tr: 'ChaCha akış şifresinden türetilen sıkıştırma fonksiyonunu kullanan, SHA-3 yarışması finalisti 256 bit BLAKE.',
    en: 'The 256-bit BLAKE, a SHA-3 finalist whose compression function is derived from the ChaCha stream cipher.',
  },
  'blake-384': { tr: '64 bit sözcüklerle çalışan 384 bit BLAKE sürümü.', en: 'The 384-bit BLAKE variant working on 64-bit words.' },
  'blake-512': { tr: '64 bit sözcüklerle çalışan 512 bit BLAKE sürümü.', en: 'The 512-bit BLAKE variant working on 64-bit words.' },
  blake2b: {
    tr: '64 bit platformlar için optimize edilmiş BLAKE2 sürümü; yazılımda SHA-2’den hızlıdır ve Argon2 ile WireGuard’da kullanılır.',
    en: 'The BLAKE2 variant optimized for 64-bit platforms; faster than SHA-2 in software and used inside Argon2 and WireGuard.',
  },
  blake2s: { tr: '8–32 bit işlemciler ve gömülü sistemler için optimize edilmiş 256 bit BLAKE2 sürümü.', en: 'The 256-bit BLAKE2 variant optimized for 8- to 32-bit processors and embedded systems.' },
  blake3: {
    tr: 'Merkle ağacı yapısı sayesinde girdiyi çok çekirdekte ve SIMD ile paralel işleyebilen, 2020’de yayımlanan modern hash.',
    en: 'A modern hash published in 2020 whose Merkle-tree structure lets it process input in parallel across cores and SIMD lanes.',
  },
  'ripemd-160': {
    tr: 'Bitcoin adreslerinin türetilmesinde SHA-256 ile birlikte (HASH160) kullanılan 160 bit hash.',
    en: 'The 160-bit hash used with SHA-256 (HASH160) to derive Bitcoin addresses.',
  },
  crc32: {
    tr: 'Ethernet, ZIP ve PNG’de aktarım hatalarını yakalamak için kullanılan döngüsel artıklık denetimi; kasıtlı değişikliğe karşı koruma sağlamaz.',
    en: 'The cyclic redundancy check used in Ethernet, ZIP and PNG to catch transmission errors; it offers no protection against deliberate changes.',
  },
  crc32c: {
    tr: 'Castagnoli polinomunu kullanan CRC32 sürümü; SSE4.2 ve ARMv8 donanım komutlarıyla hızlandırılabilir (iSCSI, ext4, Btrfs).',
    en: 'The CRC32 variant with the Castagnoli polynomial; it can be hardware-accelerated with SSE4.2 and ARMv8 instructions (iSCSI, ext4, Btrfs).',
  },
  adler32: {
    tr: 'Mark Adler’in zlib için tasarladığı, CRC32’den hızlı ama hata yakalama gücü daha düşük sağlama toplamı.',
    en: 'The checksum Mark Adler designed for zlib; faster than CRC32 but weaker at detecting errors.',
  },
  'fnv-1a-32': {
    tr: 'Çarpma ve XOR işlemlerine dayanan, hash tabloları için tasarlanmış hızlı ve kriptografik olmayan 32 bit hash.',
    en: 'A fast, non-cryptographic 32-bit hash based on multiplication and XOR, designed for hash tables.',
  },
  'fnv-1a-64': { tr: 'FNV-1a’nın 64 bit sürümü; daha geniş çıktı sayesinde tablo çakışmaları azalır.', en: 'The 64-bit version of FNV-1a; the wider output reduces table collisions.' },
  'murmurhash3-x86-32': {
    tr: 'Cassandra, Hadoop ve Guava gibi projelerde hash tablosu ve bölümlendirme için kullanılan, kriptografik olmayan hızlı hash.',
    en: 'A fast, non-cryptographic hash used for hash tables and partitioning in projects such as Cassandra, Hadoop and Guava.',
  },
  bcrypt: {
    tr: 'Niels Provos ve David Mazières’in Blowfish tabanlı parola hash’i; ayarlanabilir maliyet parametresiyle yavaşlatılır. Girdinin yalnız ilk 72 baytını kullanır.',
    en: 'The Blowfish-based password hash by Niels Provos and David Mazières, slowed by a tunable cost parameter. It uses only the first 72 bytes of input.',
  },
  scrypt: {
    tr: 'Colin Percival’ın bellek-zor KDF’si; her denemede büyük RAM gerektirerek GPU, FPGA ve ASIC ile kaba kuvvet saldırısını pahalı hale getirir.',
    en: 'Colin Percival’s memory-hard KDF; requiring a lot of RAM per guess makes brute force with GPUs, FPGAs and ASICs expensive.',
  },
  argon2d: {
    tr: 'Password Hashing Competition kazananı Argon2’nin veriye bağımlı bellek erişimi yapan sürümü; GPU’ya karşı en dirençli, yan kanallara açık. Parola saklamada Argon2id tercih edilir.',
    en: 'The Argon2 variant (winner of the Password Hashing Competition) with data-dependent memory access; the most GPU-resistant but exposed to side channels. Prefer Argon2id for passwords.',
  },
  argon2i: {
    tr: 'Belleğe veriden bağımsız erişen Argon2 sürümü; önbellek zamanlaması gibi yan kanal saldırılarına karşı tasarlanmıştır.',
    en: 'The Argon2 variant with data-independent memory access, designed against side channels such as cache timing.',
  },
  argon2id: {
    tr: 'Argon2i ve Argon2d’yi birleştiren karma mod; OWASP ve RFC 9106 parola saklama için bunu önerir.',
    en: 'The hybrid mode combining Argon2i and Argon2d; recommended for password storage by OWASP and RFC 9106.',
  },
  'pbkdf2-hmac-sha1': {
    tr: 'HMAC-SHA1 tabanlı PBKDF2; WPA2 ve eski sistemlerde görülür. GPU’larda paralel denemesi ucuz olduğundan yeni sistemlerde Argon2id veya scrypt tercih edilmelidir.',
    en: 'PBKDF2 with HMAC-SHA1, found in WPA2 and older systems. Guessing is cheap on GPUs, so new systems should prefer Argon2id or scrypt.',
  },
  'pbkdf2-hmac-sha256': {
    tr: 'NIST SP 800-132 ve FIPS kapsamındaki PBKDF2; OWASP parola saklama için en az 600 000 iterasyon önerir.',
    en: 'PBKDF2 under NIST SP 800-132 and FIPS; OWASP recommends at least 600,000 iterations for password storage.',
  },
  'pbkdf2-hmac-sha512': {
    tr: 'HMAC-SHA512 tabanlı PBKDF2; 64 bit işlemcilerde verimlidir, OWASP en az 210 000 iterasyon önerir.',
    en: 'PBKDF2 with HMAC-SHA512, efficient on 64-bit processors; OWASP recommends at least 210,000 iterations.',
  },
  'hmac-sha256': {
    tr: 'JWT (HS256), AWS Signature v4 ve webhook imzalarında yaygın kullanılan, gizli anahtarlı mesaj doğrulama kodu.',
    en: 'A keyed message authentication code widely used in JWT (HS256), AWS Signature v4 and webhook signatures.',
  },
  'hmac-sha512': { tr: 'SHA-512 tabanlı, 512 bit etiket üreten gizli anahtarlı mesaj doğrulama kodu.', en: 'A keyed message authentication code based on SHA-512 with a 512-bit tag.' },
  'hmac-sha1': {
    tr: 'HMAC yapısı SHA-1 çarpışmalarından doğrudan etkilenmez, ancak yeni sistemlerde HMAC-SHA256 tercih edilmelidir.',
    en: 'The HMAC construction is not directly affected by SHA-1 collisions, but new systems should prefer HMAC-SHA256.',
  },
  'hmac-sha384': { tr: 'SHA-384 tabanlı gizli anahtarlı mesaj doğrulama kodu.', en: 'A keyed message authentication code based on SHA-384.' },
  'hmac-md5': {
    tr: 'Eski ağ protokollerinde görülen MD5 tabanlı HMAC; yeni sistemlerde kullanılmamalıdır.',
    en: 'An MD5-based HMAC found in old network protocols; it should not be used in new systems.',
  },
};

export const hashCategoryName = (key: HashCategoryKey, lang: Locale) => CATEGORY[key][lang];
export const hashCategoryEmpty = (lang: Locale) => (lang === 'tr' ? 'Bu kategoride aktif algoritma yok.' : 'No active algorithms in this category.');

/** Locale-specific display fields for one algorithm. */
export function hashText(alg: HashAlgorithmMeta, lang: Locale) {
  return {
    description: DESCRIPTION[alg.slug]?.[lang] ?? alg.description,
    securityLabel: SECURITY[alg.security][lang],
    speedRating: lang === 'tr' ? alg.speedRating : SPEED[alg.speedRating] ?? alg.speedRating,
    authorYear: lang === 'tr' ? alg.authorYear : AUTHOR_EN[alg.authorYear] ?? alg.authorYear,
    categoryName: CATEGORY[alg.category][lang],
  };
}

/** Every algorithm with a display text, for the coverage test. */
export const HASH_DESCRIBED = Object.keys(DESCRIPTION);
