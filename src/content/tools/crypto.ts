import type { ContentMap } from './types';

const WEBCRYPTO = { label: 'W3C Web Cryptography API', url: 'https://www.w3.org/TR/WebCryptoAPI/' };
const RFC_8017 = { label: 'RFC 8017 – PKCS #1: RSA Cryptography Specifications', url: 'https://www.rfc-editor.org/rfc/rfc8017' };

const CLASSICAL_NOTE = 'Yalnız İngiliz alfabesindeki 26 Latin harf dönüştürülür; Türkçe harfler (ç, ğ, ı, ö, ş, ü), rakamlar ve noktalama olduğu gibi kalır. Büyük/küçük harf korunur.';

export const cryptoContent: ContentMap = {
  'aes-gcm': {
    sections: [
      {
        title: 'Parola ile şifreleme nasıl yapılır?',
        blocks: [
          'AES bir anahtarla çalışır, parolayla değil. Araç önce parolanızdan PBKDF2-SHA256 (600 000 iterasyon, 16 bayt rastgele salt) ile 256 bitlik bir anahtar türetir, ardından metni bu anahtar ve 12 baytlık rastgele bir IV ile AES-256-GCM kullanarak şifreler. GCM, şifreli metne 16 baytlık bir doğrulama etiketi ekler; tek bir bayt değişirse çözme başarısız olur.',
          {
            code: '{\n  "v": 1,\n  "kdf": "PBKDF2-SHA256",\n  "iterations": 600000,\n  "salt": "…16 bayt, Base64…",\n  "iv": "…12 bayt, Base64…",\n  "ciphertext": "…şifreli metin + etiket, Base64…"\n}',
            caption: 'Çıktı biçimi. Çözmek için bu JSON’un tamamı ve aynı parola gerekir.',
          },
          'Her şifrelemede yeni salt ve IV üretildiği için aynı metin ve parola her seferinde farklı çıktı verir. Bu, GCM’in en tehlikeli hatası olan aynı anahtarla IV’nin tekrar kullanılmasını da önler.',
        ],
      },
      {
        title: 'Güvenlik notları',
        blocks: [
          {
            list: [
              'Şifrelemenin gücü parolanızın gücüyle sınırlıdır. Kısa bir parola, şifreli veriyi ele geçiren biri tarafından çevrimdışı denenebilir; [parola oluşturucuyla](/) üretilmiş uzun bir parola kullanın.',
              'Yanlış parola ile bozulmuş veri ayırt edilemez; ikisinde de “doğrulama başarısız” hatası alınır. Bu bilinçli bir davranıştır.',
              'Biçim bu siteye özgüdür (`v: 1`). Başka bir araçla çözmek için aynı adımları (PBKDF2 → AES-GCM, ek doğrulanmış veri `parola:v1`) uygulamanız gerekir.',
            ],
          },
        ],
      },
    ],
    faq: [
      { q: 'Şifreli metni e-postayla göndermek güvenli mi?', a: 'Şifreli JSON’u gönderebilirsiniz; parolayı ise farklı bir kanaldan (ör. telefonla) iletin. İkisi aynı kanaldan giderse şifrelemenin anlamı kalmaz.' },
      { q: 'Dosya şifreleyebilir miyim?', a: 'Bu araç metin şifreler. Dosyalar için age, GPG veya işletim sisteminizin disk şifreleme özelliğini kullanın.' },
    ],
    sources: [{ label: 'NIST SP 800-38D – GCM', url: 'https://csrc.nist.gov/pubs/sp/800/38/d/final' }, WEBCRYPTO],
  },

  'rsa-key-generator': {
    sections: [
      {
        title: 'Üretilen anahtar çifti',
        blocks: [
          'Araç Web Crypto ile 3072 bitlik bir RSA anahtar çifti üretir (genel üs 65537) ve iki PEM bloğu verir: `-----BEGIN PUBLIC KEY-----` (SPKI) ve `-----BEGIN PRIVATE KEY-----` (PKCS#8). 3072 bit, NIST’e göre 128 bit güvenlik düzeyine karşılık gelir ve 2030 sonrası için önerilen minimumdur.',
          { code: '# Açık anahtarı incelemek için\nopenssl pkey -pubin -in public.pem -text -noout\n\n# Özel anahtardan açık anahtarı yeniden çıkarmak için\nopenssl pkey -in private.pem -pubout' },
        ],
      },
      {
        title: 'Anahtarları kullanırken',
        blocks: [
          {
            list: [
              'Açık anahtarı paylaşabilirsiniz; özel anahtar yalnız onu kullanacak sistemde kalmalıdır.',
              'Anahtar OAEP için üretilir, ancak aynı PEM [RSA-PSS imzalama](/araclar/rsa-sign-verify) aracında da içe aktarılabilir. Üretimde şifreleme ve imza için ayrı anahtar çiftleri kullanmak iyi bir uygulamadır.',
              'Özel anahtar parolasız (şifrelenmemiş) PKCS#8 olarak verilir. Saklamadan önce `openssl pkcs8 -topk8 -v2 aes-256-cbc` ile şifreleyebilirsiniz.',
              'Yeni sistemlerde daha kısa anahtar ve daha hızlı işlem için [ECDSA P-256](/araclar/ecdsa-key-generator) veya [Ed25519](/araclar/ed25519-sign-verify) de değerlendirin.',
            ],
          },
        ],
      },
    ],
    sources: [RFC_8017, { label: 'NIST SP 800-57 Part 1 – Key Management', url: 'https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final' }],
  },

  'rsa-encrypt-decrypt': {
    sections: [
      {
        title: 'RSA-OAEP ile şifreleme',
        blocks: [
          'Açık anahtarla şifrelenen veriyi yalnız özel anahtarın sahibi çözebilir. Araç RSA-OAEP dolgusunu SHA-256 ile kullanır; OAEP her şifrelemeye rastgelelik eklediği için aynı metin her seferinde farklı şifreli metin üretir. Çıktı Base64 kodlu 384 bayttır (3072 bit anahtar için).',
          { steps: ['“Şifrele” modunda metni ve karşı tarafın SPKI açık anahtarını girin.', 'Base64 çıktıyı karşı tarafa gönderin.', 'Karşı taraf “Çöz” modunda şifreli metni ve kendi PKCS#8 özel anahtarını girer.'] },
        ],
      },
      {
        title: 'Uzunluk sınırı ve hibrit şifreleme',
        blocks: [
          'RSA-OAEP yalnız kısa veri şifreleyebilir: 3072 bit anahtar ve SHA-256 ile en fazla `384 − 2×32 − 2 = 318` bayt. Bu sınır UTF-8 bayt cinsindendir; Türkçe karakterler 2 bayt tutar.',
          'Uzun veriler için gerçek sistemler hibrit şifreleme kullanır: veri rastgele bir AES anahtarıyla şifrelenir, yalnız bu AES anahtarı RSA ile şifrelenir. TLS, PGP ve S/MIME bu şekilde çalışır.',
        ],
      },
    ],
    faq: [{ q: 'OpenSSL ile şifrelenmiş veriyi çözebilir miyim?', a: 'Evet, şifreleme OAEP + SHA-256 (MGF1-SHA256) ile yapıldıysa: openssl pkeyutl -encrypt -pubin -inkey public.pem -pkeyopt rsa_padding_mode:oaep -pkeyopt rsa_oaep_md:sha256 -pkeyopt rsa_mgf1_md:sha256 komutunun Base64 çıktısı bu araçta çözülür.' }],
    sources: [RFC_8017],
  },

  'rsa-sign-verify': {
    sections: [
      {
        title: 'Dijital imza nasıl çalışır?',
        blocks: [
          'İmzalamada mesajın SHA-256 hash’i özel anahtarla işlenir; doğrulamada açık anahtarla imzanın bu mesaja ait olduğu denetlenir. Geçerli bir imza iki şeyi kanıtlar: mesaj değiştirilmemiştir ve özel anahtarın sahibi tarafından imzalanmıştır.',
          'Araç RSA-PSS kullanır (SHA-256, MGF1-SHA256, 32 bayt salt). PSS imzaları rastgele salt içerdiği için aynı mesaj her imzalamada farklı imza üretir; hepsi geçerlidir.',
        ],
      },
      {
        title: 'PSS ve PKCS#1 v1.5',
        blocks: [
          'Eski sistemlerde yaygın olan PKCS#1 v1.5 imzası deterministiktir ve hâlâ güvenli kabul edilir; ancak PSS güvenlik kanıtı daha güçlü olan modern şemadır ve TLS 1.3’te RSA imzaları için zorunludur. Bu araçla üretilen imzalar v1.5 bekleyen bir doğrulayıcıda geçersiz görünür.',
          { code: 'openssl dgst -sha256 -sigopt rsa_padding_mode:pss -sigopt rsa_pss_saltlen:32 \\\n  -verify public.pem -signature imza.bin mesaj.txt', caption: 'imza.bin, araçtaki Base64 imzanın çözülmüş hâlidir (base64 -d).' },
        ],
      },
    ],
    sources: [RFC_8017],
  },

  'ecdsa-key-generator': {
    sections: [
      {
        title: 'P-256 anahtar çifti',
        blocks: [
          'ECDSA, eliptik eğri üzerinde çalışan imza algoritmasıdır. Araç NIST P-256 (secp256r1, prime256v1) eğrisinde anahtar üretir. 256 bitlik bir eliptik eğri anahtarı, 3072 bitlik RSA ile yaklaşık aynı (128 bit) güvenlik düzeyini çok daha kısa anahtar ve imzayla sağlar.',
          'Çıktı, SPKI biçiminde açık anahtar ve PKCS#8 biçiminde özel anahtar içeren iki PEM bloğudur. Anahtarlar [ECDSA imzala / doğrula](/araclar/ecdsa-sign-verify) aracında doğrudan kullanılabilir.',
        ],
      },
      {
        title: 'Nerelerde kullanılır?',
        blocks: [
          { list: ['TLS sertifikaları (ECDSA sertifikaları RSA’ya göre daha küçük el sıkışma sağlar).', 'JWT için ES256 algoritması.', 'WebAuthn / passkey kimlik bilgileri.', 'Apple, Google ve AWS imzalı istekleri gibi API kimlik doğrulama şemaları.'] },
        ],
      },
    ],
    sources: [{ label: 'FIPS 186-5 – Digital Signature Standard', url: 'https://csrc.nist.gov/pubs/fips/186-5/final' }],
  },

  'ecdsa-sign-verify': {
    sections: [
      {
        title: 'İmzalama ve doğrulama',
        blocks: [
          'İmzalama modunda mesaj ve PKCS#8 özel anahtar, doğrulama modunda mesaj, SPKI açık anahtar ve Base64 imza girilir. Algoritma ECDSA, eğri P-256, hash SHA-256’dır (JWT’deki ES256 ile aynı).',
          'ECDSA her imzada rastgele bir değer (k) kullanır; aynı mesajın imzaları her seferinde farklıdır. Web Crypto bu değeri güvenli üretir. Aynı k’nin iki farklı mesajda kullanılması özel anahtarı açığa çıkarır; PlayStation 3 anahtarı bu hatayla ele geçirilmişti.',
        ],
      },
      {
        title: 'İmza biçimi: r||s ve DER',
        blocks: [
          'Web Crypto, imzayı 64 baytlık ham `r || s` biçiminde (IEEE P1363) üretir. OpenSSL, Java ve X.509 ise ASN.1 DER biçimini (genellikle 70–72 bayt) kullanır. JWT (ES256) ham biçimi kullandığı için bu araçla uyumludur; OpenSSL ile karşılaştırırken biçim dönüşümü gerekir.',
        ],
      },
    ],
    faq: [{ q: 'OpenSSL ile ürettiğim imza neden geçersiz görünüyor?', a: 'OpenSSL ECDSA imzalarını DER biçiminde üretir. Bu araç 64 baytlık ham r||s bekler; DER imzadaki r ve s tamsayılarını 32’şer bayta tamamlayıp birleştirmeniz gerekir.' }],
    sources: [{ label: 'FIPS 186-5 – Digital Signature Standard', url: 'https://csrc.nist.gov/pubs/fips/186-5/final' }, WEBCRYPTO],
  },

  'ed25519-sign-verify': {
    sections: [
      {
        title: 'Ed25519 nedir?',
        blocks: [
          'Ed25519, Edwards25519 eğrisi üzerinde çalışan EdDSA imza şemasıdır (RFC 8032). 32 baytlık açık anahtar ve 64 baytlık imza kullanır, yaklaşık 128 bit güvenlik sağlar. ECDSA’dan farklı olarak imzalar deterministiktir: rastgele değer mesajdan ve özel anahtardan türetildiği için zayıf rastgelelik kaynaklı anahtar sızıntısı riski yoktur.',
          'Araç üç mod sunar: “Anahtar üret” yeni bir çift oluşturur; “İmzala” ve “Doğrula” bu anahtarlarla çalışır. Aynı mesaj ve anahtar her zaman aynı imzayı verir.',
        ],
      },
      {
        title: 'Kullanım alanları ve tarayıcı desteği',
        blocks: [
          { list: ['SSH anahtarları (`ssh-ed25519`).', 'Signal, WireGuard, Tor ve birçok blokzinciri.', 'Paket imzalama (ör. minisign, OpenBSD signify).', 'JWT’de `EdDSA` algoritması.'] },
          'Ed25519 Web Crypto’ya geç eklendi; güncel Chrome, Firefox ve Safari sürümleri destekler. Eski bir tarayıcıda araç “desteklenmiyor” hatası verebilir.',
          'Not: SSH’nin `ssh-ed25519` anahtar dosyaları PEM/SPKI değil, OpenSSH biçimindedir; bu araçta kullanmak için önce SPKI / PKCS#8 PEM biçimine dönüştürülmesi gerekir.',
        ],
      },
    ],
    sources: [{ label: 'RFC 8032 – Edwards-Curve Digital Signature Algorithm', url: 'https://www.rfc-editor.org/rfc/rfc8032' }],
  },

  'caesar-cipher': {
    sections: [
      {
        title: 'Sezar şifresi',
        blocks: [
          'Her harf alfabede sabit sayıda kaydırılır. Julius Caesar’ın 3 kaydırma kullandığı aktarılır: A → D, B → E, Z → C. Çözme, aynı miktarda geriye kaydırmadır.',
          { code: 'Kaydırma 3\nMetin:     Merhaba Dunya\nŞifreli:   Phukded Gxqbd' },
          CLASSICAL_NOTE,
        ],
      },
      {
        title: 'Neden güvenli değil?',
        blocks: [
          'Yalnız 25 anlamlı anahtar vardır; tüm olasılıkları elle denemek bile dakikalar sürer. Ayrıca harf sıklıkları korunur: İngilizce metinde en sık harf E ise şifreli metinde en sık harf E’nin kaydırılmış hâlidir. Sezar şifresi bugün yalnız kriptografinin temel kavramlarını öğretmek için kullanılır.',
        ],
      },
    ],
  },

  'vigenere-cipher': {
    sections: [
      {
        title: 'Vigenère şifresi',
        blocks: [
          'Vigenère, her harfi anahtar kelimedeki sıradaki harfe göre farklı miktarda kaydırır; anahtar bitince başa döner. Aynı harf metnin farklı yerlerinde farklı harflere dönüştüğü için yüzyıllarca “çözülemez şifre” olarak anıldı.',
          { code: 'Anahtar:   KEY  (K=10, E=4, Y=24)\nMetin:     ATTACK\nŞifreli:   KXRKGI' },
          `${CLASSICAL_NOTE} Anahtardaki harf olmayan karakterler yok sayılır ve anahtar yalnız harflere uygulanır.`,
        ],
      },
      {
        title: 'Nasıl kırılır?',
        blocks: [
          '1863’te Friedrich Kasiski, şifreli metinde tekrar eden parçalar arasındaki uzaklıklardan anahtar uzunluğunun bulunabileceğini gösterdi. Uzunluk bilinince metin, her biri ayrı bir Sezar şifresi olan sütunlara bölünür ve harf sıklığı analiziyle çözülür. Anahtar metin kadar uzun, tamamen rastgele ve tek kullanımlık olursa yöntem “tek kullanımlık şerit”e (one-time pad) dönüşür ve kırılamaz hâle gelir.',
        ],
      },
    ],
  },

  'rot13-cipher': {
    sections: [
      {
        title: 'ROT13 nedir?',
        blocks: [
          'ROT13, kaydırma miktarı 13 olan bir Sezar şifresidir. İngilizce alfabe 26 harf olduğu için ROT13’ü iki kez uygulamak metni geri getirir; bu yüzden şifreleme ve çözme aynı işlemdir.',
          { code: 'Hello, World!  →  Uryyb, Jbeyq!' },
          CLASSICAL_NOTE,
        ],
      },
      {
        title: 'Nerelerde kullanılır?',
        blocks: [
          'ROT13 gizlilik sağlamaz; amacı metnin yanlışlıkla okunmasını önlemektir. Forumlarda bulmaca çözümleri ve film sürprizleri, eski Usenet gruplarında hassas espriler bu şekilde gizlenirdi. Bazı yazılımlar yapılandırma değerlerini ROT13 ile “gizler”; bu, güvenlik açısından düz metinden farksızdır.',
        ],
      },
    ],
  },
};
