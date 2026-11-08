import { AppShell } from '@/components/shell/AppShell';
import { I18nProvider } from '@/lib/i18n';
import { ThemeProvider } from '@/lib/theme/theme-context';
import type { Metadata,Viewport } from 'next';
import { Geist,Geist_Mono } from 'next/font/google';
import { headers } from 'next/headers';
import { isLocale,LOCALES } from '@/lib/i18n/routing';
import type { LangParams } from '@/lib/i18n/server';
import { UI } from '@/lib/i18n/ui';
import { SITE_NAME,SITE_URL } from '@/lib/site';
import { notFound } from 'next/navigation';
import '../globals.css';

// latin-ext carries Turkish ğ, ş, ı, İ; without it those letters fall back to a different system font.
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin', 'latin-ext'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin', 'latin-ext'],
});

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

// Fallbacks only; every page sets its own title, description, canonical, hreflang and Open Graph via pageMetadata().
export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { lang } = await params;
  const t = UI[isLocale(lang) ? lang : 'tr'];
  return {
    title: t.pages.home.title,
    description: t.pages.home.description,
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    metadataBase: new URL(SITE_URL),
    openGraph: { siteName: SITE_NAME, locale: t.seo.ogLocale, type: 'website' },
    twitter: { card: 'summary_large_image' },
    manifest: '/manifest.webmanifest',
    // Ownership tokens for Google Search Console (HTML tag method) and Meta Business domain verification.
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
      other: process.env.META_DOMAIN_VERIFICATION ? { 'facebook-domain-verification': process.env.META_DOMAIN_VERIFICATION } : undefined,
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
  width: 'device-width',
  initialScale: 1,
};

// Applies the saved theme before first paint so dark-mode users do not see a light flash.
const themeScript = `try{if(localStorage.getItem('parola_theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}`;

export default async function RootLayout({ children, params }: LangParams & { children: React.ReactNode }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const nonce=(await headers()).get('x-nonce') ?? undefined;
  return (
    // The pre-paint script below may add the dark class before hydration.
    <html lang={lang} suppressHydrationWarning>
      <head>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <I18nProvider lang={lang}>
            <AppShell>{children}</AppShell>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
