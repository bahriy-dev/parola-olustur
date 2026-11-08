export const tr = {
  guide: {
    title: 'Parola Güvenliği Hakkında Bilmeniz Gerekenler',
    subtitle: 'Hesaplarınızı korumak için temel siber güvenlik prensipleri ve en iyi uygulamalar.',
    topics: [
      {
        title: 'Parola uzunluğu neden önemlidir?',
        text: 'Bir parolanın uzunluğu, olası kombinasyon sayısını üstel olarak artırır. 8 karakterlik bir alfasayısal parola saniyeler içinde kırılabilirken, 16 veya 24 karakterlik bir parola modern süper bilgisayarlar için bile pratik olarak kırılamaz bir arama uzayı yaratır.',
      },
      {
        title: 'Neden her hesap için farklı parola kullanılmalıdır?',
        text: 'Eğer bir platformda kullandığınız parola bir veri sızıntısında ele geçirilirse, saldırganlar "credential stuffing" yöntemiyle aynı parolayı e-posta, bankacılık ve sosyal medya hesaplarınızda dener. Her hesapta benzersiz parola bu riski tamamen izole eder.',
      },
      {
        title: 'Rastgelelik ne anlama gelir?',
        text: 'İnsanlar tahmin edilebilir kalıplar (doğum yılları, klavye sıraları, sevdiklerinin adları) seçmeye meyillidir. Kriptografik rastgelelik (CSPRNG), uygun uygulandığında bir sonraki karakterin tahminini hesaplama açısından zorlaştırır.',
      },
      {
        title: 'Parola entropisi nedir?',
        text: 'Entropi, bir parolanın belirsizlik veya rastgelelik derecesinin bit cinsinden ölçüsüdür. Örneğin 128 bit entropiye sahip bir parolayı kırmak için ortalama 2¹²⁷ deneme gerekir (yaklaşık 1,7 × 10³⁸). Saniyede bir trilyon deneme yapan bir saldırgan için bu, evrenin yaşının yüz milyonlarca katı süre demektir.',
      },
      {
        title: 'Parola ifadesi (passphrase) nedir?',
        text: 'Parola ifadesi, birden fazla rastgele seçilmiş kelimenin bir araya getirilmesiyle oluşan uzun ancak akılda kalıcı bir ifadedir. Hatırlanması çok daha kolaydır ve yeterli sayıda kelimeyle klasik karmaşık parolalar kadar yüksek güvenlik sunar.',
      },
      {
        title: 'PIN ile parola arasındaki fark nedir?',
        text: 'PIN (Kişisel Kimlik Numarası) yalnızca rakamlardan (0-9) oluşur ve arama uzayı sınırlıdır. Genellikle fiziksel cihazlarda (kart, telefon) donanım kilidi ve deneme sınırı eşliğinde kullanılır; web hesapları için tek başına yeterli değildir.',
      },
      {
        title: 'Parola yöneticisi neden önemlidir?',
        text: 'İnsan hafızası onlarca 24 karakterlik karmaşık ve rastgele parolayı saklayamaz. Güvenilir bir parola yöneticisi tüm parolalarınızı şifrelenmiş tek bir kasada tutarak hem güvenliği hem de pratikliği en üst düzeye çıkarır.',
      },
    ],
  },
  faq: {
    title: 'Sık Sorulan Sorular',
    subtitle: 'Parola Oluştur platformu hakkında merak ettiğiniz tüm soruların yanıtları.',
    items: [
      {
        q: 'Parola Oluştur ücretsiz mi?',
        a: 'Evet, Parola Oluştur tamamen ücretsizdir, herhangi bir üyelik, abonelik veya gizli ücret talep etmez.',
      },
      {
        q: 'Oluşturulan parolalar kaydediliyor mu?',
        a: 'Kesinlikle hayır. Üretilen parolalar hiçbir şekilde veri tabanına, yerel depolamaya (localStorage/sessionStorage), çerezlere veya herhangi bir sunucu günlüğüne kaydedilmez.',
      },
      {
        q: 'Parolalar sunucuya gönderiliyor mu?',
        a: 'Hayır. Tüm üretim algoritmaları doğrudan tarayıcınızın JavaScript motorunda ve Web Crypto API kullanılarak yerel olarak çalıştırılır.',
      },
      {
        q: 'Güçlü parola nasıl oluşturulur?',
        a: 'En az 16-24 karakter uzunluğunda, büyük-küçük harf, rakam ve sembolleri dengeli içeren, kişisel bilgi veya sözlük kelimesi barındırmayan ve kriptografik rastgelelikle üretilmiş parolalar tercih edilmelidir.',
      },
      {
        q: 'Parola entropisi nedir?',
        a: 'Entropi, parolanın ne kadar rastgele olduğunu ve bir saldırganın brute-force denemeleriyle onu tahmin etmesinin ne kadar zor olduğunu bit cinsinden gösteren matematiksel bir ölçüttür.',
      },
      {
        q: 'Birden fazla parola oluşturabilir miyim?',
        a: 'Evet. Toplu parola sayfasında aynı ayarlarla 5 ile 500 arasında parola üretebilir, listenin tamamını kopyalayabilir veya TXT dosyası olarak indirebilirsiniz.',
      },
      {
        q: 'Parola ifadesi (passphrase) nedir?',
        a: 'Rastgele kelimelerin ayraçlarla birleştirildiği, insan zihni için hatırlanması kolay fakat bilgisayar algoritmaları için çözülmesi son derece zor olan modern parola yöntemidir.',
      },
      {
        q: 'PIN oluşturabilir miyim?',
        a: 'Evet, PIN sekmesini kullanarak 4 ila 32 basamak arasında, ardışık dizilim kısıtlamalı ve tekrar engellemeli güvenli PIN kodları üretebilirsiniz.',
      },
      {
        q: 'Mobil cihazlarda çalışır mı?',
        a: 'Evet, Parola Oluştur tüm modern akıllı telefon, tablet ve masaüstü tarayıcılarıyla tam uyumlu, dokunmatik dostu responsive tasarıma sahiptir.',
      },
      {
        q: 'Neden her hesap için farklı parola kullanmalıyım?',
        a: 'Bir serviste yaşanacak olası bir sızıntıda diğer tüm hesaplarınızın (e-posta, sosyal medya, bankacılık) tehlikeye girmesini engellemek için her platforma özel parola şarttır.',
      },
      {
        q: 'Parola uzunluğu ne kadar olmalı?',
        a: 'Günümüz siber güvenlik standartlarında genel hesaplar için en az 16 karakter, kritik hesaplar (yönetici panelleri, finansal servisler, ana e-posta) için 20-32 karakter önerilmektedir.',
      },
      {
        q: 'Hesap oluşturmam gerekiyor mu?',
        a: 'Hayır. Herhangi bir kayıt, e-posta doğrulama veya hesap oluşturma işlemi gerekmez; siteyi açar açmaz sınırsız ve güvenli biçimde parola üretebilirsiniz.',
      },
    ],
  },
};

export type TranslationDictionary = typeof tr;
