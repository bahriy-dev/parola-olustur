# Yerel proje düzeltme kaydı — 1 Kasım 2026

> Tarihsel kayıt: aşağıdaki durum 1 Kasım 2026 incelemesini anlatır; güncel GitHub deposu ve özellikler için README.md dosyasını kullanın.

Kaynak doğrudan `parola-olustur` çalışma klasörüdür; ZIP kullanılmadı. Bu klasör Git deposu değildir. Kullanıcının incelemesi `original-audit.txt` içinde korunmuştur.

## Kapsam kararları

37 taklit hash katalogdan ve motordan çıkarıldı. AES-CBC, ChaCha20-Poly1305 ve Shamir araçları açık destek dışı durumunda; hesaplama düğmesi yok ve sitemap dışında/noindex. Bu, raporun “gerçek uygulama veya destek kaldırma” seçeneğidir. SHA-1 ön ek aracı ihlal sorgusu olarak sunulmaz ve ağ sorgusu yapmaz.

## Bulgu karşılıkları

| Bulgular | Uygulanan değişiklik |
|---|---|
| P0-01–06 | Taklit algoritma gövdeleri kaldırıldı; katalog yalnız kalan gerçek implementasyonları içerir. |
| P0-07 | Bilinmeyen hash açık hata verir. |
| P0-08 | SHA araç slug eşlemesi düzeltildi; 12 araç için regresyon testi. |
| P0-09 | Sahte PEM kaldırıldı, gerçek RSA üretimi eklendi; CBC/ChaCha devre dışı. |
| P0-10 | Tipli çalıştırılabilir ID listesi, exhaustive switch ve katalog kapsam testi; 4 üretici route'u gerçek üreticiye bağlı. |
| P0-11–12 | Base32 çözümleme; gerçek HOTP/TOTP ve RFC test vektörleri. |
| P0-13 | Keccak-256 gerçek noble fonksiyonu ve Ethereum boş girdi vektörü. |
| P0-14 | Araç “SHA-1 Ön Ek Hesaplayıcı” olarak yeniden adlandırıldı. |
| P0-15–16 | Boş havuz/imkânsız konfigürasyon açık hatadır; üretici UI hatayı gösterir. |
| P0-17 | JWT algoritması çağıranın beklentisine sabitlenir; varsayılan HS256, bilinmeyen alg reddedilir. |
| P0-18 | AES-GCM sürümlü PBKDF2/salt/IV envelope; çözme ve bozulma testleri. |
| P1-01–04 | Parola kategorileri, yan yana tekrar ve PIN tekrarsız/sequential kuralları korunur; sessiz fallback yok; özel küme tekilleştirilir. |
| P1-05–06 | Tekilleştirilmiş listeden shuffle ile tekrarsız kelime seçimi; UI gerçek liste uzunluğunu gösterir. |
| P1-07–08 | Parola kategorileri için inclusion/exclusion, PIN için dinamik sayım, passphrase için yerine koymadan seçim; kapitalizasyona ek entropi yok. |
| P1-09 | zxcvbn örüntü tahmini; kesin kırılma süresi iddiası kaldırıldı. |
| P1-10 | Yerel politika olarak etiketlendi; NIST uyumluluk iddiası yok, sınıf zorunluluğu kaldırıldı. |
| P1-11–12 | Teorik arama alanı etiketi; Levenshtein kaldırıldı, tam bayt karşılaştırması; JavaScript constant-time garantisi iddia edilmez. |
| P1-13–15 | Argon2 19 MiB/t2/p1, scrypt N=2^17/r8/p1, PBKDF2 uygun profil; rastgele salt, encoded çıktı, parametre ayrıştırma ve üst kaynak sınırları. |
| P1-16 | bcrypt case-sensitive doğrulama, 72 UTF-8 bayt sınırı. |
| P1-17 | Gizli girdilerin gereksiz çıktı tekrarları kaldırıldı. Üretilmesi istenen anahtar/token ve kullanıcı tarafından çözümlenen JWT payload doğal çıktılardır. |
| P1-18–20 | UTF-8 Base64URL; ayrı exp/nbf ve isteğe bağlı iss/aud denetimi; imza tam karşılaştırılır. |
| P1-21–22 | UUID/token CSPRNG yoksa hata; UUIDv7 varyant bitleri; 64 tekil sembollü NanoID alfabesi, modulo bias yok. |
| P1-23–25 | AES encrypt/decrypt UI; zorunlu HMAC anahtarı; checksum aracı beklenen CRC32 ile karşılaştırır. |
| P1-26–27 | Argon2 varyantı ayrıştırılır; yalnız hex uzunluğundan düşük güven. |
| P1-28–30 | Hesapla düğmesi, Worker, iptal/zaman aşımı/stale koruması; dosya sınırı 10 MiB. |
| P1-31–32 | Tek amaçlı secret şablonları; JSON/shell/encoding bağlamına göre kod üretimi. |
| P2-01–04 | Next router; route canonical; sahte lastModified kaldırıldı; sabit sayfalar sitemap içinde. |
| P2-05–07 | PAROLA.DEV marka metinleri, standart iddiaları düzeltildi. Belge dili, başlık ve açıklama Türkçe kalır; EN seçimi yalnız çevrilmiş metin bloklarını `lang="en"` ile işaretler. |
| P2-08–09 | Araç capability listesi/status ve exhaustiveness; hash katalog/motor kapsam testi; KDF encoded metadata. |
| P2-10–13 | Çoklu hash seçimi; açık hesaplama; clipboard başarıdan sonra bildirim; gizlenebilir secret girdileri. |
| P2-14–17 | Encoding ölçümleri orijinal üretimden ayrıldı; random range sınırları; klasik dönüşümler eğitimsel etiketli; dekoratif ID için de crypto UUID. |
| P2-18 | Ortak bulk üretim fonksiyonu kullanılır. |
| P2-19 | Nonce tabanlı CSP, self worker/connect politikası; mevcut Permissions-Policy ve diğer başlıklar. |
| P2-20–21 | Birim/reference/differential/e2e testleri ve CI; React lint kontrolü yeniden açıldı, sıfır hata/uyarı hedefi. |
| P2-22–26 | README/kelime sayıları/etiketler, temiz kaynak paketleme, kapsamlı gizlilik açıklaması, hash identifier kategorisi ve çarpışma iddiaları düzeltildi. |

