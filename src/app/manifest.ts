import { SITE_NAME } from '@/lib/site';
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} – Güvenli Parola Oluşturucu ve Kriptografi Araçları`,
    short_name: SITE_NAME,
    description:
      'Tarayıcıda çalışan parola oluşturucu, hash, JWT, şifreleme ve anahtar araçları.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#f8fafc',
    orientation: 'portrait-primary',
    categories: ['utilities', 'security', 'developer'],
    lang: 'tr',
    icons: [
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
