import { SITE_HOST,SITE_NAME } from '@/lib/site';
import { isLocale } from '@/lib/i18n/routing';
import { ImageResponse } from 'next/og';

const size = { width: 1200, height: 630 };

// Share image for Open Graph/Twitter, one per locale. A route handler rather than the opengraph-image file
// convention, which would emit the internal /tr/… path in og:image.
const TEXT = {
  tr: { title: 'Güvenli Parola Oluşturucu', lead: 'Parola, PIN, hash, KDF ve JWT araçları. Tüm işlemler tarayıcınızda yapılır.' },
  en: { title: 'Secure Password Generator', lead: 'Password, PIN, hash, KDF and JWT tools. Everything runs in your browser.' },
};

export const dynamic = 'force-static';

export function generateStaticParams() {
  return [{ lang: 'tr' }, { lang: 'en' }];
}

export async function GET(_request: Request, { params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const text = TEXT[isLocale(lang) ? lang : 'tr'];
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 96px',
          background: '#f8fafc',
          color: '#0f172a',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div
            style={{
              width: 112,
              height: 112,
              borderRadius: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(180deg, #1e293b, #020617)',
            }}
          >
            <svg width="72" height="72" viewBox="0 0 20 20">
              <circle cx="5" cy="10" r="1.9" fill="#ffffff" />
              <circle cx="10" cy="10" r="1.9" fill="#ffffff" />
              <rect x="13.4" y="5.5" width="1.8" height="9" rx="0.9" fill="#60a5fa" />
            </svg>
          </div>
          {/* One text node: Satori leaves a visible gap between sibling text runs. */}
          <div style={{ display: 'flex', fontSize: 80, fontWeight: 700, letterSpacing: -2 }}>{SITE_NAME}</div>
        </div>
        <div style={{ display: 'flex', marginTop: 48, fontSize: 48, fontWeight: 700, lineHeight: 1.2 }}>
          {text.title}
        </div>
        <div style={{ display: 'flex', marginTop: 20, fontSize: 32, color: '#475569', lineHeight: 1.35 }}>
          {text.lead}
        </div>
        <div style={{ display: 'flex', marginTop: 40, fontSize: 28, color: '#2563eb', fontWeight: 600 }}>{SITE_HOST}</div>
      </div>
    ),
    { ...size },
  );
}
