import { NextRequest,NextResponse } from 'next/server';
import { trackerCsp } from './lib/analytics';
import { localizePath,parsePublicPath } from './lib/i18n/routing';

export function proxy(request:NextRequest) {
  const { pathname } = request.nextUrl;

  // A single host: www.<site> redirects to the bare domain with the same path.
  const host = request.headers.get('host') ?? '';
  if (host.startsWith('www.')) {
    return NextResponse.redirect(`https://${host.slice(4)}${pathname}${request.nextUrl.search}`, 308);
  }

  // One public URL per page: /tr/x and English pages reached through Turkish segments redirect to the canonical form.
  if (pathname === '/tr' || pathname.startsWith('/tr/')) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || '/';
    return NextResponse.redirect(url, 308);
  }
  const { lang, path } = parsePublicPath(pathname);
  const canonical = localizePath(path, lang);
  if (lang === 'en' && canonical !== pathname) {
    const url = request.nextUrl.clone();
    url.pathname = canonical;
    return NextResponse.redirect(url, 308);
  }

  const nonce=Buffer.from(crypto.randomUUID()).toString('base64');
  const dev=process.env.NODE_ENV==='development';
  // Inline style attributes are used by the existing progress/animation components.
  // The dev server injects <style> tags without a nonce, so development allows inline styles instead.
  // Google Analytics / Meta Pixel hosts are added only when their IDs are configured (they still load only after consent).
  const tracker=trackerCsp();
  const csp=`default-src 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${tracker.script}${dev?" 'unsafe-eval'":''}; style-src 'self' ${dev?"'unsafe-inline'":`'nonce-${nonce}'`}; style-src-attr 'unsafe-inline'; img-src 'self' data: blob:${tracker.img}; font-src 'self'; connect-src 'self'${tracker.connect}${dev?' ws:':''}; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`;
  const headers=new Headers(request.headers);headers.set('x-nonce',nonce);headers.set('Content-Security-Policy',csp);

  // Pages live under app/[lang]/ with Turkish segment names; the public URL stays as requested.
  const internal = request.nextUrl.clone();
  internal.pathname = `/${lang}${path === '/' ? '' : path}`;
  const response=NextResponse.rewrite(internal,{request:{headers}});
  response.headers.set('Content-Security-Policy',csp);
  return response;
}
// Metadata files (icons, manifest, robots, sitemap) live at the app root and are served as is.
export const config={matcher:['/((?!api|_next/static|_next/image|icon|apple-icon|favicon.ico|.*\\.(?:png|svg|ico|webmanifest|xml|txt)$).*)']};
