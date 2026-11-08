# Parola Oluştur

[English](README.md) · [Canlı uygulama](https://parolaolustur.com) · [Katkı rehberi](CONTRIBUTING.md)

MIT lisanslı, Türkçe ve İngilizce tarayıcı araçları. Bu depo bir web uygulamasıdır; yayımlanmış bir npm SDK değildir.

Next.js/React ile tarayıcıda parola, hash ve kriptografi araçları.

## Çalıştırma

Node.js 24+ ve npm: `npm ci`, ardından `npm run dev`.

## Kalite kontrolleri

- `npm run typecheck`
- `npm run lint -- --max-warnings 0`
- `npm test`: referans/diferansiyel kriptografi ve kısıt testleri.
- `npm run build`
- `npx playwright install chromium firefox webkit` ve `npm run test:e2e`: araç akışları; sitemap'teki her URL için 200, self-canonical, benzersiz title/description, Open Graph, geçerli JSON-LD, tek H1 ve mobilde taşmama; ana sayfalarda açık ve koyu temada axe WCAG 2.1 AA.
- `npm audit --omit=dev`
- `npm run package:source`: bağımlılık, derleme önbelleği ve .env dosyaları olmadan kaynak paketi.

## Arayüz yapısı

- `src/components/shell`: tüm sayfaları saran kabuk (header, araç araması, açılır kapanır kenar menüsü, mobil drawer).
- `src/components/ui/form.tsx`: ortak form, düğme ve sonuç bileşenleri.
- `src/components/tools/tool-ui.ts`: her aracın alanları, modları ve sonuç biçimi; `ToolRunner` bunları işler. JWT decoder ve TOTP özel görünümlere sahiptir.
- `src/lib/seo.tsx`: sayfa bazlı metadata (canonical, Open Graph, Twitter) ve JSON-LD yardımcıları.
- Tema `html.dark` sınıfıyla seçilir; Tailwind `dark:` varyantı bu sınıfa bağlıdır.

## Davranış ve sınırlar

- Rastgelelik Web Crypto CSPRNG kullanır; güvenli kaynak yoksa işlem hata verir.
- İmkânsız parola/PIN seçenekleri açık hatadır; kısıtları ihlal eden geri dönüş yoktur.
- Yerel TR/EN kelime listelerinin gerçek boyutu arayüzde gösterilir. EFF listesi değildir.
- Üretici arama alanı ile zxcvbn örüntü tahmini farklı ölçümlerdir; tek bir parolanın gerçek entropisi veya kesin kırılma süresi iddia edilmez.
- Hash kataloğu yalnız gerçek implementasyonları içerir. Eski taklit algoritmalar kaldırılmıştır. MD5/SHA-1 miras uyumluluğu içindir.
- AES-CBC, ChaCha20 ve Shamir araçları devre dışıdır. Bilinmeyen algoritma/araç hiçbir zaman SHA-256 çıktısına dönüşmez.
- Argon2 için PHC; scrypt/PBKDF2 için salt ve parametreleri taşıyan uygulama encoded biçimi kullanılır. Bunların ikisi için evrensel PHC uyumluluğu iddia edilmez.
- AES-GCM v1: PBKDF2-SHA256, 600.000 iterasyon, 16 bayt salt, 12 bayt IV ve doğrulama etiketi. Eski anahtar kesme/sıfır doldurma formatı desteklenmez.
- JWT HS256 varsayılan doğrulama algoritmasıdır. İmza ve claim sonuçları ayrıdır; iss/aud yalnız kullanıcı beklentisiyle doğrulanır.
- RSA OAEP/PSS SHA-256, P-256 ECDSA ve tarayıcı destekliyorsa Ed25519; PEM anahtarları SPKI/PKCS#8 biçimindedir. PEM kapsayıcı incelemesi sertifika güven zinciri doğrulaması değildir.
- SHA-1 ön ek aracı ihlal veritabanına bağlanmaz. Uygulama girdilerini sunucuya gönderen bir özellik yoktur. Statik dosyalar ağ kullanır; dil/tema tercihleri localStorage kullanır.
- Ağır işlemler iptal edilebilir Worker içinde; dosyalar 10 MiB ile sınırlı ve bellekte işlenir (streaming desteği yoktur).
- JavaScript için mutlak constant-time garantisi verilmez.
- Nonce CSP nedeniyle sayfalar dinamik render edilir. Mevcut animasyonlar için yalnız style attribute istisnası vardır; production script eval/inline istisnası yoktur.

## Referanslar

- https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- https://www.rfc-editor.org/rfc/rfc4226
- https://www.rfc-editor.org/rfc/rfc6238
- https://github.com/BLAKE3-team/BLAKE3/blob/master/test_vectors/test_vectors.json
- https://github.com/paulmillr/noble-hashes/blob/main/test/blake.test.ts

Değişikliklerin bulgu bazında karşılığı ve doğrulama sınırları: `docs/remediation.md`.

## Açık kaynak

Katkılar için [CONTRIBUTING.md](CONTRIBUTING.md), güvenlik bildirimleri için [SECURITY.md](SECURITY.md), kendi sunucunda çalıştırmak için [dağıtım rehberi](docs/deployment.md). Kullanım ve değişiklik yapma koşulları [MIT lisansında](LICENSE) belirtilmiştir.

Analitik varsayılan olarak kapalıdır. İsteğe bağlı analitik kimlikleri `.env.example` dosyasında açıklanır; kimlik yapılandırıldığında takip kodu yalnız ziyaretçi izin verirse yüklenir.
