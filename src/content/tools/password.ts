import type { ContentMap } from './types';

const OWASP_PASSWORD = { label: 'OWASP Password Storage Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html' };
const NIST_63B = { label: 'NIST SP 800-63B – Digital Identity Guidelines', url: 'https://pages.nist.gov/800-63-4/sp800-63b.html' };

export const passwordContent: ContentMap = {
  'password-generator': {
    sections: [
      {
        title: 'Rastgele parola nasıl üretilir?',
        blocks: [
          'Her karakter, seçtiğiniz karakter havuzundan tarayıcının `crypto.getRandomValues` kaynağıyla bağımsız olarak seçilir. Rastgele sayıyı havuz boyutuna indirgerken basit mod alma (`%`) bazı karakterleri daha sık seçtirir; bu araç bunun yerine reddetme örneklemesi kullanır, böylece her karakterin olasılığı eşittir.',
          '“Her seçili türden en az bir karakter” açıkken kural sağlanmayan adaylar bütünüyle atılır ve yeniden üretilir. Kuralı sağlamak için karakter eklenip çıkarılmadığından dağılım bozulmaz.',
        ],
      },
      {
        title: 'Uzunluk ve karakter türü entropiyi nasıl etkiler?',
        blocks: [
          'Aşağıdaki değerler bu aracın gösterdiği hesapla aynıdır: seçili ayarlarla üretilebilecek tüm parolaların sayısının log₂ değeri (her türden en az bir karakter kuralı dahil).',
          {
            table: {
              head: ['Uzunluk', 'Tüm türler (85 karakter)', 'Harf + rakam (62)', 'Yalnız küçük harf (26)'],
              rows: [
                ['8', '50,2 bit', '47,2 bit', '37,6 bit'],
                ['12', '76,5 bit', '71,3 bit', '56,4 bit'],
                ['16', '102,3 bit', '95,2 bit', '75,2 bit'],
                ['20', '128,1 bit', '119,0 bit', '94,0 bit'],
                ['32', '205,1 bit', '190,5 bit', '150,4 bit'],
              ],
            },
          },
          'Tablodan görüldüğü gibi uzunluğu artırmak, karakter türü eklemekten daha etkilidir: 16 karakterlik yalnız küçük harfli bir parola, 12 karakterlik tüm türleri içeren parolayla yaklaşık aynı güçtedir.',
        ],
      },
      {
        title: 'Hangi ayarları seçmeli?',
        blocks: [
          {
            list: [
              'Parola yöneticisinde saklanacak web hesapları: 16–20 karakter, tüm türler.',
              'Veritabanı veya bağlantı adresine (URI) yazılacak parolalar: “Gelişmiş seçenekler” içinden `@ : / \' " \\` gibi karakterleri hariç tutun ya da sembolleri kapatıp uzunluğu artırın.',
              'Elle yazılacak veya okunacak parolalar: “Benzer karakterleri çıkar” seçeneğiyle `l`, `1`, `O`, `0` karışıklığını önleyin.',
              'Bir sistem belirli karakterleri kabul etmiyorsa: “Özel karakter kümesi” alanına yalnız izin verilen karakterleri yazın.',
            ],
          },
          'Aynı ayarlarla çok sayıda parola gerekiyorsa [Toplu parola oluşturucu](/toplu-parola) sayfasını kullanabilirsiniz.',
        ],
      },
    ],
    faq: [
      { q: 'Üretilen parolalar bir yere kaydediliyor mu?', a: 'Hayır. Parola tarayıcınızın belleğinde oluşturulur ve sayfadan ayrıldığınızda kaybolur. Sunucuya gönderilmez; localStorage’da yalnız dil ve tema tercihi tutulur.' },
      { q: 'Kaç karakterlik parola yeterli?', a: 'Rastgele üretilmiş ve parola yöneticisinde saklanan bir parola için 16 karakter (yaklaşık 100 bit) çevrimiçi ve çevrimdışı saldırılara karşı fazlasıyla yeterlidir. Ana parola veya şifreleme anahtarı olarak kullanılacaksa 20 karakter ve üzeri tercih edin.' },
      { q: 'Sembol kullanmak zorunlu mu?', a: 'Hayır. Bazı sistemler sembolleri yanlış işler. Sembolleri kapatıp uzunluğu birkaç karakter artırmak aynı gücü sağlar; örneğin 20 karakterlik harf+rakam parola 119 bittir.' },
    ],
    sources: [NIST_63B],
  },

  'strong-password-generator': {
    sections: [
      {
        title: 'Güçlü parolayı ne belirler?',
        blocks: [
          'Bir parolanın gücü, saldırganın onu kaç denemede bulabileceğiyle ölçülür. İnsanların seçtiği parolalar sözlük kelimeleri, tarihler ve klavye dizileri içerdiği için gerçek güçleri uzunluklarının çok altında kalır. Rastgele üretilmiş bir parolada ise her karakter bağımsızdır ve güç doğrudan hesaplanabilir: `uzunluk × log₂(havuz boyutu)`.',
          'Bu sayfadaki oluşturucu varsayılan olarak 20 karakter ve 85 karakterlik havuz kullanır; bu yaklaşık 128 bit eder. 128 bit, modern simetrik şifreleme anahtarlarıyla aynı güvenlik düzeyidir.',
        ],
      },
      {
        title: 'Ana parola ve kritik hesaplar için öneriler',
        blocks: [
          {
            list: [
              'Parola yöneticisinin ana parolası her gün elle yazıldığı için hatırlanabilir olmalıdır; burada 8 veya daha fazla kelimelik bir [parola ifadesi](/araclar/passphrase-generator) daha pratik olabilir.',
              'E-posta, bulut ve banka hesapları gibi kurtarma zincirinin merkezindeki hesaplarda 20+ karakterlik rastgele parola ve iki adımlı doğrulama birlikte kullanılmalıdır.',
              'Sunucu, API ve şifreleme anahtarları için 32 karakter (yaklaşık 205 bit) tercih edin; insan bunları hiç yazmayacağı için uzunluğun maliyeti yoktur.',
              'Hiçbir parolayı birden fazla serviste kullanmayın. Bir servisten sızan parola diğerlerinde otomatik olarak denenir (credential stuffing).',
            ],
          },
        ],
      },
      {
        title: 'Parola gücü ile sunucu tarafı arasındaki ilişki',
        blocks: [
          'Sızıntılarda saldırganın eline geçen şey çoğunlukla parolanın kendisi değil, hash’idir. Servis parolaları [Argon2id](/araclar/argon2id-generator) veya [bcrypt](/araclar/bcrypt-generator) gibi yavaş bir fonksiyonla saklıyorsa her deneme pahalıdır; MD5 veya SHA-1 gibi hızlı hash’lerle saklıyorsa saniyede milyarlarca deneme yapılabilir. Rastgele 20 karakterlik bir parola her iki durumda da pratikte bulunamaz; kısa ve tahmin edilebilir parolalar ise ikinci durumda dakikalar içinde düşer.',
        ],
      },
    ],
    faq: [
      { q: '“Kırılması imkânsız” parola var mı?', a: 'Matematiksel olarak her parola deneme yoluyla bulunabilir; pratikte ise 128 bitlik bir arama alanını taramak, saniyede bir trilyon denemeyle bile evrenin yaşının çok üzerinde süre alır. Gerçek riskler genellikle parolanın tekrar kullanılması, oltalama ve cihazın ele geçirilmesidir.' },
      { q: 'Parolayı düzenli aralıklarla değiştirmek gerekir mi?', a: 'NIST SP 800-63B, parolanın ele geçirildiğine dair bir işaret yoksa periyodik değişiklik zorunluluğunu önermez. Sızıntı şüphesinde hemen değiştirin.' },
    ],
    sources: [NIST_63B, OWASP_PASSWORD],
  },

  'passphrase-generator': {
    sections: [
      {
        title: 'Parola ifadesi nasıl oluşturulur?',
        blocks: [
          'Seçtiğiniz dildeki kelime listesi tekrarlardan arındırılır, Web Crypto ile Fisher–Yates karıştırması yapılır ve ilk N kelime alınır. Böylece aynı kelime iki kez seçilmez. İsteğe bağlı olarak ilk harfler büyütülür, sona 100–999 arasında bir sayı ve bir sembol eklenir.',
          'Büyük harfle başlatmak entropi hesabına eklenmez: her kelime aynı şekilde büyütüldüğü için saldırgan için yeni bir belirsizlik yaratmaz.',
        ],
      },
      {
        title: 'Kelime sayısına göre güç',
        blocks: [
          'Bu sitedeki listeler EFF’in 7 776 kelimelik Diceware listesinden çok daha küçüktür: Türkçe liste 367, İngilizce liste 340 kelimedir. Bu nedenle kelime başına yaklaşık 8,5 bit elde edilir ve aynı güç için daha fazla kelime gerekir.',
          {
            table: {
              head: ['Kelime', 'Türkçe liste', 'Türkçe + sayı', 'İngilizce liste'],
              rows: [
                ['4', '34,1 bit', '43,9 bit', '33,6 bit'],
                ['5', '42,6 bit', '52,4 bit', '42,0 bit'],
                ['6', '51,1 bit', '60,9 bit', '50,4 bit'],
                ['8', '68,0 bit', '77,9 bit', '67,2 bit'],
                ['10', '85,0 bit', '94,8 bit', '83,9 bit'],
              ],
            },
          },
          { note: 'Çevrimdışı saldırıya açık olabilecek kullanımlar (ör. şifreli dosya, parola yöneticisi ana parolası) için en az 8 kelime ve sayı eki önerilir. Daha yüksek güç gerekiyorsa [rastgele parola](/araclar/password-generator) kullanın.' },
        ],
      },
      {
        title: 'Ne zaman tercih edilir?',
        blocks: [
          {
            list: [
              'Ezberlenmesi gereken parolalar: bilgisayar oturumu, disk şifreleme, parola yöneticisi.',
              'Telefonda veya başka bir cihazda elle yazılacak Wi-Fi parolaları.',
              'Sesli okunması veya not edilmesi gereken durumlar: kelimeler harf dizilerine göre daha az hatayla aktarılır.',
            ],
          },
        ],
      },
    ],
    faq: [
      { q: 'Kelimeleri kendim seçsem olur mu?', a: 'Hayır. İnsanlar anlamlı ve sık kullanılan kelimeleri seçer; bu da arama alanını büyük ölçüde daraltır. Gücün hesaplanabilmesi için kelimelerin rastgele seçilmesi gerekir.' },
      { q: 'Ayraç güvenliği etkiler mi?', a: 'Ayraç sabit ve görünür bir seçim olduğundan entropiye eklenmez. Hedef sistemin kabul ettiği ve yazması kolay olanı seçin.' },
    ],
    sources: [{ label: 'EFF – Dice-Generated Passphrases', url: 'https://www.eff.org/dice' }],
  },

  'pin-generator': {
    sections: [
      {
        title: 'PIN güvenliği nasıl sağlanır?',
        blocks: [
          'Yalnız rakamlardan oluştuğu için PIN’in arama alanı küçüktür: 4 haneli bir PIN 10 000, 6 haneli bir PIN 1 000 000 olasılıktır. PIN’i güvenli kılan uzunluğu değil, sistemin deneme sayısını sınırlamasıdır (ör. 3 hatalı denemede kartın bloke olması).',
          {
            table: {
              head: ['Uzunluk', 'Tüm rakamlar', 'Ardışık (123/987) yasak'],
              rows: [
                ['4', '13,3 bit', '13,2 bit'],
                ['6', '19,9 bit', '19,8 bit'],
                ['8', '26,6 bit', '26,4 bit'],
                ['12', '39,9 bit', '39,6 bit'],
              ],
            },
          },
        ],
      },
      {
        title: 'Seçenekler ne işe yarar?',
        blocks: [
          {
            list: [
              '“Ardışık rakamlara izin ver” kapalıyken 123, 456 veya 987 gibi üç rakamlık artan/azalan diziler içeren PIN’ler üretilmez. Bu diziler insan tahminlerinde en sık denenenler arasındadır.',
              '“Tekrar eden rakamlara izin ver” kapalıyken her rakam en fazla bir kez kullanılır; bu durumda PIN en fazla 10 hane olabilir.',
              '“Hariç tutulacak rakamlar” bazı tuş takımlarında sorun çıkaran veya kurum politikasının yasakladığı rakamlar için kullanılır.',
            ],
          },
          'Kurallar arama alanını küçültür; araç bunu entropi değerine yansıtır. Kurallar aynı anda sağlanamıyorsa (ör. tekrarsız 12 haneli PIN) sessizce gevşetilmez, hata gösterilir.',
        ],
      },
    ],
    faq: [
      { q: 'Doğum yılı veya 1234 gibi PIN’ler neden kötü?', a: 'Saldırganlar sınırlı deneme hakkını önce en olası PIN’lere harcar. 1234, 0000, 1111 ve tarih biçimindeki PIN’ler bu listelerin başındadır.' },
      { q: 'Web hesabı için PIN kullanılabilir mi?', a: 'Deneme sınırı uygulanmayan bir sistemde 6 haneli bir PIN saniyeler içinde bulunabilir. Web hesapları için rastgele parola veya parola ifadesi kullanın.' },
    ],
  },

  'strength-checker': {
    sections: [
      {
        title: 'Bu analiz neyi ölçer?',
        blocks: [
          'Kendi seçtiğiniz bir parolanın gücü, uzunluğundan değil içerdiği örüntülerden belirlenir. Araç Dropbox’ın açık kaynak `zxcvbn` modelini kullanır: parolayı sözlük kelimeleri, yaygın parolalar, klavye dizileri (qwerty), tarihler, tekrarlar ve harf–rakam değişimleri (p@ssw0rd) gibi parçalara ayırır ve saldırganın kaç denemede bulacağını tahmin eder.',
          'Sonuçtaki “bit” değeri bu tahmini deneme sayısının log₂ değeridir ve 0–4 arası skor 0–100’e ölçeklenir. Model İngilizce ağırlıklı listeler kullanır; Türkçe kelimeleri daha az tanıdığı için Türkçe parolalarda gücü olduğundan yüksek gösterebilir.',
        ],
      },
      {
        title: 'Sonucu nasıl yorumlamalı?',
        blocks: [
          {
            list: [
              '“Zayıf” sonuç kesin bir uyarıdır: parola bilinen örüntülerle hızla bulunabilir.',
              '“Güçlü” sonuç bir garanti değildir: model sizin kişisel bilgilerinizi (isim, şehir, takım) bilmez, saldırgan bilebilir.',
              'Rastgele üretilmiş parolaların gücünü bu araçla değil, [parola oluşturucunun](/) gösterdiği entropi değeriyle değerlendirin.',
            ],
          },
          { note: 'Gerçekte kullandığınız bir parolayı herhangi bir web sitesine yazmamak iyi bir alışkanlıktır. Bu araç girdiyi sunucuya göndermez, ancak test için benzer yapıda bir örnek kullanmanız daha güvenlidir.' },
        ],
      },
    ],
    faq: [
      { q: 'Neden “kırılma süresi” gösterilmiyor?', a: 'Kırılma süresi saldırganın donanımına ve servisin parolayı hangi hash ile sakladığına bağlıdır; aynı parola bcrypt ile saklandığında yıllar, MD5 ile saklandığında saniyeler sürebilir. Tek bir süre vermek yanıltıcı olacağı için yalnız tahmini deneme sayısı gösterilir.' },
      { q: 'En fazla kaç karakter analiz edilir?', a: '256 karakter. Daha uzun girdilerde model hem yavaşlar hem de anlamlı ek bilgi üretmez.' },
    ],
    sources: [{ label: 'zxcvbn: Low-Budget Password Strength Estimation (USENIX Security 2016)', url: 'https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/wheeler' }],
  },

  'entropy-calculator': {
    sections: [
      {
        title: 'Formül',
        blocks: [
          'Araç, girdideki benzersiz karakter sayısını havuz boyutu (N), karakter sayısını uzunluk (L) kabul eder ve `H = L × log₂(N)` değerini hesaplar. Sonuç, her karakterin bu havuzdan bağımsız ve eşit olasılıkla seçildiği varsayımında mümkün olan parola sayısının üst sınırıdır.',
          { code: 'Parola: Kx9#mQ2v\nUzunluk L = 8, benzersiz karakter N = 8\nH = 8 × log₂(8) = 24 bit', caption: 'Benzersiz karakter sayısı küçük olduğu için kısa parolalarda sonuç düşük çıkar.' },
        ],
      },
      {
        title: 'Bu değer ne zaman anlamlıdır?',
        blocks: [
          'Formül yalnız rastgele üretilmiş parolalar için anlamlıdır. `Galatasaray1905!` gibi bir parola 16 karakter ve geniş bir havuza sahip olduğundan yüksek değer alır, ancak bir takım adı ve yıldan oluştuğu için gerçekte birkaç milyon denemede bulunabilir.',
          'Kendi seçtiğiniz parolalar için örüntüleri dikkate alan [parola gücü analizini](/araclar/strength-checker) kullanın. Bu sitede üretilen parolalarda ise oluşturucu, ayarlardan hesaplanan kesin değeri zaten gösterir.',
        ],
      },
    ],
    faq: [
      { q: 'Neden havuz boyutu girdiden hesaplanıyor?', a: 'Araç parolanın hangi ayarlarla üretildiğini bilemez. Girdide geçen benzersiz karakterler, alt sınır niteliğinde bir havuz tahminidir; parolayı üreten kurallar biliniyorsa gerçek havuz boyutuyla hesaplamak daha doğrudur.' },
    ],
  },

  'policy-validator': {
    sections: [
      {
        title: 'Hangi kurallar denetlenir?',
        blocks: [
          {
            list: [
              'En az 12 karakter (Unicode kod noktası olarak sayılır; bazı emojiler birden fazla kod noktasından oluşur).',
              'Parolanın `password`, `parola`, `qwerty`, `123456`, `admin` veya `letmein` ile başlayıp yalnız rakam ve `! @ .` ile devam etmemesi.',
            ],
          },
          'Bu küçük yerel bir politikadır ve bir standarda uyumluluk belgesi değildir. Büyük harf, rakam, sembol zorunluluğu bilinçli olarak yoktur.',
        ],
      },
      {
        title: 'Modern parola politikası nasıl olmalı?',
        blocks: [
          'NIST SP 800-63B ve OWASP, karakter türü zorunluluklarının kullanıcıları `Parola1!` gibi tahmin edilebilir kalıplara ittiğini belirtir. Önerilen yaklaşım:',
          {
            list: [
              'Minimum uzunluk (tek faktörlü kullanımda 15, ikinci faktörle birlikte en az 8 karakter) ve en az 64 karakterlik üst sınır.',
              'Tüm yazdırılabilir karakterlere ve boşluğa izin verilmesi.',
              'Yeni parolanın sızıntı listeleri ve yaygın parola listelerine karşı denetlenmesi.',
              'Belirli bir neden yoksa periyodik değişiklik zorunluluğunun kaldırılması.',
            ],
          },
        ],
      },
    ],
    sources: [NIST_63B, { label: 'OWASP Authentication Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html' }],
  },

  'breach-checker': {
    sections: [
      {
        title: 'SHA-1 ön eki nedir?',
        blocks: [
          'Have I Been Pwned gibi sızıntı servisleri, parolayı kendisine göndermeden sorgulamaya izin veren bir k-anonimlik yöntemi kullanır: parolanın SHA-1 hash’inin yalnız ilk 5 hex karakteri gönderilir, servis bu önekle başlayan yüzlerce hash’i döndürür ve karşılaştırma istemcide yapılır.',
          'Bu araç o sorgunun ilk adımını, yani ön eki tarayıcıda hesaplar. Herhangi bir servise istek göndermez ve parolanın sızıp sızmadığını söylemez.',
          { code: 'Parola:   parola123\nSHA-1:    (40 hex karakter)\nÖn ek:    ilk 5 karakter → API: /range/{ön ek}', caption: 'Ön ek tek başına parolayı ortaya çıkarmaz; aynı öneki paylaşan çok sayıda hash vardır.' },
        ],
      },
      {
        title: 'Sorguyu kendiniz yapmak isterseniz',
        blocks: [
          { steps: ['Ön eki bu araçla hesaplayın.', '`https://api.pwnedpasswords.com/range/<ön ek>` adresini tarayıcıda açın.', 'Parolanın tam SHA-1 hash’inin kalan 35 karakterini dönen listede arayın; satır sonundaki sayı görülme adedidir.'] },
          'Tam hash’i [SHA-1 hash sayfasında](/hash/sha-1) hesaplayabilirsiniz.',
        ],
      },
    ],
    sources: [{ label: 'Have I Been Pwned – Pwned Passwords API', url: 'https://haveibeenpwned.com/API/v3#PwnedPasswords' }],
  },

  'hash-verifier': {
    sections: [
      {
        title: 'Desteklenen biçimler',
        blocks: [
          {
            table: {
              head: ['Girilen hash', 'Nasıl denetlenir?'],
              rows: [
                ['32 hex karakter', 'Metnin MD5 değeri hesaplanıp karşılaştırılır.'],
                ['40 hex karakter', 'SHA-1 ile karşılaştırılır.'],
                ['64 hex karakter', 'SHA-256 ile karşılaştırılır.'],
                ['`$2a$` / `$2b$` ile başlayan', 'bcrypt: hash içindeki maliyet ve salt ile yeniden hesaplanır.'],
                ['`$argon2id$`, `$argon2i$`, `$argon2d$`', 'Argon2: PHC dizesindeki m, t, p ve salt kullanılır.'],
                ['`$scrypt$`, `$pbkdf2-sha256$` …', 'Bu sitenin encoded biçimi; parametreler dizeden okunur.'],
              ],
            },
          },
          'Hex karşılaştırmasında büyük/küçük harf fark etmez. Eşleşme bulunduğunda hangi algoritmayla eşleştiği gösterilir.',
        ],
      },
      {
        title: 'Güvenlik sınırları',
        blocks: [
          'KDF doğrulamasında kaynak tüketimini sınırlamak için parametrelere üst sınır uygulanır: Argon2 için en fazla 64 MiB bellek ve 6 tur, bcrypt için en fazla maliyet 14, scrypt için en fazla N = 2¹⁷. Bu sınırların dışındaki hash’ler hata verir.',
          'Karşılaştırma tüm baytlar üzerinden yapılır, ancak JavaScript sabit zamanlı çalışmayı garanti etmez; bu araç bir sunucu doğrulama kodunun yerine geçmez.',
        ],
      },
    ],
    faq: [
      { q: 'SHA-512 veya başka bir hash’i nasıl doğrularım?', a: 'Bu araç parola hash’lerinde en sık görülen biçimleri kapsar. Diğer algoritmalar için [Hash doğrulama](/hash-dogrulama) sayfasında algoritmayı seçerek karşılaştırma yapabilirsiniz.' },
    ],
  },

  'match-checker': {
    sections: [
      {
        title: 'Ne işe yarar?',
        blocks: [
          'İki parolanın bayt bayt aynı olup olmadığını gösterir. Uzun ve karmaşık parolaları gözle karşılaştırmak hatalıdır; bir yapılandırma dosyasındaki değerle parola yöneticisindeki kaydın aynı olup olmadığını, ya da kopyalarken sonuna boşluk eklenip eklenmediğini denetlemek için kullanılabilir.',
          'Karşılaştırma UTF-8 baytları üzerinden yapılır. Görünüşte aynı olan ama farklı Unicode biçiminde yazılmış karakterler (ör. birleşik ve ayrık yazılmış “ş”) farklı kabul edilir; çoğu giriş sistemi de bu şekilde davranır.',
        ],
      },
      {
        title: 'Neden benzerlik oranı gösterilmiyor?',
        blocks: [
          'Önceki sürümde gösterilen benzerlik puanı kaldırıldı: iki parolanın “ne kadar benzediği” güvenlik açısından anlamlı bir bilgi değildir ve gizli bir değer hakkında gereksiz ayrıntı üretir. Sonuç yalnızca “aynı” veya “farklı”dır.',
        ],
      },
    ],
  },
};
