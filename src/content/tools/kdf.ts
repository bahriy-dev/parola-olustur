import type { ContentMap,ToolContent } from './types';

const OWASP = { label: 'OWASP Password Storage Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html' };
const RFC_9106 = { label: 'RFC 9106 – Argon2 Memory-Hard Function', url: 'https://www.rfc-editor.org/rfc/rfc9106' };
const RFC_7914 = { label: 'RFC 7914 – The scrypt Password-Based KDF', url: 'https://www.rfc-editor.org/rfc/rfc7914' };
const RFC_8018 = { label: 'RFC 8018 – PKCS #5: PBKDF2', url: 'https://www.rfc-editor.org/rfc/rfc8018' };

type Section = ToolContent['sections'][number];

const WHY_SLOW: Section = {
  title: 'Parolalar neden SHA-256 ile değil, yavaş bir fonksiyonla saklanır?',
  blocks: [
    'SHA-256 gibi genel hash fonksiyonları hızlı olacak şekilde tasarlanmıştır; tek bir ekran kartı saniyede milyarlarca SHA-256 hesaplayabilir. Veritabanı sızdığında saldırgan her aday parolayı bu hızla deneyebilir. Parola hashleme fonksiyonları ise ayarlanabilir bir maliyetle bilinçli olarak yavaştır ve her parolaya ayrı rastgele salt ekler; böylece aynı parolalar farklı hash üretir ve önceden hesaplanmış tablolar işe yaramaz.',
  ],
};

const ARGON2_VARIANT_USE: Record<'argon2i' | 'argon2d', Section> = {
  argon2i: {
    title: 'Argon2i’yi kim kullanır ve nelere dikkat edilmeli?',
    blocks: [
      'libsodium 1.0.9–1.0.14 sürümlerinde `crypto_pwhash_str` varsayılan olarak Argon2i kullanıyordu; 1.0.15’ten itibaren varsayılan Argon2id oldu. Bu yüzden eski PHP (sodium) ve libsodium tabanlı uygulamaların veritabanlarında `$argon2i$` önekli hash’lere rastlanır.',
      'Argon2i’ye yönelik bellek-zaman takası saldırıları düşük tur sayılarında daha etkilidir; libsodium bu nedenle Argon2i için en az 3 tur zorunlu kılar. Bu araç türleri karşılaştırmayı kolaylaştırmak için Argon2id ile aynı t = 2 değerini kullanır. Argon2i’yi gerçekten kullanacaksanız tur sayısını artırın ya da Argon2id’ye geçin; eski hash’ler kullanıcı bir sonraki girişinde yeniden hash’lenerek taşınabilir.',
    ],
  },
  argon2d: {
    title: 'Argon2d’yi kim kullanır?',
    blocks: [
      'KeePass’in KDBX 4 veritabanı biçimi, ana paroladan şifreleme anahtarını türetmek için Argon2d’yi destekler. Bu kullanım Argon2d için uygundur: hesaplama kullanıcının kendi cihazında, saldırganın aynı donanımda kod çalıştırmadığı bir ortamda yapılır ve asıl tehdit, çalınan veritabanı dosyasına GPU ile yapılacak çevrimdışı saldırıdır.',
      'Buna karşılık bir web sunucusunda, aynı makinede başka müşterilerin kod çalıştırabildiği bulut ortamlarında parola doğrulamak için Argon2d uygun değildir. KeePassXC gibi yeni istemciler Argon2id seçeneğini de sunar.',
    ],
  },
};

