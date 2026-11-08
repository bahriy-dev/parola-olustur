import type { Block,ContentMap,ToolContent } from './types';

const FIPS_180 = { label: 'FIPS 180-4 – Secure Hash Standard', url: 'https://csrc.nist.gov/pubs/fips/180-4/upd1/final' };
const FIPS_202 = { label: 'FIPS 202 – SHA-3 Standard', url: 'https://csrc.nist.gov/pubs/fips/202/final' };

const NEWLINE_FAQ = { q: 'Komut satırında farklı bir sonuç alıyorum, neden?', a: '`echo abc` metnin sonuna satır sonu ekler ve hash bu karakteri de içerir. Aynı sonucu almak için `printf \'abc\'` veya `echo -n abc` kullanın. Bu araç metni yazdığınız gibi, UTF-8 baytları olarak hash’ler.' };
const FILE_FAQ = { q: 'Dosyanın hash’ini nasıl alırım?', a: '[Hash hesaplama](/hash) sayfasında “Dosya seç” ile en fazla 10 MiB’lık bir dosya seçebilirsiniz. Dosya tarayıcıdan çıkmaz.' };

const example = (name: string, digest: string, command: string): Block => ({
  code: `${command}\n${digest}`,
  caption: `“abc” metninin ${name} değeri. Bu araçta aynı girdi aynı sonucu verir.`,
});

function sha3(bits: 224 | 256 | 384 | 512, digest: string): ToolContent {
  return {
    sections: [
      {
        title: `SHA3-${bits} nedir?`,
        blocks: [
          `SHA3-${bits}, 2015’te FIPS 202 ile standartlaşan SHA-3 ailesinin ${bits} bitlik üyesidir. SHA-2’den tamamen farklı bir iç yapıya, Keccak “sünger” (sponge) yapısına dayanır: girdi ${1600 - 2 * bits} bitlik bloklar hâlinde 1600 bitlik bir duruma emilir, ardından çıktı bu durumdan sıkılır.`,
          `Çıktı ${bits / 4} hex karakterdir. Çarpışma direnci ${bits / 2} bit, ön görüntü direnci ${bits} bittir.`,
          example(`SHA3-${bits}`, digest, `printf 'abc' | openssl dgst -sha3-${bits}`),
        ],
      },
      {
        title: 'SHA-2 yerine ne zaman seçilir?',
        blocks: [
          {
            list: [
              'Sünger yapısı uzunluk uzatma (length extension) saldırısına karşı doğal olarak dayanıklıdır; `H(gizli || mesaj)` gibi basit yapılar SHA-2’deki kadar tehlikeli değildir (yine de MAC için HMAC veya KMAC tercih edin).',
              'SHA-2’de ileride bir zayıflık bulunması ihtimaline karşı farklı tasarımlı bir yedek isteyen sistemlerde.',
              'SHA-2 donanım hızlandırması (Intel SHA-NI, ARMv8) daha yaygın olduğundan, performans önemliyse SHA-256 / SHA-512 çoğu işlemcide daha hızlıdır.',
            ],
          },
          `Ethereum’un kullandığı Keccak-256, SHA3-256 ile aynı değildir; dolgu kuralı farklıdır. Ethereum için [Keccak-256 aracını](/araclar/keccak256-tool) kullanın.`,
        ],
      },
    ],
    faq: [NEWLINE_FAQ],
    sources: [FIPS_202],
  };
}

