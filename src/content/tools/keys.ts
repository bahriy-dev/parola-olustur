import type { ContentMap } from './types';

const RFC_2104 = { label: 'RFC 2104 – HMAC', url: 'https://www.rfc-editor.org/rfc/rfc2104' };

export const keysContent: ContentMap = {
  'hkdf-tool': {
    sections: [
      {
        title: 'HKDF ne işe yarar?',
        blocks: [
          'HKDF (RFC 5869), zaten yüksek entropili bir anahtar malzemesinden (ör. Diffie-Hellman ortak sırrı, ana anahtar) bir veya daha fazla bağımsız anahtar türetir. İki adımdan oluşur: **extract** adımı salt ile HMAC-SHA256 uygulayarak malzemeyi düzgün dağılımlı bir ara anahtara (PRK) çevirir; **expand** adımı bu ara anahtardan `info` bağlamına göre istenen uzunlukta çıktı üretir.',
          { code: 'IKM: ikm   Salt: salt   Info: info\nÇıktı (32 bayt): fe8f9615d2374c0d17f77d1aeaf408c2e75fe0466073d0def23c733e2f862dfd', caption: 'Node.js `crypto.hkdfSync(\'sha256\', \'ikm\', \'salt\', \'info\', 32)` aynı sonucu verir.' },
        ],
      },
      {
        title: 'Doğru kullanım',
        blocks: [
          {
            list: [
              '`info` ile aynı ana anahtardan farklı amaçlar için ayrı anahtarlar türetin (ör. `"şifreleme"` ve `"imza"`). Böylece bir anahtar sızarsa diğeri etkilenmez.',
              'Salt gizli olmak zorunda değildir ama mümkünse rastgele olmalıdır. Boş bırakılırsa RFC gereği sıfırlardan oluşan bir salt kullanılır.',
              'HKDF parolalar için **değildir**: düşük entropili girdiyi yavaşlatmaz. Paroladan anahtar türetmek için [Argon2id](/araclar/argon2id-generator) veya [PBKDF2](/araclar/pbkdf2-sha256) kullanın.',
            ],
          },
          'Bu araç tüm girdileri UTF-8 metin olarak alır. RFC 5869 test vektörleri hex bayt kullandığı için bu araçla doğrudan karşılaştırılamaz.',
        ],
      },
    ],
    sources: [{ label: 'RFC 5869 – HKDF', url: 'https://www.rfc-editor.org/rfc/rfc5869' }],
  },

  'hmac-generator': {
    sections: [
      {
        title: 'HMAC nedir?',
        blocks: [
          'HMAC (Hash-based Message Authentication Code), bir mesajın gizli anahtarı bilen biri tarafından üretildiğini ve değiştirilmediğini kanıtlayan bir koddur. Hash fonksiyonunu anahtarla iki katmanlı biçimde kullandığı için SHA-256’nın uzunluk uzatma zayıflığından etkilenmez.',
          { code: 'Mesaj:   The quick brown fox jumps over the lazy dog\nAnahtar: key\nHMAC-SHA256: f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8' },
          'Araç HMAC-SHA256 (64 hex karakter) ve HMAC-SHA512 (128 hex karakter) destekler; mesaj ve anahtar UTF-8 olarak işlenir.',
        ],
      },
      {
        title: 'Webhook imzalarını doğrulama',
        blocks: [
          'GitHub, Stripe, Shopify ve Slack gibi servisler gönderdikleri webhook isteklerini HMAC-SHA256 ile imzalar. İmzayı elle denetlemek için:',
          {
            steps: [
              'İsteğin ham gövdesini (JSON’u yeniden biçimlendirmeden) “Mesaj” alanına yapıştırın.',
              'Servisin verdiği webhook gizli anahtarını “Anahtar” alanına girin.',
              'Çıktıyı istekteki imza başlığıyla karşılaştırın (ör. GitHub: `X-Hub-Signature-256: sha256=<hex>`). Stripe gibi bazı servisler gövdenin önüne zaman damgası ekleyerek imzalar; servisin belgelerine bakın.',
            ],
          },
        ],
      },
    ],
    faq: [{ q: 'Anahtar ne kadar uzun olmalı?', a: 'En az hash çıktısı kadar: HMAC-SHA256 için 32 bayt. Rastgele bir anahtarı [güvenli token oluşturucuyla](/araclar/secure-token-generator) üretebilirsiniz.' }],
    sources: [RFC_2104],
  },

  'hmac-verifier': {
    sections: [
      {
        title: 'HMAC nasıl doğrulanır?',
        blocks: [
          'Doğrulama, aynı mesaj ve anahtarla HMAC’i yeniden hesaplayıp beklenen değerle karşılaştırmaktır. Araç seçtiğiniz algoritmayla (SHA-256 veya SHA-512) hesaplama yapar ve hex değerleri büyük/küçük harf ayırt etmeden, tüm baytlar üzerinden karşılaştırır.',
          'Sonuç yalnız “doğrulandı” veya “uyuşmuyor” olarak gösterilir. Uyuşmazlık durumunda en sık nedenler: gövdenin yeniden biçimlendirilmiş olması (boşluk, satır sonu), yanlış anahtar, `sha256=` gibi bir önekin beklenen değere eklenmiş olması veya algoritmanın farklı olmasıdır.',
        ],
      },
      {
        title: 'Sunucu kodunda dikkat',
        blocks: [
          'Kendi uygulamanızda karşılaştırmayı `==` ile değil, sabit zamanlı bir fonksiyonla yapın (Node.js `crypto.timingSafeEqual`, Python `hmac.compare_digest`, Go `hmac.Equal`). Aksi hâlde yanıt süresindeki farklardan doğru imza bayt bayt tahmin edilebilir. Bu araç tüm baytları karşılaştırır, ancak JavaScript sabit zamanlı çalışmayı garanti etmez.',
        ],
      },
    ],
    sources: [RFC_2104],
  },

  'checksum-verifier': {
    sections: [
      {
        title: 'CRC32 ve Adler-32',
        blocks: [
          {
            table: {
              head: ['', 'CRC32', 'Adler-32'],
              rows: [
                ['“abc” değeri', '`352441c2`', '`024d0127`'],
                ['Yöntem', 'Polinom bölmesi (IEEE 802.3)', 'İki toplamın birleşimi'],
                ['Kullanıldığı yerler', 'ZIP, PNG, gzip, Ethernet', 'zlib veri akışı'],
                ['Hata tespiti', 'Tek bit ve kısa patlama hatalarında çok güçlü', 'Daha hızlı ama kısa girdilerde zayıf'],
              ],
            },
          },
          'Değer 8 hex karakter olarak girilir ve büyük/küçük harf fark etmez.',
        ],
      },
      {
        title: 'Sağlama toplamı güvenlik sağlamaz',
        blocks: [
          'CRC32 ve Adler-32 kazara oluşan bozulmaları (aktarım hatası, bozuk disk) yakalamak için tasarlanmıştır. Aynı değeri veren farklı bir veri üretmek önemsizdir; bu yüzden bir dosyanın kötü niyetle değiştirilip değiştirilmediğini denetlemek için [SHA-256](/hash/sha-256), anahtarlı doğrulama için [HMAC](/araclar/hmac-generator) kullanın.',
        ],
      },
    ],
  },

  'keccak256-tool': {
    sections: [
      {
        title: 'Keccak-256 ve SHA3-256 farkı',
        blocks: [
          'Ethereum, SHA-3 yarışmasını kazanan Keccak algoritmasını NIST standardı (FIPS 202) yayımlanmadan önce benimsedi. NIST son aşamada dolgu kuralını değiştirdi; bu nedenle Keccak-256 ve SHA3-256 aynı girdi için farklı sonuç verir. Ethereum ve Solidity’deki `keccak256` bu araçtaki orijinal Keccak’tır.',
          { code: 'keccak256("")    = c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470\nsha3_256("")    = a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a' },
        ],
      },
      {
        title: 'Ethereum’da kullanımı',
        blocks: [
          {
            list: [
              '**Fonksiyon seçicisi:** fonksiyon imzasının hash’inin ilk 4 baytı. `transfer(address,uint256)` → `0xa9059cbb`.',
              '**Olay konusu (topic):** `Transfer(address,address,uint256)` gibi olay imzalarının tam hash’i.',
              '**Adres:** açık anahtarın Keccak-256 hash’inin son 20 baytı.',
            ],
          },
          { note: 'Araç girdiyi UTF-8 metin olarak hash’ler. `0x1234…` biçiminde bir hex değerin baytlarını hash’lemek istiyorsanız sonuç farklı olur; Solidity’deki `keccak256(abi.encodePacked(...))` ile karşılaştırırken bu farka dikkat edin.' },
        ],
      },
    ],
    sources: [{ label: 'The Keccak reference', url: 'https://keccak.team/keccak.html' }],
  },

  'ripemd160-tool': {
    sections: [
      {
        title: 'RIPEMD-160 nedir?',
        blocks: [
          'RIPEMD-160, 1996’da Avrupa’daki RIPE projesi kapsamında geliştirilen 160 bitlik (40 hex karakter) bir hash fonksiyonudur. SHA-1 ile aynı çıktı uzunluğuna sahiptir, ancak bilinen pratik bir çarpışma saldırısı yoktur.',
          { code: "printf 'abc' | openssl dgst -ripemd160\n8eb208f7e05d987a9b044a8e98c6b087f15a0bfc" },
        ],
      },
      {
        title: 'Bitcoin’deki rolü',
        blocks: [
          'Bitcoin, eski tip (P2PKH) adresleri oluştururken açık anahtara önce SHA-256, sonra RIPEMD-160 uygular; bu birleşime HASH160 denir. Sonuç 20 baytlık kısa bir kimliktir ve iki farklı hash fonksiyonu kullanmak, birinde bulunabilecek bir zayıflığa karşı koruma sağlar.',
          'Araç girdiyi UTF-8 metin olarak hash’ler. HASH160’ı hesaplamak için açık anahtar baytlarının SHA-256 çıktısını ham bayt olarak RIPEMD-160’a vermek gerekir; bu, metin girdisiyle elde edilemez.',
          'Yeni sistemlerde 160 bitlik çıktı yalnız 80 bit çarpışma direnci sağladığı için SHA-256 tercih edilir.',
        ],
      },
    ],
  },

  'public-key-fingerprint': {
    sections: [
      {
        title: 'Parmak izi nasıl hesaplanır?',
        blocks: [
          'Araç SPKI biçimindeki açık anahtarın (`-----BEGIN PUBLIC KEY-----`) DER baytlarının SHA-256 hash’ini alır ve `SHA256:` önekiyle Base64 olarak gösterir. Parmak izi, uzun bir açık anahtarı karşı tarafla telefonda veya ayrı bir kanaldan güvenle karşılaştırmanın kısa yoludur.',
          { code: 'openssl pkey -pubin -in public.pem -outform DER | openssl dgst -sha256 -binary | base64', caption: 'Aynı değeri OpenSSL ile üretir.' },
        ],
      },
      {
        title: 'SSH ve sertifika parmak izleriyle farkı',
        blocks: [
          {
            list: [
              '`ssh-keygen -lf` SSH’nin kendi anahtar biçimini hash’ler ve Base64 dolgusunu (`=`) kaldırır; aynı anahtar için sonuç farklıdır.',
              'Tarayıcının gösterdiği sertifika parmak izi, açık anahtarın değil tüm sertifikanın hash’idir.',
              'HPKP ve sertifika sabitlemede (pinning) kullanılan `pin-sha256` değeri ise bu araçla aynı yöntemle (SPKI’nin SHA-256’sı, Base64) hesaplanır.',
            ],
          },
          'Araç yalnız `PUBLIC KEY` (SPKI) PEM kabul eder; `RSA PUBLIC KEY` (PKCS#1) veya sertifika girildiğinde hata verir.',
        ],
      },
    ],
  },

  'pem-parser': {
    sections: [
      {
        title: 'PEM biçimi',
        blocks: [
          'PEM, ikili DER verisini Base64 ile kodlayıp `-----BEGIN …-----` ve `-----END …-----` satırları arasına koyan metin biçimidir. Etiket içeriğin türünü söyler. Araç kapsayıcıyı doğrular, etiketi ve içerdiği bayt sayısını gösterir.',
          {
            table: {
              head: ['Etiket', 'İçerik', 'Bu araçta'],
              rows: [
                ['`PUBLIC KEY`', 'SPKI açık anahtar (RSA, EC, Ed25519)', 'Desteklenir'],
                ['`PRIVATE KEY`', 'Şifrelenmemiş PKCS#8 özel anahtar', 'Desteklenir'],
                ['`CERTIFICATE`', 'X.509 sertifika', 'Desteklenir (yalnız kapsayıcı)'],
                ['`RSA PRIVATE KEY`, `EC PRIVATE KEY`', 'Eski PKCS#1 / SEC1 biçimleri', 'Desteklenmez'],
                ['`ENCRYPTED PRIVATE KEY`', 'Parolayla şifrelenmiş PKCS#8', 'Desteklenmez'],
              ],
            },
          },
        ],
      },
      {
        title: 'Bu araç neyi yapmaz?',
        blocks: [
          'ASN.1 yapısı ayrıştırılmaz; sertifikanın sahibi, geçerlilik tarihleri veya imzalayan kurum gösterilmez ve güven zinciri doğrulanmaz. Bu bilgiler için `openssl x509 -in sertifika.pem -text -noout` kullanın.',
          { code: 'openssl pkey -in eski.pem -out yeni.pem', caption: 'Eski biçimdeki bir özel anahtarı PKCS#8’e dönüştürür.' },
        ],
      },
    ],
    sources: [{ label: 'RFC 7468 – Textual Encodings of PKIX Structures', url: 'https://www.rfc-editor.org/rfc/rfc7468' }],
  },

  'ecdh-demo': {
    sections: [
      {
        title: 'Diffie-Hellman anahtar değişimi',
        blocks: [
          'İki taraf, açık bir kanal üzerinden yalnız açık anahtarlarını paylaşarak ortak bir gizli değer üzerinde anlaşabilir. Her taraf kendi özel anahtarını karşı tarafın açık anahtarıyla birleştirir; eliptik eğri matematiği sayesinde iki hesaplama aynı sonucu verir, ama kanalı dinleyen biri yalnız açık anahtarlarla bu değeri hesaplayamaz.',
          { steps: ['A ve B tarafları için P-256 eğrisinde iki geçici anahtar çifti üretilir.', 'A, kendi özel anahtarı ve B’nin açık anahtarıyla 256 bit ortak değer türetir.', 'B, kendi özel anahtarı ve A’nın açık anahtarıyla aynı işlemi yapar.', 'Araç iki değerin eşit olup olmadığını gösterir; değerin kendisini göstermez.'] },
        ],
      },
      {
        title: 'Gerçek protokollerde',
        blocks: [
          'TLS 1.3, Signal ve WireGuard her bağlantıda geçici (ephemeral) ECDH anahtarları kullanır; buna ileri gizlilik (forward secrecy) denir: sunucunun uzun süreli anahtarı ileride ele geçse bile geçmiş oturumlar çözülemez.',
          'Ham ortak değer doğrudan şifreleme anahtarı olarak kullanılmaz; önce [HKDF](/araclar/hkdf-tool) gibi bir fonksiyondan geçirilir. Ayrıca açık anahtarların doğrulanmaması (ör. imza veya sertifika ile) ortadaki adam saldırısına izin verir; ECDH tek başına karşı tarafın kim olduğunu kanıtlamaz.',
        ],
      },
    ],
    sources: [{ label: 'NIST SP 800-56A Rev. 3 – Key Establishment', url: 'https://csrc.nist.gov/pubs/sp/800/56/a/r3/final' }],
  },
};