const argon2Variant = (variant: 'argon2i' | 'argon2d'): ToolContent => {
  const name = variant === 'argon2i' ? 'Argon2i' : 'Argon2d';
  return {
    sections: [
      {
        title: `${name} ne zaman kullanılır?`,
        blocks: [
          variant === 'argon2i'
            ? 'Argon2i belleğe parola değerinden bağımsız sırayla erişir. Bu, aynı makinede çalışan bir saldırganın önbellek zamanlamasından parola hakkında bilgi çıkarmasını (yan kanal saldırısı) zorlaştırır; buna karşılık bellek-zaman takası saldırılarına Argon2d’den daha açıktır.'
            : 'Argon2d belleğe parola değerine bağlı sırayla erişir. Bu, GPU ve ASIC ile yapılan paralel kırma saldırılarını en çok zorlaştıran yöntemdir; ancak erişim deseni parolaya bağlı olduğundan paylaşımlı sunucularda yan kanal saldırılarına açıktır.',
          'RFC 9106, parola saklama için iki yöntemi birleştiren [Argon2id](/araclar/argon2id-generator) türünü önerir. Bu araç, belirli bir sistemle uyumluluk gerektiğinde veya türler arasındaki farkı incelemek için vardır.',
        ],
      },
      {
        title: 'Kullanılan parametreler',
        blocks: [
          'Araç Argon2id ile aynı parametreleri kullanır: `m=19456` KiB bellek, `t=2` tur, `p=1` paralellik, 16 bayt salt ve 32 bayt çıktı. Çıktı PHC dize biçimindedir:',
          { code: '$' + variant + '$v=19$m=19456,t=2,p=1$<salt>$<hash>', caption: 'Salt ve hash dolgusuz Base64’tür. Dize, doğrulama için gereken tüm bilgiyi içerir.' },
        ],
      },
      ARGON2_VARIANT_USE[variant],
    ],
    faq: [{ q: `${name} hash’ini nasıl doğrularım?`, a: 'Hash’i [Hash doğrulama](/hash-dogrulama) sayfasında “Beklenen hash” alanına yapıştırın; `$argon2i$` ve `$argon2d$` önekleri orada desteklenir. Argon2id Hash Doğrulayıcı aracı yalnız `$argon2id$` kabul eder.' }],
    sources: [RFC_9106],
  };
};

const PBKDF2_EXTRA: Record<'SHA-256' | 'SHA-512', Section> = {
  'SHA-256': {
    title: 'Aynı değeri Web Crypto ile üretmek',
    blocks: [
      'PBKDF2-SHA256 tarayıcıların ve Node.js’in Web Crypto API’sinde yerleşik olarak bulunur; ek kütüphane gerekmez. Django’nun varsayılan parola hasher’ı da PBKDF2-SHA256’dır ve iterasyon sayısını her sürümde artırır.',
      {
        code: "const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(parola), 'PBKDF2', false, ['deriveBits']);\nconst bits = await crypto.subtle.deriveBits(\n  { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 600000 },\n  key, 256,\n);",
        caption: '`salt`, encoded dizedeki Base64 değerin çözülmüş 16 baytıdır.',
      },
    ],
  },
  'SHA-512': {
    title: 'Neden SHA-256’dan daha az iterasyon?',
    blocks: [
      'HMAC-SHA512’nin her turu 64 bitlik işlemler gerektirir ve ekran kartlarında SHA-256’dan belirgin şekilde daha pahalıdır. Bu nedenle OWASP, aynı saldırı maliyeti için PBKDF2-HMAC-SHA512’de 210 000, SHA-256’da 600 000 iterasyon önerir. Araç SHA-512 için 220 000 kullanır.',
      {
        code: "import hashlib, base64\nhashlib.pbkdf2_hmac('sha512', parola.encode(), base64.b64decode(salt + '=='), 220000, 32).hex()",
        caption: 'Python ile aynı 32 baytlık çıktıyı üretir (dolgusuz salt’a `==` eklenir; fazla dolgu yok sayılır).',
      },
    ],
  },
};