export const hashContent: ContentMap = {
  'hash-md5': {
    sections: [
      {
        title: 'MD5 nedir?',
        blocks: [
          'MD5, Ron Rivest’in 1991’de tasarladığı ve RFC 1321 ile yayımlanan 128 bitlik bir hash fonksiyonudur. Çıktı 32 hex karakterdir. Uzun yıllar dosya bütünlüğü, parola saklama ve dijital imzalarda kullanıldı.',
          example('MD5', '900150983cd24fb0d6963f7d28e17f72', "printf 'abc' | md5sum"),
        ],
      },
      {
        title: 'Neden güvenli kabul edilmiyor?',
        blocks: [
          '2004’te aynı MD5 değerine sahip iki farklı girdi (çarpışma) üretilebildiği gösterildi; bugün sıradan bir bilgisayarda saniyeler içinde çarpışma üretilebilir. 2012’de Flame zararlısı, MD5 çarpışmasıyla sahte bir Microsoft kod imzalama sertifikası üretti.',
          {
            list: [
              'Kullanılmamalı: parola saklama, dijital imza, sertifika, güvenlik amaçlı bütünlük kontrolü.',
              'Kabul edilebilir: kazara bozulmayı tespit etme, önbellek anahtarı, eski sistemlerle uyumluluk, ETag üretimi.',
            ],
          },
          { note: 'Bir indirmenin değiştirilmediğini doğrulamak için yayıncının SHA-256 değeri varsa onu kullanın. Saldırgan dosyayı değiştirebiliyorsa, MD5 ile aynı değere sahip zararlı bir dosya da üretebilir.' },
        ],
      },
    ],
    faq: [NEWLINE_FAQ, { q: 'MD5 hash’i geri çevrilebilir mi?', a: 'Hash geri çevrilemez; ancak kısa veya yaygın metinlerin MD5 değerleri önceden hesaplanmış tablolarda bulunur. “MD5 çözücü” siteleri bu tablolarda arama yapar. Parolaların MD5 ile saklanmaması bu yüzdendir.' }],
    sources: [{ label: 'RFC 1321 – The MD5 Message-Digest Algorithm', url: 'https://www.rfc-editor.org/rfc/rfc1321' }, { label: 'RFC 6151 – Updated Security Considerations for MD5', url: 'https://www.rfc-editor.org/rfc/rfc6151' }],
  },

  'hash-sha1': {
    sections: [
      {
        title: 'SHA-1 nedir?',
        blocks: [
          'SHA-1, NSA tarafından tasarlanıp 1995’te NIST tarafından standartlaştırılan 160 bitlik bir hash fonksiyonudur. Çıktı 40 hex karakterdir. TLS sertifikaları, PGP, Git ve birçok protokolde uzun süre varsayılan algoritmaydı.',
          example('SHA-1', 'a9993e364706816aba3e25717850c26c9cd0d89d', "printf 'abc' | sha1sum"),
        ],
      },
      {
        title: 'Güvenlik durumu',
        blocks: [
          '2017’de Google ve CWI Amsterdam, aynı SHA-1 değerine sahip iki farklı PDF yayımladı (SHAttered). 2020’de seçilmiş önekli çarpışma da pratik hâle geldi. Tarayıcılar 2017’den beri SHA-1 ile imzalanmış sertifikaları kabul etmiyor; NIST, SHA-1’in 2030’a kadar tamamen kullanımdan kaldırılmasını planlıyor.',
          {
            list: [
              'Git hâlâ nesne kimliği olarak SHA-1 kullanır, ancak çarpışma tespiti ekli bir sürümünü (SHA-1DC) çalıştırır ve SHA-256’ya geçiş desteği sunar.',
              'HMAC-SHA1 ve PBKDF2-SHA1 çarpışma zayıflığından doğrudan etkilenmez; TOTP kodları bu nedenle hâlâ HMAC-SHA1 kullanır.',
              'Yeni sistemlerde imza ve bütünlük için SHA-256 veya SHA-3 kullanın.',
            ],
          },
        ],
      },
    ],
    faq: [NEWLINE_FAQ, { q: 'Bu sayfanın sızıntı kontrolüyle ilgisi var mı?', a: 'Pwned Passwords servisi parolaların SHA-1 değerlerini kullanır. Sorgu için gereken 5 karakterlik öneki [SHA-1 Ön Ek Hesaplayıcı](/araclar/breach-checker) ile alabilirsiniz.' }],
    sources: [FIPS_180, { label: 'SHAttered – The first SHA-1 collision', url: 'https://shattered.io/' }],
  },

  'hash-sha224': {
    sections: [
      {
        title: 'SHA-224 nedir?',
        blocks: [
          'SHA-224, SHA-256 ile aynı sıkıştırma fonksiyonunu kullanır; farkı başlangıç değerlerinin farklı olması ve çıktının 224 bite kesilmesidir. Çıktı 56 hex karakterdir ve 112 bit çarpışma direnci sağlar; bu, 2048 bit RSA ve 3DES ile aynı güvenlik düzeyidir.',
          example('SHA-224', '23097d223405d8228642a477bda255b32aadbce4bda0b3f7e36c9da7', "printf 'abc' | sha224sum"),
        ],
      },
      {
        title: 'Ne zaman kullanılır?',
        blocks: [
          'SHA-224 hesaplama açısından SHA-256’dan daha hızlı değildir; yalnız daha kısa çıktı üretir. Bir protokolün veya donanımın 224 bitlik çıktı istediği durumlar dışında SHA-256 tercih etmek daha yaygın ve uyumludur.',
          'Kesilmiş çıktı sayesinde SHA-224, SHA-256’nın uzunluk uzatma zayıflığına SHA-256 kadar açık değildir; ancak MAC gerekiyorsa yine de HMAC kullanılmalıdır.',
        ],
      },
    ],
    faq: [NEWLINE_FAQ],
    sources: [FIPS_180],
  },

  'hash-sha256': {
    sections: [
      {
        title: 'SHA-256 nedir?',
        blocks: [
          'SHA-256, SHA-2 ailesinin en yaygın üyesidir: 256 bit (64 hex karakter) çıktı üretir, girdiyi 512 bitlik bloklar hâlinde 64 turlu bir sıkıştırma fonksiyonundan geçirir. TLS sertifikaları, kod imzalama, Bitcoin, Docker imaj kimlikleri ve paket yöneticilerinin bütünlük kontrolleri SHA-256 kullanır.',
          example('SHA-256', 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', "printf 'abc' | sha256sum      # macOS: shasum -a 256"),
          'Girdideki tek bir değişiklik bile çıktıyı tamamen değiştirir: “abd” metninin SHA-256 değeri `a52d159f…298449c9` ile başlar ve “abc” ile hiçbir ortak örüntü taşımaz.',
        ],
      },
      {
        title: 'Doğru kullanım',
        blocks: [
          {
            table: {
              head: ['Amaç', 'SHA-256 uygun mu?', 'Doğru yöntem'],
              rows: [
                ['Dosya bütünlüğü / indirme doğrulama', 'Evet', 'Yayıncının yayımladığı değerle karşılaştırın.'],
                ['Parola saklama', 'Hayır', '[Argon2id](/araclar/argon2id-generator), [bcrypt](/araclar/bcrypt-generator) veya scrypt.'],
                ['Mesaj doğrulama (MAC)', 'Tek başına hayır', '[HMAC-SHA256](/araclar/hmac-generator).'],
                ['İçerik adresleme, önbellek anahtarı', 'Evet', 'Doğrudan kullanılabilir.'],
              ],
            },
          },
          { note: '`SHA256(gizli_anahtar + mesaj)` yapısı uzunluk uzatma saldırısına açıktır: saldırgan, anahtarı bilmeden mesajın sonuna veri ekleyip geçerli bir hash hesaplayabilir. Anahtarlı doğrulamada her zaman HMAC kullanın.' },
        ],
      },
    ],
    faq: [
      NEWLINE_FAQ,
      FILE_FAQ,
      { q: 'SHA-256 kuantum bilgisayarlara karşı güvenli mi?', a: 'Grover algoritması ön görüntü bulmayı karekök oranında hızlandırır; bu da SHA-256 için yaklaşık 128 bitlik güvenlik bırakır ve hâlâ yeterli kabul edilir.' },
    ],
    sources: [FIPS_180],
  },

  'hash-sha384': {
    sections: [
      {
        title: 'SHA-384 nedir?',
        blocks: [
          'SHA-384, SHA-512’nin farklı başlangıç değerleriyle çalıştırılıp çıktısının 384 bite kesilmiş hâlidir. Çıktı 96 hex karakterdir. TLS 1.3’teki `TLS_AES_256_GCM_SHA384` şifre takımı ve NSA’nın CNSA önerileri SHA-384 kullanır.',
          example('SHA-384', 'cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7', "printf 'abc' | sha384sum"),
        ],
      },
      {
        title: 'SHA-256 ile karşılaştırma',
        blocks: [
          {
            list: [
              '64 bitlik kelimelerle çalıştığı için donanım hızlandırması olmayan 64 bit işlemcilerde SHA-256’dan daha hızlı olabilir.',
              'Çıktı kesildiği için uzunluk uzatma saldırısına karşı dayanıklıdır.',
              '192 bit çarpışma direnci sunar; çoğu uygulama için SHA-256’nın 128 biti yeterlidir. SHA-384, uyumluluk gereksinimi veya uzun vadeli güvenlik hedefi olduğunda seçilir.',
            ],
          },
        ],
      },
    ],
    faq: [NEWLINE_FAQ],
    sources: [FIPS_180],
  },

  'hash-sha512': {
    sections: [
      {
        title: 'SHA-512 nedir?',
        blocks: [
          'SHA-512, SHA-2 ailesinin 512 bit (128 hex karakter) çıktı üreten üyesidir. 1024 bitlik bloklar, 64 bitlik kelimeler ve 80 tur kullanır. Ed25519 imzaları, Linux’taki `$6$` parola biçimi (sha512crypt) ve birçok dosya dağıtım sistemi SHA-512’ye dayanır.',
          example('SHA-512', 'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f', "printf 'abc' | sha512sum"),
        ],
      },
      {
        title: 'Kullanım notları',
        blocks: [
          {
            list: [
              'Çıktının uzunluğu güvenliği artırır ama çoğu uygulamada SHA-256’nın 128 bit çarpışma direnci zaten yeterlidir; uzun çıktı depolama ve iletim maliyeti getirir.',
              'SHA-512, SHA-256 gibi uzunluk uzatma saldırısına açıktır; anahtarlı doğrulama için HMAC-SHA512 kullanın.',
              'Kesilmiş çıktı gerekiyorsa çıktıyı kendiniz kısaltmak yerine standart SHA-512/256 veya SHA-384 tercih edin.',
            ],
          },
        ],
      },
    ],
    faq: [NEWLINE_FAQ, FILE_FAQ],
    sources: [FIPS_180],
  },

  'hash-sha3-224': sha3(224, 'e642824c3f8cf24ad09234ee7d3c766fc9a3a5168d0c94ad73b46fdf'),
  'hash-sha3-256': sha3(256, '3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532'),
  'hash-sha3-384': sha3(384, 'ec01498288516fc926459f58e2c6ad8df9b473cb0fc08c2596da7cf0e49be4b298d88cea927ac7f539f1edf228376d25'),
  'hash-sha3-512': sha3(512, 'b751850b1a57168a5693cd924b6b096e08f621827444f70d884f5d0240d2712e10e116e9192af3c91a7ec57647e3934057340b4cf408d5a56592f8274eec53f0'),

  'hash-blake2b': {
    sections: [
      {
        title: 'BLAKE2b nedir?',
        blocks: [
          'BLAKE2b, SHA-3 yarışmasının finalisti BLAKE’ten türetilen ve 2012’de yayımlanan bir hash fonksiyonudur (RFC 7693). 64 bit işlemciler için optimize edilmiştir ve yazılımda MD5’ten bile hızlı çalışırken SHA-3 düzeyinde güvenlik hedefler. Bu araç 512 bitlik (128 hex karakter) standart çıktıyı üretir.',
          example('BLAKE2b-512', 'ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923', "printf 'abc' | b2sum"),
        ],
      },
      {
        title: 'Nerelerde kullanılır?',
        blocks: [
          {
            list: [
              'Argon2’nin iç yapısı BLAKE2b’ye dayanır.',
              'libsodium’un `crypto_generichash` fonksiyonu BLAKE2b’dir.',
              'WireGuard (BLAKE2s), Zcash ve birçok yedekleme aracı BLAKE2 kullanır.',
            ],
          },
          'BLAKE2 yerleşik anahtar desteğine sahiptir (keyed hashing); MAC için HMAC sarmalayıcısına gerek kalmaz. Bu araç anahtarsız modu hesaplar.',
        ],
      },
    ],
    faq: [NEWLINE_FAQ, { q: 'BLAKE2b-256 ile BLAKE2b-512’nin ilk yarısı aynı mı?', a: 'Hayır. Çıktı uzunluğu parametre bloğuna yazılır ve hesaplamanın başından itibaren sonucu değiştirir; 512 bitlik çıktıyı kesmek BLAKE2b-256 değerini vermez.' }],
    sources: [{ label: 'RFC 7693 – The BLAKE2 Cryptographic Hash and MAC', url: 'https://www.rfc-editor.org/rfc/rfc7693' }],
  },

  'hash-blake3': {
    sections: [
      {
        title: 'BLAKE3 nedir?',
        blocks: [
          'BLAKE3, 2020’de BLAKE2’nin tasarımcılarından bir ekip tarafından yayımlandı. Girdiyi 1 KiB’lık parçalara bölüp bir Merkle ağacı olarak işler; bu sayede çok çekirdekli işlemcilerde ve SIMD komutlarıyla paralel çalışır. Varsayılan çıktı 256 bittir (64 hex karakter).',
          example('BLAKE3', '6437b3ac38465133ffb63b75273a8db548c558465d79db03fd359c6cd5bd9d85', "printf 'abc' | b3sum"),
        ],
      },
      {
        title: 'Özellikleri',
        blocks: [
          {
            list: [
              'Büyük dosyalarda SHA-256’dan birkaç kat hızlıdır; tarayıcıdaki tek iş parçacıklı JavaScript sürümü bu farkı tam yansıtmaz.',
              'Tek algoritmada hash, anahtarlı hash (MAC), anahtar türetme (KDF) ve istenen uzunlukta çıktı (XOF) modları bulunur.',
              'Ağaç yapısı, dosyanın yalnız bir bölümünü doğrulamaya (ör. akış hâlinde indirme) izin verir.',
            ],
          },
          'BLAKE3 bir NIST veya IETF standardı değildir; uyumluluk gereksinimi olan sistemlerde SHA-2 veya SHA-3 tercih edilir.',
        ],
      },
    ],
    faq: [NEWLINE_FAQ],
    sources: [{ label: 'BLAKE3 spesifikasyonu ve test vektörleri', url: 'https://github.com/BLAKE3-team/BLAKE3' }],
  },
};
