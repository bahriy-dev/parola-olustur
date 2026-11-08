import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

// Browser tab icon: the BrandMark (two masked characters and a caret) on the dark tile.
export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7, background: 'linear-gradient(180deg, #1e293b, #020617)' }}>
        <svg width="22" height="22" viewBox="0 0 20 20">
          <circle cx="5" cy="10" r="2.1" fill="#ffffff" />
          <circle cx="10" cy="10" r="2.1" fill="#ffffff" />
          <rect x="13.3" y="5" width="2.1" height="10" rx="1.05" fill="#60a5fa" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