## Arayüz yenileme ve son inceleme

- Arayüz Header + Sidebar + içerik düzenine taşındı; ortak form bileşenleri (`src/components/ui/form.tsx`), karanlık tema ve 67 kullanılabilir araç için açıklayıcı içerik (`src/content/tools/`) eklendi.
- Sayfa başına canonical, Open Graph, Twitter ve JSON-LD (`src/lib/seo.tsx`); `/araclar/password-generator` ana sayfayla aynı amaca hizmet ettiği için canonical ana sayfadır ve sitemap dışındadır.
- Araç adları ve H1'ler Türkçedir; eski İngilizce adlar arama için etiketlerde tutulur.
- Son incelemede düzeltilenler: uzunluk alanında tuş başına sınırlama, çoklu hash'te görünmeyen varsayılan seçimler ve algoritma başına ayrı Worker, EN seçiminin `<html lang>`/başlık değiştirmesi, mod değişiminde eski değerin yeni güç bilgisiyle görünmesi, düğme odağındayken kısayolların çalışmaması, radyo gruplarında ok tuşu desteği, alan ipuçlarının `aria-describedby` bağlantısı, kullanılmayan i18n anahtarları ve şablon SVG'leri.
- Tasarım incelemesinde düzeltilenler: kenar çubuğunda kesilen araç adları, tekrar eden arama ve üst menü bağlantıları, sayfalar arasında kayan içerik genişliği, devre dışı araçların menü/katalog/aramada görünmesi ve tutarsız sayılar, toplu parola menülerinde kesik metin, mobilde taşan sekmeler ve küçük dokunma alanları, hash sayfasındaki yoğun bağlantı listesi ve numaralı kategori adları, karışık seçili durum renkleri, yanlış kategorideki araçlar ile SSS'deki güncel olmayan toplu üretim bilgisi.
- Tek algoritmalı hash araçları (`/araclar/hash-sha256` vb., 13 sayfa) kalıcı yönlendirmeyle `/hash/<slug>` sayfalarına taşındı; açıklama içerikleri oradadır (`src/lib/hash-tool-routes.ts`).
- Marka adı "Parola Oluştur", alan adı `parolaolustur.com` oldu (`parola.dev` başka bir şirkete aittir). Alan adı ve marka `src/lib/site.ts` içinde tek yerdedir; sayfa başlıklarına marka `pageMetadata` tarafından eklenir. Varsayılan Next.js favicon'u yeni markayla (`src/app/icon.tsx`) değiştirildi.

## Doğrulama ve sınırlar

- Bilinen cevaplar, Node/OpenSSL diferansiyel testleri, KDF roundtrip ve bozulma/yanlış girdi testleri yereldir. Tüm olası girdiler için matematiksel kanıt değildir.
- Tarayıcı testleri Chromium, Firefox ve WebKit masaüstü ile iPhone emülasyonundadır; fiziksel cihaz ve tüm eski tarayıcı sürümleri denenmemiştir.
- Ağ testi yerel production sunucuda araç etkileşimlerini kapsar; gerçek alan adı/CDN için ayrı runtime denetimi gerekir.
- Dosya hashlerinde streaming uygulanmadı; raporun bellek riski boyut sınırıyla giderildi.
- EN seçimi yalnız rehber, SSS ve gizlilik metinlerini çevirir; ayrı indekslenebilir İngilizce URL/hreflang sistemi yoktur. Türkçe route metadata/canonical değiştirilmez.
- `npm audit --omit=dev` 0 açık bildirir. Tam ağaçta yalnız geliştirme araçlarından (ESLint zinciri, transitive `minimatch`) gelen orta seviye uyarı vardır; npm'nin önerdiği çözüm ESLint 4'e kırıcı bir düşürme olduğundan uygulanmadı.
- GitHub CI dosyası eklendi; uzak repository üzerinde çalıştırıldığı iddia edilmez. Canlı yayın/deploy yapılmadı.
- Bağımsız sızma testi, sertifikasyon, gerçek authenticator cihaz eşleştirmesi ve tüm production altyapısı denetimi bu çalışmanın doğrulama sonucu olarak sunulmaz.