const pbkdf2 = (hash: 'SHA-256' | 'SHA-512', iterations: string, slug: string): ToolContent => ({
  sections: [
    {
      title: `PBKDF2-HMAC-${hash} nasıl çalışır?`,
      blocks: [
        `PBKDF2, parolayı anahtar olarak kullanan HMAC-${hash} fonksiyonunu salt ile başlayarak art arda çalıştırır ve sonuçları XOR’lar. Maliyet yalnız iterasyon sayısıyla ayarlanır; bellek gerektirmediği için GPU üzerinde Argon2 ve scrypt’e göre çok daha ucuz paralelleştirilir.`,
        `Araç ${iterations} iterasyon, 16 bayt rastgele salt ve 32 bayt çıktı kullanır. Bu değer OWASP’ın PBKDF2-HMAC-${hash} için önerdiği alt sınırın üzerindedir.`,
        { code: '$' + slug + '$i=' + iterations.replace(/\s/g, '') + '$<salt>$<hash>', caption: 'Bu sitenin encoded biçimi. passlib gibi kütüphanelerin PBKDF2 biçimleri farklı ayırıcı ve Base64 alfabesi kullanır; doğrudan taşınabilir değildir.' },
      ],
    },
    {
      title: 'Ne zaman PBKDF2 seçilmeli?',
      blocks: [
        {
          list: [
            'FIPS 140 doğrulaması gereken ortamlarda (PBKDF2 NIST SP 800-132’de tanımlıdır, Argon2 değildir).',
            'Platformun yalnız PBKDF2 sunduğu durumlarda (ör. Web Crypto API, birçok donanım güvenlik modülü).',
            'Bu kısıtlar yoksa yeni sistemlerde [Argon2id](/araclar/argon2id-generator) tercih edin.',
          ],
        },
      ],
    },
    PBKDF2_EXTRA[hash],
  ],
  sources: [RFC_8018, OWASP],
});

