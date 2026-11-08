import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// Home-screen icon: same mark as BrandMark. iOS rounds the corners itself, so the tile is square.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg, #1e293b, #020617)' }}>
        <svg width="112" height="112" viewBox="0 0 20 20">
          <circle cx="5" cy="10" r="1.9" fill="#ffffff" />
          <circle cx="10" cy="10" r="1.9" fill="#ffffff" />
          <rect x="13.4" y="5.5" width="1.8" height="9" rx="0.9" fill="#60a5fa" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
