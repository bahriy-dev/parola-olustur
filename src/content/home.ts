import type { Locale } from '@/lib/i18n/routing';
import type { ToolContent } from './tools/types';

// The short explainer under the home page generator. Links are internal paths.
export const HOME_CONTENT: Record<Locale, ToolContent> = {
  tr: {
    sections: [
      {
        title: 'Nasıl çalışır?',
        blocks: [
          'Parolalar tarayıcınızdaki Web Crypto rastgele sayı üreticisiyle (CSPRNG) oluşturulur ve sunucuya gönderilmez. Karakter seçiminde modulo sapması olmaması için reddetme örneklemesi kullanılır; seçtiğiniz kurallar (ör. her türden en az bir karakter) karşılanamıyorsa sessizce gevşetilmez, hata gösterilir.',
        ],
      },
      {
        title: 'Entropi değeri ne anlatır?',
        blocks: [
          'Gösterilen bit değeri, seçili ayarlarla üretilebilecek tüm çıktıların sayısının log₂ değeridir. Rastgele üretilmiş bir parolanın tahmin edilme güçlüğünü bu değer belirler. Kendi seçtiğiniz bir parolanın gücünü ölçmek için [parola gücü analizi](/araclar/strength-checker) aracını kullanın.',
        ],
      },
      {
        title: 'Hangi türü seçmeli?',
        blocks: [
          {
            list: [
              '**Rastgele parola:** parola yöneticisinde saklanacak hesaplar ve uygulama gizli anahtarları için.',
              '**Parola ifadesi:** ezberlenmesi veya elle yazılması gereken ana parolalar için. 5–6 kelime önerilir.',
              '**PIN:** yalnız rakam kabul eden ve deneme sayısını sınırlayan sistemler için.',
            ],
          },
        ],
      },
    ],
  },
  en: {
    sections: [
      {
        title: 'How does it work?',
        blocks: [
          'Passwords are created with your browser’s Web Crypto random number generator (CSPRNG) and are never sent to a server. Characters are picked with rejection sampling so there is no modulo bias, and if the rules you choose (such as at least one character of each type) cannot be met, you get an error instead of quietly relaxed rules.',
        ],
      },
      {
        title: 'What does the entropy figure mean?',
        blocks: [
          'The number of bits shown is log₂ of how many different outputs the selected settings can produce. For a randomly generated password, that number is what determines how hard it is to guess. To rate a password you chose yourself, use the [password strength checker](/araclar/strength-checker).',
        ],
      },
      {
        title: 'Which type should I choose?',
        blocks: [
          {
            list: [
              '**Random password:** for accounts stored in a password manager and for application secrets.',
              '**Passphrase:** for master passwords you need to remember or type by hand. Five to six words are recommended.',
              '**PIN:** for systems that accept only digits and limit the number of attempts.',
            ],
          },
        ],
      },
    ],
  },
};