export const kdfContent: ContentMap = {
  'bcrypt-generator': {
    sections: [
      WHY_SLOW,
      {
        title: 'bcrypt hash’inin yapısı',
        blocks: [
          'bcrypt, Blowfish şifresinin pahalı anahtar hazırlama adımını `2^maliyet` kez tekrarlar. Araç maliyet 12 kullanır; maliyeti bir artırmak süreyi iki katına çıkarır. Çıktı 60 karakterlik tek bir dizedir:',
          { code: '$2b$12$ R9h/cIPz0gi.URNNX3kh2O PST9/PgBkqquzi.Ss7KIUgO2t0jWMUW\n │   │   └ 22 karakter salt     └ 31 karakter hash\n │   └ maliyet (2¹² tur)\n └ sürüm', caption: 'Boşluklar yalnız okunabilirlik için eklenmiştir; gerçek dizede yoktur.' },
          'Salt ve maliyet dizenin içinde olduğu için veritabanında ayrı sütun gerekmez; doğrulama için yalnız bu dizeyi saklamanız yeterlidir.',
        ],
      },
      {
        title: '72 bayt sınırı',
        blocks: [
          'bcrypt girdinin yalnız ilk 72 baytını kullanır. Türkçe karakterler UTF-8’de 2 bayt, emojiler 4 bayt tuttuğundan 72 bayt 72 karakterden az olabilir. Araç sessizce kesmek yerine sınırı aşan girdide hata verir. Daha uzun parolaları desteklemesi gereken yeni sistemlerde Argon2id kullanın.',
        ],
      },
    ],
    faq: [
      { q: 'Hangi maliyeti seçmeliyim?', a: 'OWASP en az 10 önerir. Sunucunuzda tek doğrulamanın 100–300 ms sürdüğü en yüksek değeri seçin ve donanım hızlandıkça artırın. Bu araç sabit olarak 12 kullanır.' },
      { q: '$2a$, $2b$ ve $2y$ arasındaki fark nedir?', a: 'Bunlar farklı uygulamalardaki hata düzeltmelerini işaretleyen sürüm önekleridir. Güncel kütüphaneler `$2b$` üretir; doğrulayıcı `$2a$` ve `$2b$` biçimlerini kabul eder.' },
    ],
    sources: [OWASP],
  },

  'bcrypt-verifier': {
    sections: [
      {
        title: 'Doğrulama nasıl yapılır?',
        blocks: [
          'bcrypt hash’i “çözülemez”. Doğrulama, saklanan dizedeki maliyet ve salt ile girilen parolanın yeniden hash’lenmesi ve sonucun saklanan hash ile karşılaştırılmasıdır. Bu nedenle doğrulama, üretimle aynı süreyi alır.',
          { steps: ['Parolayı girin.', 'Veritabanındaki `$2b$…` dizesinin tamamını “Saklanan hash” alanına yapıştırın.', '“Doğrula” sonrası sonuç yalnız eşleşiyor / eşleşmiyor olarak gösterilir.'] },
        ],
      },
      {
        title: 'Sık karşılaşılan sorunlar',
        blocks: [
          {
            list: [
              'Dizenin başında veya sonunda boşluk ya da tırnak kalması: dize tam olarak 60 karakter olmalıdır.',
              '`$2y$` öneki (PHP): bu araç `$2a$` ve `$2b$` kabul eder; `$2y$` önekini `$2b$` olarak değiştirmek aynı sonucu verir.',
              'Kaynak tüketimini sınırlamak için 14’ün üzerindeki maliyetler reddedilir.',
            ],
          },
        ],
      },
    ],
  },

  'argon2id-generator': {
    sections: [
      WHY_SLOW,
      {
        title: 'Argon2id ve parametreleri',
        blocks: [
          'Argon2, 2015’te Parola Hashleme Yarışması’nı (PHC) kazandı. Argon2id türü ilk geçişte veri bağımsız (Argon2i), sonraki geçişlerde veri bağımlı (Argon2d) bellek erişimi kullanarak hem yan kanal hem GPU saldırılarına karşı denge sağlar. RFC 9106 parola saklama için bu türü önerir.',
          {
            table: {
              head: ['Parametre', 'Değer', 'Anlamı'],
              rows: [
                ['m', '19 456 KiB', 'Her hesaplamada ayrılan bellek. Saldırganın paralel deneme sayısını belleğe bağlar.'],
                ['t', '2', 'Bellek üzerindeki geçiş sayısı.'],
                ['p', '1', 'Paralel şerit sayısı.'],
                ['salt', '16 bayt', 'Her hash için yeni, rastgele.'],
                ['çıktı', '32 bayt', 'Hash uzunluğu.'],
              ],
            },
          },
          'Bu değerler OWASP’ın önerdiği minimum yapılandırmalardan biridir. Bellek artırılabiliyorsa, aynı güvenlik için tur sayısı azaltılabilir (ör. m = 46 MiB, t = 1).',
        ],
      },
      {
        title: 'Çıktı biçimi',
        blocks: [
          { code: '$argon2id$v=19$m=19456,t=2,p=1$<salt>$<hash>', caption: 'PHC dize biçimi. libsodium, argon2-cffi ve node-argon2 gibi kütüphaneler bu biçimi okuyabilir.' },
          'Dize sürüm, parametre, salt ve hash’i birlikte taşır. Parametreleri ileride artırdığınızda eski hash’ler kendi parametreleriyle doğrulanmaya devam eder; kullanıcı bir sonraki girişinde yeni parametrelerle yeniden hash’lenebilir.',
        ],
      },
    ],
    faq: [
      { q: 'Hesaplama neden birkaç saniye sürüyor?', a: 'Argon2 kasıtlı olarak bellek ve zaman harcar. Tarayıcıda JavaScript ile çalıştığı için yerel kütüphanelerden daha yavaştır; sunucuda aynı parametreler genellikle 50–100 ms sürer.' },
      { q: 'Pepper eklemeli miyim?', a: 'Pepper, veritabanı dışında (ör. ortam değişkeni veya HSM) tutulan ek bir gizli değerdir ve yalnız veritabanı sızdığında koruma ekler. Bu araç pepper kullanmaz; gerekiyorsa uygulama kodunuzda HMAC ile eklenmelidir.' },
    ],
    sources: [RFC_9106, OWASP],
  },

  'argon2id-verifier': {
    sections: [
      {
        title: 'PHC dizesinden doğrulama',
        blocks: [
          'Doğrulayıcı `$argon2id$v=19$m=…,t=…,p=…$salt$hash` dizesini ayrıştırır, aynı parametre ve salt ile parolayı yeniden hash’ler ve sonucu karşılaştırır. Parametreler dizeden okunduğu için farklı ayarlarla üretilmiş hash’ler de doğrulanabilir.',
          'Tarayıcıyı korumak için şu sınırlar uygulanır: bellek en fazla 65 536 KiB (64 MiB), tur en fazla 6, paralellik 1–4, salt 8–64 bayt ve hash 32 bayt. Daha büyük parametreli veya farklı çıktı uzunluklu hash’ler hata verir.',
        ],
      },
      {
        title: 'Hata ayıklama',
        blocks: [
          {
            list: [
              '“Parametreleri destek sınırları dışında” hatası: hash 32 bayttan farklı bir çıktı uzunluğuyla veya 64 MiB üzeri bellekle üretilmiş olabilir.',
              'Bazı kütüphaneler Base64 dolgusu (`=`) ekler; PHC biçimi dolgusuzdur ve bu araç dolgulu dizeleri kabul etmez.',
              '`$argon2i$` veya `$argon2d$` ile başlayan hash’ler için [Hash doğrulama](/hash-dogrulama) sayfasını kullanın; bu araç yalnız Argon2id bekler.',
            ],
          },
        ],
      },
    ],
    sources: [RFC_9106],
  },

  'argon2i-generator': argon2Variant('argon2i'),
  'argon2d-generator': argon2Variant('argon2d'),

  'scrypt-generator': {
    sections: [
      WHY_SLOW,
      {
        title: 'scrypt parametreleri',
        blocks: [
          'scrypt, Colin Percival tarafından 2009’da bellek-zor olacak şekilde tasarlandı. Bellek kullanımı yaklaşık `128 × N × r` bayttır; araçtaki `N = 2¹⁷`, `r = 8`, `p = 1` değerleri hesaplama başına yaklaşık 128 MiB bellek demektir ve OWASP önerisine karşılık gelir.',
          { code: '$scrypt$ln=17,r=8,p=1$<salt>$<hash>', caption: '`ln`, N’nin log₂ değeridir. Bu biçim bu sitenin encoded biçimidir; evrensel bir standart değildir.' },
        ],
      },
      {
        title: 'scrypt mi Argon2id mi?',
        blocks: [
          'İkisi de bellek-zordur. Argon2id daha yeni, RFC olarak standartlaştırılmış ve parametreleri bağımsız ayarlanabilir olduğu için yeni projelerde önerilir. scrypt; Node.js `crypto.scrypt`, Python `hashlib.scrypt` ve birçok kripto para cüzdanında yerleşik olduğu için ek bağımlılık istemeyen durumlarda iyi bir seçimdir.',
        ],
      },
    ],
    faq: [{ q: 'Node.js ile aynı sonucu nasıl alırım?', a: '`crypto.scryptSync(parola, salt, 32, { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 })` aynı parametrelerle aynı 32 baytı üretir. Bu sitenin testleri bu eşleşmeyi Node.js ile karşılaştırarak doğrular.' }],
    sources: [RFC_7914, OWASP],
  },

  'scrypt-verifier': {
    sections: [
      {
        title: 'Doğrulama ve sınırlar',
        blocks: [
          'Doğrulayıcı `$scrypt$ln=…,r=…,p=…$salt$hash` dizesini okur ve parolayı aynı parametrelerle yeniden hesaplar. Desteklenen aralık: `ln` 10–17 (N = 1 024 – 131 072), `r` 1–8, `p` 1–2, salt 8–64 bayt, hash 32 bayt.',
          'Başka bir kütüphaneyle üretilmiş scrypt hash’leri farklı bir dize biçiminde olabilir (ör. `$7$` öneki veya ayrı alanlar). Bu durumda parametreleri ve salt’ı bu biçime çevirmeniz gerekir.',
        ],
      },
      {
        title: 'Parametreler ne kadar bellek ister?',
        blocks: [
          'Doğrulama, üretimle aynı belleği ve süreyi gerektirir. Bellek ihtiyacı yaklaşık `128 × N × r` bayttır; `r = 8` için:',
          {
            table: {
              head: ['ln', 'N', 'Bellek (r = 8)'],
              rows: [['14', '16 384', '16 MiB'], ['15', '32 768', '32 MiB'], ['16', '65 536', '64 MiB'], ['17', '131 072', '128 MiB']],
            },
          },
          'Mobil tarayıcılarda 128 MiB’lık hesaplama belirgin şekilde yavaşlayabilir; doğrulama Web Worker’da çalıştığı için sayfa donmaz ve “İptal” ile durdurulabilir.',
        ],
      },
    ],
    sources: [RFC_7914],
  },

  'pbkdf2-sha256': pbkdf2('SHA-256', '600 000', 'pbkdf2-sha256'),
  'pbkdf2-sha512': pbkdf2('SHA-512', '220 000', 'pbkdf2-sha512'),

  'pbkdf2-sha1': {
    sections: [
      {
        title: 'Neden hâlâ PBKDF2-SHA1?',
        blocks: [
          'SHA-1’in çarpışma zayıflığı, HMAC içinde kullanıldığı PBKDF2’nin güvenliğini doğrudan etkilemez; ancak SHA-1 GPU’da çok hızlı olduğu için aynı güç için çok daha fazla iterasyon gerekir. OWASP bu nedenle PBKDF2-HMAC-SHA1 için 1 300 000 iterasyon önerir; araç bu değeri kullanır.',
          'Yeni sistemlerde PBKDF2-SHA1 seçmek için bir neden yoktur. Bu araç, yalnız SHA-1 destekleyen eski sistemlerle uyumluluk testi içindir.',
        ],
      },
      {
        title: 'WPA2 ile ilişkisi',
        blocks: [
          'WPA2-PSK, Wi-Fi parolasından ağ anahtarını PBKDF2-HMAC-SHA1 ile türetir; ancak salt olarak ağ adını (SSID), 4 096 iterasyon ve 32 bayt çıktı kullanır. Bu araç rastgele salt ve 1 300 000 iterasyon kullandığı için WPA2 anahtarı üretmez.',
        ],
      },
    ],
    sources: [RFC_8018, OWASP],
  },

  'hash-identifier': {
    sections: [
      {
        title: 'Hash türü nasıl tahmin edilir?',
        blocks: [
          'Hash değerleri, hangi algoritmayla üretildiklerini söylemez. Tanımlayıcı iki ipucuna bakar: öneki olan biçimler (`$2b$`, `$argon2id$`, `$scrypt$`) kesin olarak tanınır; yalnız hex’ten oluşan değerlerde ise uzunluğa göre olası algoritmalar listelenir.',
          {
            table: {
              head: ['Uzunluk (hex)', 'Olası algoritmalar'],
              rows: [
                ['8', 'CRC32, CRC32C, Adler-32, FNV-1a, MurmurHash3'],
                ['32', 'MD5, çift MD5, HMAC-MD5'],
                ['40', 'SHA-1, RIPEMD-160, HMAC-SHA1'],
                ['56', 'SHA-224, SHA-512/224, SHA3-224'],
                ['64', 'SHA-256, SHA3-256, SHA-512/256, BLAKE2s, BLAKE3, HMAC-SHA256 ve diğerleri'],
                ['96', 'SHA-384, SHA3-384, HMAC-SHA384'],
                ['128', 'SHA-512, SHA3-512, BLAKE2b, HMAC-SHA512 ve diğerleri'],
              ],
            },
          },
        ],
      },
      {
        title: 'Sınırlar',
        blocks: [
          'Aynı uzunluktaki algoritmalar biçimden ayırt edilemez. Elinizde hash’in kaynağı olan metin varsa, [Çoklu hash](/coklu-hash) ile birkaç algoritmanın çıktısını hesaplayıp karşılaştırmak kesin sonuç verir.',
        ],
      },
    ],
  },
};
