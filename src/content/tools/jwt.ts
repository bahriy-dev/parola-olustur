import type { ContentMap } from './types';

const RFC_7519 = { label: 'RFC 7519 – JSON Web Token (JWT)', url: 'https://www.rfc-editor.org/rfc/rfc7519' };
const RFC_8725 = { label: 'RFC 8725 – JWT Best Current Practices', url: 'https://www.rfc-editor.org/rfc/rfc8725' };
const RFC_4648 = { label: 'RFC 4648 – Base16, Base32, Base64 Encodings', url: 'https://www.rfc-editor.org/rfc/rfc4648' };
const RFC_9562 = { label: 'RFC 9562 – Universally Unique IDentifiers (UUIDs)', url: 'https://www.rfc-editor.org/rfc/rfc9562' };

export const jwtContent: ContentMap = {
  'jwt-encoder': {
    sections: [
      {
        title: 'JWT nasıl oluşturulur?',
        blocks: [
          'JWT üç bölümden oluşur ve bölümler noktayla ayrılır: `header.payload.signature`. Araç, header’ı `{"alg":"HS256","typ":"JWT"}` olarak sabitler, header ve payload’u UTF-8 olarak Base64URL ile kodlar, ardından `header.payload` dizesini gizli anahtarla HMAC-SHA256 ile imzalar.',
          { code: 'base64url(header) + "." + base64url(payload)\n→ HMAC-SHA256(gizli_anahtar, yukarıdaki dize)\n→ base64url(imza)', caption: 'Payload şifrelenmez; Base64URL yalnız bir kodlamadır.' },
        ],
      },
      {
        title: 'Payload’a ne yazılmalı?',
        blocks: [
          {
            table: {
              head: ['Claim', 'Anlamı', 'Örnek'],
              rows: [
                ['`sub`', 'Token’ın ait olduğu kullanıcı veya varlık', '`"user_123"`'],
                ['`exp`', 'Son geçerlilik zamanı (Unix saniye)', '`1893456000`'],
                ['`iat`', 'Oluşturulma zamanı', '`1767225600`'],
                ['`nbf`', 'Bu zamandan önce geçersiz', '`1767225600`'],
                ['`iss` / `aud`', 'Token’ı veren ve kabul edecek taraf', '`"https://auth.example.com"` / `"api"`'],
              ],
            },
          },
          { note: 'Payload’u token’ı gören herkes okuyabilir. Parola, kişisel veri veya gizli anahtar yazmayın.' },
        ],
      },
      {
        title: 'Anahtar uzunluğu',
        blocks: [
          'RFC 7518, HS256 için en az 256 bit (32 bayt) anahtar ister. Araç daha kısa anahtarları reddeder; çünkü kısa veya tahmin edilebilir anahtarlar, ele geçirilen tek bir token üzerinden çevrimdışı deneme ile bulunabilir. Anahtar üretmek için [güvenli token oluşturucuyu](/araclar/secure-token-generator) kullanabilirsiniz.',
        ],
      },
    ],
    faq: [
      { q: 'RS256 veya ES256 ile imzalayabilir miyim?', a: 'Bu araç yalnız HS256 (paylaşılan gizli anahtar) destekler. Asimetrik imza gerektiren durumlarda bir kütüphane ve özel anahtar kullanın.' },
      { q: 'Ürettiğim token’ı nasıl kontrol ederim?', a: '[JWT Çözücü](/araclar/jwt-decoder) içeriği gösterir, [JWT Doğrulayıcı](/araclar/jwt-verifier) imzayı ve zaman claim’lerini denetler.' },
    ],
    sources: [RFC_7519, RFC_8725],
  },

  'jwt-decoder': {
    sections: [
      {
        title: 'Çözme ile doğrulama arasındaki fark',
        blocks: [
          'JWT’nin header ve payload bölümleri Base64URL ile kodlanmış JSON’dur ve anahtar olmadan okunabilir. Bu araç yalnız bu kodlamayı çözer. Token’ın gerçekten beklenen tarafından üretildiğini ve değiştirilmediğini ancak imza doğrulaması gösterir; bunun için gizli veya açık anahtar gerekir.',
          { list: ['**Çözme (decode):** içeriği okur, anahtar gerekmez, güven sağlamaz.', '**Doğrulama:** imzayı ve `exp`, `nbf`, `iss`, `aud` claim’lerini denetler; yetkilendirme kararı yalnız buna dayanmalıdır.'] },
        ],
      },
      {
        title: 'Çıktıda nelere bakılmalı?',
        blocks: [
          {
            list: [
              'Header’daki `alg`: sunucunuz yalnız beklediği algoritmayı kabul etmelidir. `none` veya beklenmeyen bir algoritma içeren token’lar reddedilmelidir.',
              '`exp` ve `nbf`: araç bunları okunur tarihe çevirir ve token’ı girdiğiniz andaki duruma göre işaretler.',
              '`kid`: anahtar döndürme kullanan sistemlerde hangi anahtarla imzalandığını gösterir.',
              'Payload’da gizli olmaması gereken veriler (e-posta, telefon, iç kimlikler) olup olmadığı.',
            ],
          },
        ],
      },
      {
        title: 'Gizlilik',
        blocks: [
          'Token tarayıcıda, yazdığınız anda çözülür ve hiçbir yere gönderilmez. Yine de üretim ortamından alınmış ve süresi dolmamış bir token, ele geçirildiğinde oturum anahtarı gibi kullanılabilir; paylaşmadan önce süresinin dolduğundan emin olun.',
        ],
      },
    ],
    faq: [
      { q: '“Header veya payload geçerli Base64URL kodlu JSON değil” hatası ne demek?', a: 'Token kopyalanırken kesilmiş, başına “Bearer ” eklenmiş veya JWT yerine şifreli bir JWE (beş bölümlü) yapıştırılmış olabilir.' },
      { q: 'İmza bölümü neden okunamıyor?', a: 'İmza JSON değil, ham bayttır. Araç onu Base64URL hâliyle gösterir; doğrulama için [JWT Doğrulayıcı](/araclar/jwt-verifier) kullanın.' },
    ],
    sources: [RFC_7519, RFC_8725],
  },

  'jwt-verifier': {
    sections: [
      {
        title: 'Hangi denetimler yapılır?',
        blocks: [
          {
            steps: [
              'Token’ın üç bölümlü olduğu ve header’daki `alg` değerinin HS256 olduğu denetlenir. `none`, HS384/HS512 veya RS256 gibi beklenmeyen algoritmalar reddedilir; bu, “algoritma karıştırma” saldırılarını önler.',
              '`crit` alanı veya `b64: false` içeren header’lar desteklenmediği için reddedilir.',
              'İmza, girilen anahtarla yeniden hesaplanıp tüm baytlarıyla karşılaştırılır. 32 bayttan kısa anahtarlar kabul edilmez.',
              'Claim’ler ayrıca denetlenir: `exp` geçmişse veya `nbf` gelecekteyse hata verilir; beklenen `iss` / `aud` girildiyse eşleşmeleri aranır (`aud` dizi olabilir).',
            ],
          },
          'İmza ve claim sonuçları ayrı gösterilir: imzası geçerli ama süresi dolmuş bir token, imzası geçersiz bir token’dan farklı bir sorundur.',
        ],
      },
      {
        title: 'Sunucu tarafında unutulmaması gerekenler',
        blocks: [
          {
            list: [
              'Algoritmayı token’dan değil, yapılandırmadan alın.',
              'Saat farkları için birkaç saniyelik tolerans tanımlayın; bu araç tolerans uygulamaz.',
              '`aud` denetimini atlamayın; aksi hâlde başka bir servis için verilmiş token sizin servisinizde de geçerli olur.',
              'Kısa ömürlü erişim token’ları ve iptal edilebilir yenileme token’ları kullanın.',
            ],
          },
        ],
      },
    ],
    faq: [{ q: 'Beklenen iss / aud alanına ne yazmalıyım?', a: 'JSON nesnesi olarak, örneğin {"iss":"https://auth.example.com","aud":"api"}. Alan boş bırakılırsa bu iki claim denetlenmez.' }],
    sources: [RFC_8725, RFC_7519],
  },

  'uuid-generator': {
    sections: [
      {
        title: 'UUID v4 ve v7 farkı',
        blocks: [
          'Araç her çalıştırmada iki kimlik üretir. İkisi de 128 bit ve aynı `8-4-4-4-12` biçimindedir; fark bitlerin nasıl doldurulduğundadır.',
          {
            table: {
              head: ['', 'UUID v4', 'UUID v7'],
              rows: [
                ['İçerik', '122 rastgele bit', '48 bit milisaniye zaman damgası + 74 rastgele bit'],
                ['Sıralama', 'Rastgele', 'Oluşturulma zamanına göre artan'],
                ['Veritabanı indeksi', 'Rastgele eklemeler B-ağacını parçalar', 'Sona eklenir, indeks dostu'],
                ['Bilgi sızıntısı', 'Yok', 'Oluşturulma zamanı okunabilir'],
              ],
            },
          },
          'UUID v7, 2024’te yayımlanan RFC 9562 ile standartlaştı ve birincil anahtar olarak kullanım için önerilir. Oluşturulma zamanının görünmesi sorun olacaksa v4 kullanın.',
        ],
      },
      {
        title: 'Çakışma olasılığı',
        blocks: [
          'v4’teki 122 rastgele bitle, %50 çakışma olasılığına ulaşmak için yaklaşık 2,7 × 10¹⁸ kimlik üretmek gerekir. Rastgele bitler Web Crypto kaynağından gelir; `Math.random()` kullanılmaz.',
        ],
      },
    ],
    faq: [{ q: 'UUID gizli bir değer olarak kullanılabilir mi?', a: 'v4 tahmin edilemez olsa da UUID’ler genellikle loglara, URL’lere ve yanıtlara yazılır. Erişim anahtarı veya parola sıfırlama bağlantısı için [güvenli token](/araclar/secure-token-generator) kullanın. v7 zaman damgası içerdiği için gizli değer olarak hiç kullanılmamalıdır.' }],
    sources: [RFC_9562],
  },

  'nanoid-generator': {
    sections: [
      {
        title: 'NanoID nedir?',
        blocks: [
          'NanoID, `A–Z a–z 0–9 _ -` karakterlerinden oluşan 64 harfli bir alfabeyle üretilen kısa ve URL güvenli bir kimliktir. Bu araç 21 karakter üretir; her karakter 6 bit taşıdığından toplam 126 bit rastgelelik elde edilir. Bu, UUID v4’ün 122 bitine eşdeğerdir ama 36 yerine 21 karakterdir.',
          '64, 256’nın tam böleni olduğu için her rastgele bayt bir karaktere sapmasız eşlenir; modulo sapması oluşmaz.',
        ],
      },
      {
        title: 'Kullanım alanları',
        blocks: [
          {
            list: [
              'Kısa bağlantılar ve paylaşım kimlikleri (URL’de kodlama gerektirmez).',
              'Ön uçta oluşturulan geçici anahtarlar (React listeleri, istemci tarafı kayıtlar).',
              'Veritabanı kimlikleri: sıralama gerekmiyorsa. Zaman sırası istiyorsanız UUID v7 daha uygundur.',
            ],
          },
          '`_` ve `-` karakterleri, çift tıklamayla seçimde veya bazı dosya sistemlerinde sorun çıkarabilir; böyle durumlarda yalnız harf ve rakam içeren bir alfabeyle daha uzun kimlik üretin.',
        ],
      },
    ],
    sources: [{ label: 'Nano ID – çakışma hesaplayıcı', url: 'https://zelark.github.io/nano-id-cc/' }],
  },

  'base64-tool': {
    sections: [
      {
        title: 'Base64 nasıl çalışır?',
        blocks: [
          'Base64, ikili veriyi 64 yazdırılabilir karakterle temsil eder: her 3 bayt (24 bit) 6’şar bitlik 4 karaktere dönüşür. Bu yüzden çıktı girdiden yaklaşık %33 uzundur. Uzunluk 3’ün katı değilse sona `=` dolgusu eklenir.',
          { code: 'Metin:   Merhaba\nUTF-8:   4d 65 72 68 61 62 61\nBase64:  TWVyaGFiYQ==' },
          'Araç metni önce UTF-8 baytlarına çevirir; böylece Türkçe karakterler ve emoji doğru kodlanır. Tarayıcının `btoa()` fonksiyonu bunu kendisi yapmaz ve ASCII dışı karakterlerde hata verir.',
        ],
      },
      {
        title: 'Bilinmesi gerekenler',
        blocks: [
          {
            list: [
              'Base64 şifreleme değildir; kodlanmış veriyi herkes çözebilir.',
              'Araç standart alfabeyi (`+` ve `/`) kullanır. JWT ve URL’lerde görülen Base64URL (`-` ve `_`, dolgusuz) biçimi doğrudan çözülmez; önce `-` → `+`, `_` → `/` dönüşümü yapın.',
              'Çözme sırasında boşluk ve satır sonları yok sayılır. Çözülen baytlar geçerli UTF-8 değilse (ör. bir resim dosyası), bozuk karakterler `�` olarak görünür.',
            ],
          },
        ],
      },
    ],
    faq: [{ q: 'Resim veya dosyayı Base64’e çevirebilir miyim?', a: 'Bu araç metin girdisi alır. Dosyaların içeriğinin bütünlüğünü denetlemek için [Hash hesaplama](/hash) sayfasını kullanabilirsiniz.' }],
    sources: [RFC_4648],
  },

  'hex-tool': {
    sections: [
      {
        title: 'Hex kodlama',
        blocks: [
          'Hexadecimal (Base16) kodlama her baytı iki karakterle (`00`–`ff`) gösterir; çıktı girdinin iki katı uzunluğundadır. Araç metni UTF-8 baytlarına çevirdiği için ASCII karakterler 2, Türkçe karakterler 4, emojiler 8 hex karakter tutar.',
          { code: 'Metin:  Şifre\nHex:    c59e69667265', caption: '“Ş” UTF-8’de iki bayttır: c5 9e.' },
        ],
      },
      {
        title: 'Hex’ten metne',
        blocks: [
          'Çözme modunda `0x` öneki, boşluklar ve iki nokta (`:`) yok sayılır; bu sayede `de:ad:be:ef` veya `0x48 65 6c` biçimindeki girdiler doğrudan yapıştırılabilir. Karakter sayısı çift olmalı ve baytlar geçerli UTF-8 oluşturmalıdır; aksi hâlde hata verilir.',
          'Hash değerleri ve anahtarlar genellikle hex olarak gösterilir, ancak bunlar metin değil ham bayttır; çözmeye çalışmak çoğunlukla “geçersiz UTF-8” hatası verir.',
        ],
      },
    ],
    sources: [RFC_4648],
  },

  'url-tool': {
    sections: [
      {
        title: 'Yüzde kodlama (percent-encoding)',
        blocks: [
          'URL’lerde yalnız belirli karakterler doğrudan kullanılabilir. Diğer karakterler UTF-8 baytlarına çevrilip her bayt `%XX` biçiminde yazılır. Araç RFC 3986’nın ayrılmamış karakterleri (`A–Z a–z 0–9 - _ . ~`) dışındaki her şeyi kodlar.',
          { code: 'Girdi:  arama=şifre & sıra\nÇıktı:  arama%3D%C5%9Fifre%20%26%20s%C4%B1ra' },
        ],
      },
      {
        title: 'Dikkat edilmesi gerekenler',
        blocks: [
          {
            list: [
              'Bu araç bir sorgu parametresi değerini veya yol parçasını kodlamak içindir. Tam bir URL’yi kodlarsanız `:` ve `/` da kodlanır ve adres bozulur.',
              'HTML form gönderimlerinde boşluk `+` olarak yazılır (`application/x-www-form-urlencoded`). Çözme modu `+` işaretini boşluğa çevirmez; böyle bir girdide önce `+` → `%20` dönüşümü yapın.',
              'JavaScript’teki `encodeURIComponent` `! \' ( ) *` karakterlerini kodlamaz; bu araç onları da kodlar.',
            ],
          },
        ],
      },
    ],
    sources: [{ label: 'RFC 3986 – URI Generic Syntax', url: 'https://www.rfc-editor.org/rfc/rfc3986' }],
  },

  'html-entity-tool': {
    sections: [
      {
        title: 'HTML kaçışlama neden gerekir?',
        blocks: [
          'Kullanıcıdan gelen metin HTML içine olduğu gibi yazılırsa `<script>` gibi etiketler çalışır; bu, siteler arası betik (XSS) açığıdır. Kaçışlama, HTML’de özel anlamı olan karakterleri varlık (entity) karşılıklarına çevirir:',
          {
            table: {
              head: ['Karakter', 'Çıktı'],
              rows: [['`&`', '`&amp;`'], ['`<`', '`&lt;`'], ['`>`', '`&gt;`'], ['`"`', '`&quot;`'], ["`'`", '`&#039;`']],
            },
          },
        ],
      },
      {
        title: 'Bağlam önemlidir',
        blocks: [
          'Bu kaçışlama HTML metin içeriği ve tırnak içindeki öznitelik değerleri için yeterlidir. JavaScript dizesi, CSS, URL (`href`) veya tırnaksız öznitelik içine yazılan veriler farklı kaçışlama gerektirir. Modern şablon motorları (React, Vue, Twig) varsayılan olarak doğru kaçışlamayı yapar; elle HTML birleştirmekten kaçının.',
          'Çözme modu `&amp; &lt; &gt; &quot; &apos; &nbsp;` adlandırılmış varlıklarını ve `&#60;`, `&#x1F510;` gibi sayısal referansları metne çevirir. Tanınmayan varlıklar olduğu gibi bırakılır.',
        ],
      },
    ],
    sources: [{ label: 'OWASP Cross Site Scripting Prevention Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html' }],
  },

  'secure-token-generator': {
    sections: [
      {
        title: 'Token nasıl üretilir?',
        blocks: [
          'Web Crypto’dan 32 bayt (256 bit) rastgele veri alınır ve iki biçimde gösterilir: 64 karakterlik hex ve 43 karakterlik Base64URL. İkisi aynı miktarda rastgelelik taşır; Base64URL daha kısadır ve URL, başlık ve çerezlerde kodlama gerektirmez.',
        ],
      },
      {
        title: 'Kullanım alanları',
        blocks: [
          {
            list: [
              'Oturum kimlikleri ve “beni hatırla” token’ları.',
              'Parola sıfırlama ve e-posta doğrulama bağlantıları.',
              'HS256 JWT imzalama anahtarı, webhook imza anahtarı, uygulama `SECRET_KEY` değerleri.',
            ],
          },
          'Sunucuda doğrulanacak token’ları veritabanında düz metin olarak değil, SHA-256 hash’iyle saklayın: 256 bitlik rastgele bir değer için yavaş parola hash’ine gerek yoktur, ama veritabanı sızdığında token’lar doğrudan kullanılamaz.',
        ],
      },
    ],
    faq: [{ q: 'Kaç bit yeterli?', a: 'OWASP oturum kimlikleri için en az 64 bit entropi önerir. 128 bit tüm pratik kullanımlar için yeterlidir; bu araç 256 bit üretir.' }],
    sources: [{ label: 'OWASP Session Management Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html' }],
  },

  'totp-generator': {
    sections: [
      {
        title: 'TOTP nasıl çalışır?',
        blocks: [
          'Zaman tabanlı tek kullanımlık parola (RFC 6238), paylaşılan gizli anahtarı ve o anki zaman dilimini HMAC-SHA1’e verir. Zaman dilimi `floor(Unix zamanı / 30)` değeridir; bu yüzden kod her 30 saniyede değişir ve aynı anahtarı bilen iki taraf aynı kodu bağımsız olarak hesaplar.',
          'HMAC çıktısından RFC 4226’daki dinamik kesme ile 31 bitlik bir sayı alınır ve son 6 hanesi kod olur. Google Authenticator, Microsoft Authenticator, 1Password ve benzeri uygulamalar varsayılan olarak bu parametreleri kullanır.',
        ],
      },
      {
        title: 'Ne için kullanılır?',
        blocks: [
          {
            list: [
              'Kendi uygulamanızdaki 2FA uygulamasını test ederken beklenen kodu görmek.',
              'Bir kimlik doğrulayıcı uygulamasının yanlış kod üretip üretmediğini (çoğunlukla cihaz saatinden kaynaklanır) denetlemek.',
            ],
          },
          { note: 'Gerçek hesaplarınızın 2FA anahtarlarını bir web sayfasına yazmak, anahtarın ikinci faktör olma özelliğini zayıflatır. Bu araç anahtarı göndermez ve saklamaz; yine de gerçek anahtarlar için yalnız kimlik doğrulayıcı uygulamanızı kullanın.' },
        ],
      },
    ],
    faq: [
      { q: 'Kod uygulamamdakiyle uyuşmuyor.', a: 'TOTP cihaz saatine bağlıdır. Bilgisayarın veya telefonun saati 30 saniyeden fazla saparsa kodlar farklı olur. Ayrıca bazı servisler 8 hane, SHA-256 veya 60 saniye kullanır; bu araç yalnız 6 hane / SHA-1 / 30 saniye destekler.' },
      { q: 'Anahtarı QR koddan nasıl alırım?', a: 'QR kod otpauth://totp/...?secret=XXXX biçiminde bir URI içerir. secret parametresindeki Base32 değer gizli anahtardır.' },
    ],
    sources: [{ label: 'RFC 6238 – TOTP', url: 'https://www.rfc-editor.org/rfc/rfc6238' }],
  },

  'hotp-generator': {
    sections: [
      {
        title: 'HOTP nasıl çalışır?',
        blocks: [
          'HMAC tabanlı tek kullanımlık parola (RFC 4226), zaman yerine bir sayaç kullanır: kod = `kes(HMAC-SHA1(anahtar, sayaç)) mod 10⁶`. Her başarılı kullanımdan sonra hem istemci hem sunucu sayacı bir artırır.',
          { code: 'Anahtar (Base32): GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ\nSayaç 0 → 755224\nSayaç 1 → 287082', caption: 'RFC 4226 Ek D test vektörü (ASCII “12345678901234567890”). Bu araç testlerde bu değerlerle doğrulanır.' },
        ],
      },
      {
        title: 'TOTP’den farkı',
        blocks: [
          'HOTP kodu, kullanılana kadar geçerli kalır; TOTP ise 30 saniyede bir değişir. HOTP donanım anahtarlıklarında (YubiKey OATH-HOTP) ve saat senkronizasyonu olmayan cihazlarda kullanılır. Sunucular sayaç kaymasını tolere etmek için genellikle sonraki birkaç değeri de kabul eder.',
        ],
      },
    ],
    sources: [{ label: 'RFC 4226 – HOTP', url: 'https://www.rfc-editor.org/rfc/rfc4226' }],
  },

  'api-key-generator': {
    sections: [
      {
        title: 'Üretilen anahtarın yapısı',
        blocks: [
          'Anahtar `local_` öneki ve 24 rastgele baytın (192 bit) 48 karakterlik hex gösteriminden oluşur. Önek, anahtarın ne olduğunu loglarda ve kod taramalarında tanımayı kolaylaştırır; kendi sisteminizde servise özgü bir önekle değiştirebilirsiniz.',
          { code: 'local_3f9a…(48 hex karakter)' },
        ],
      },
      {
        title: 'API anahtarlarını güvenli yönetmek',
        blocks: [
          {
            list: [
              'Anahtarı kullanıcıya bir kez gösterin; veritabanında yalnız SHA-256 hash’ini ve ilk birkaç karakterini (tanıma için) saklayın.',
              'GitHub ve GitLab gibi platformların gizli değer taramasının tanıyabilmesi için ayırt edici bir önek kullanın (ör. `acme_live_`).',
              'Her anahtara kapsam (okuma/yazma), son kullanma tarihi ve iptal imkânı verin.',
              'Anahtarları kod deposuna değil, ortam değişkenine veya bir gizli değer yöneticisine koyun.',
            ],
          },
        ],
      },
    ],
    sources: [{ label: 'OWASP Secrets Management Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html' }],
  },

  'csrf-token-generator': {
    sections: [
      {
        title: 'CSRF nedir?',
        blocks: [
          'Siteler arası istek sahteciliğinde (CSRF) saldırgan, kullanıcının oturumu açıkken başka bir siteden sizin sitenize istek gönderilmesini sağlar; tarayıcı çerezleri otomatik eklediği için istek kullanıcı adına çalışır. CSRF token’ı, isteğin gerçekten sizin sayfanızdan geldiğini kanıtlayan ve saldırganın bilemeyeceği bir değerdir.',
          'Araç 32 baytlık (256 bit) rastgele token’ı 64 karakterlik hex olarak üretir.',
        ],
      },
      {
        title: 'Uygulama yöntemleri',
        blocks: [
          {
            list: [
              '**Senkronize token:** token oturumda saklanır, her formda gizli alan olarak gönderilir ve sunucuda karşılaştırılır.',
              '**Çift gönderimli çerez:** token hem çerezde hem istek başlığında gönderilir; çerezin HMAC ile oturuma bağlanması önerilir.',
              '`SameSite=Lax` veya `Strict` çerezler ve `Origin` başlığı denetimi ek savunma katmanıdır.',
            ],
          },
          'Çoğu web çatısı (Django, Rails, Laravel, Spring) CSRF korumasını yerleşik sunar; kendi çözümünüzü yazmadan önce onu etkinleştirin.',
        ],
      },
    ],
    sources: [{ label: 'OWASP CSRF Prevention Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html' }],
  },
};
