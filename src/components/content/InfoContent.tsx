'use client';

import { cardList,Collapsible } from '@/components/tools/ToolArticle';
import { META_PIXEL_ID } from '@/lib/analytics';
import { PageHeader } from '@/components/ui/form';
import { useLocale } from '@/lib/i18n';
import { en } from '@/lib/i18n/en';
import { tr } from '@/lib/i18n/tr';
import Link from 'next/link';
import type { ReactNode } from 'react';

// Same column as every other page so headings line up when moving between routes.
const prose = 'mx-auto max-w-4xl space-y-8 text-[15px] leading-[1.7] text-slate-700 dark:text-zinc-300';
const link = 'font-medium text-blue-700 dark:text-blue-400 underline decoration-blue-700/30 underline-offset-[3px] hover:decoration-current dark:decoration-blue-400/40';

export function FaqContent() {
  const { lang } = useLocale();
  const t = lang === 'en' ? en : tr;
  return (
    <div className={prose}>
      <PageHeader title={t.faq.title} />
      <div className={cardList}>
        {t.faq.items.map((item) => (
          <Collapsible key={item.q} title={item.q}>
            <p className="text-slate-600 dark:text-zinc-400">{item.a}</p>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}

export function GuideContent() {
  const { lang, href } = useLocale();
  const t = lang === 'en' ? en : tr;
  return (
    <article className={prose}>
      <PageHeader title={t.guide.title} description={t.guide.subtitle} />
      <div className={cardList}>
        {t.guide.topics.map((topic) => (
          <Collapsible key={topic.title} title={topic.title}>
            <p>{topic.text}</p>
          </Collapsible>
        ))}
      </div>
      {lang === 'en' ? (
        <p className="border-t border-slate-200 dark:border-zinc-800 pt-4 text-sm">
          To create passwords, use the <Link href={href('/')} className={link}>password generator</Link>; for storing passwords on a server, see the{' '}
          <Link href={href('/araclar/argon2id-generator')} className={link}>Argon2id</Link> and{' '}
          <Link href={href('/araclar/bcrypt-generator')} className={link}>bcrypt</Link> tools.
        </p>
      ) : (
        <p className="border-t border-slate-200 dark:border-zinc-800 pt-4 text-sm">
          Parola üretmek için <Link href={href('/')} className={link}>parola oluşturucuyu</Link>, sunucu tarafında parola saklamak için{' '}
          <Link href={href('/araclar/argon2id-generator')} className={link}>Argon2id</Link> veya{' '}
          <Link href={href('/araclar/bcrypt-generator')} className={link}>bcrypt</Link> araçlarını inceleyin.
        </p>
      )}
    </article>
  );
}

function Item({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[13rem_1fr] sm:gap-4">
      <dt className="font-medium text-slate-900 dark:text-zinc-100">{term}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** States what actually happens to data, matching the implementation (see README "Davranış ve sınırlar"). */
export function PrivacyContent() {
  const { lang } = useLocale();
  if (lang === 'en') {
    return (
      <article className={prose}>
        <PageHeader title="Local processing and privacy" description="What happens to the values you type and generate on this site." />
        <dl className="divide-y divide-slate-200 dark:divide-zinc-800">
          <Item term="Passwords and inputs">Generated values and anything you type into a tool are processed in your browser (in a Web Worker for heavy operations). The application has no feature that sends them to a server.</Item>
          <Item term="Randomness">All random values come from the browser’s Web Crypto CSPRNG. If it is unavailable the operation fails instead of falling back to a weaker source.</Item>
          <Item term="Files">Files you hash are read into memory in the browser (max 10 MiB) and are not uploaded.</Item>
          <Item term="Stored preferences">Your theme, sidebar and cookie choice are kept in localStorage. Secrets and results are never stored.</Item>
          {META_PIXEL_ID ? (
            <Item term="Analytics and ads">Google Analytics 4 (visit statistics) and the Meta Pixel (ad measurement) load only after you click “Accept” in the cookie banner; until then, and if you reject, no third-party script runs and no tracking cookie is set. When accepted, they receive the page address, browser and device information and an anonymous visitor ID, and set their own cookies. What you type into the tools and their results are never sent to them; Meta’s automatic button and form data collection is turned off. You can change your choice at any time with “Cookie settings” at the bottom of the page.</Item>
          ) : (
            <Item term="Analytics">Google Analytics 4 (visit statistics) loads only after you click “Accept” in the cookie banner; until then, and if you reject, no third-party script runs and no tracking cookie is set. When accepted, it receives the page address, browser and device information and an anonymous visitor ID, and sets its own cookies. What you type into the tools and their results are never sent to it, and form interaction tracking is turned off. You can change your choice at any time with “Cookie settings” at the bottom of the page.</Item>
          )}
          <Item term="Network">Page files (HTML, JavaScript, CSS, fonts) are loaded from this site’s server like any website. Apart from the services above, which load only with your consent, there are no third-party scripts.</Item>
          <Item term="Limits">JavaScript cannot guarantee constant-time execution, and a compromised device or browser extension can read what you type. Use a password manager to store generated passwords.</Item>
        </dl>
      </article>
    );
  }
  return (
    <article className={prose}>
      <PageHeader title="Yerel hesaplama ve gizlilik" description="Bu sitede yazdığınız ve ürettiğiniz değerlere ne olduğu." />
      <dl className="divide-y divide-slate-200 dark:divide-zinc-800">
        <Item term="Parolalar ve girdiler">Üretilen değerler ve araçlara yazdığınız her şey tarayıcınızda işlenir (ağır işlemler Web Worker içinde). Uygulamada bunları sunucuya gönderen bir özellik yoktur.</Item>
        <Item term="Rastgelelik">Tüm rastgele değerler tarayıcının Web Crypto CSPRNG kaynağından gelir. Bu kaynak yoksa işlem daha zayıf bir yönteme geçmez, hata verir.</Item>
        <Item term="Dosyalar">Hash’i alınan dosyalar tarayıcı belleğinde okunur (en fazla 10 MiB) ve yüklenmez.</Item>
        <Item term="Saklanan tercihler">Tema, kenar menüsü ve çerez tercihiniz localStorage’da tutulur. Gizli değerler ve sonuçlar hiçbir yerde saklanmaz.</Item>
        {META_PIXEL_ID ? (
          <Item term="Analitik ve reklam ölçümü">Google Analytics 4 (ziyaret istatistikleri) ve Meta Pixel (reklam ölçümü) yalnız çerez penceresinde “Kabul et”e bastığınızda yüklenir; o zamana kadar ve reddederseniz hiçbir üçüncü taraf kodu çalışmaz, izleme çerezi oluşturulmaz. Kabul ettiğinizde bu servisler sayfa adresini, tarayıcı ve cihaz bilgisini ve anonim bir ziyaretçi kimliğini alır ve kendi çerezlerini oluşturur. Araçlara yazdığınız değerler ve sonuçlar bu servislere hiçbir koşulda gönderilmez; Meta’nın düğme ve form verisini otomatik toplaması kapalıdır. Tercihinizi sayfanın altındaki “Çerez tercihleri” bağlantısıyla istediğiniz zaman değiştirebilirsiniz.</Item>
        ) : (
          <Item term="Analitik">Google Analytics 4 (ziyaret istatistikleri) yalnız çerez penceresinde “Kabul et”e bastığınızda yüklenir; o zamana kadar ve reddederseniz hiçbir üçüncü taraf kodu çalışmaz, izleme çerezi oluşturulmaz. Kabul ettiğinizde sayfa adresini, tarayıcı ve cihaz bilgisini ve anonim bir ziyaretçi kimliğini alır ve kendi çerezlerini oluşturur. Araçlara yazdığınız değerler ve sonuçlar bu servise hiçbir koşulda gönderilmez; form etkileşimi ölçümü kapalıdır. Tercihinizi sayfanın altındaki “Çerez tercihleri” bağlantısıyla istediğiniz zaman değiştirebilirsiniz.</Item>
        )}
        <Item term="Ağ">Sayfa dosyaları (HTML, JavaScript, CSS, fontlar) her web sitesinde olduğu gibi bu sitenin sunucusundan yüklenir. Yalnız onayınızla yüklenen yukarıdaki servisler dışında üçüncü taraf kodu yoktur.</Item>
        <Item term="Sınırlar">JavaScript sabit zamanlı çalışmayı garanti edemez; ele geçirilmiş bir cihaz veya tarayıcı eklentisi yazdıklarınızı okuyabilir. Üretilen parolaları bir parola yöneticisinde saklayın.</Item>
      </dl>
    </article>
  );
}
