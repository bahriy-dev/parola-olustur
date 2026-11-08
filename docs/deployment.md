# Self-hosting and Railway

## Runtime

Use Node.js 24 and the committed npm lockfile:

```bash
npm ci
npm run build
npm start
```

This application uses dynamic rendering and request-specific CSP nonces. Deploy it with a Next.js-compatible Node server rather than assuming it is a static HTML export. No database or application secret is needed for the built-in tools.

`next start` accepts `PORT`; for a local custom port, use `npm start -- --port 3100`. Serve production traffic over HTTPS. The build may need network access to fetch fonts used by `next/font`.

## Railway

Connect your fork or this repository to a Railway service, select Node.js 24, use `npm ci && npm run build` as the build command and `npm start` as the start command. Let Railway provide the runtime port. Generate a domain or attach your own, and verify `/`, `/en`, and a tool page after deploying.

The existing `.railwayignore` excludes dependencies, environment files and generated artifacts from CLI uploads. Store optional environment values in the service configuration. Publishing this GitHub repository does not automatically change an existing Railway deployment or its source connection.

## Domain and metadata

For your own public deployment, update `SITE_HOST` in `src/lib/site.ts` and search source, tests and content for `parolaolustur.com` to update domain-specific expectations and copy. Verify canonical links, sitemap, robots and social metadata after the change. Merely setting an unrelated environment variable will not change the current hard-coded site identity.

## Optional analytics

Copy `.env.example` to `.env.local` only if configuring analytics. Leave all IDs empty to keep third-party measurement disabled. `NEXT_PUBLIC_` values are public and compiled into client assets; they must never contain secrets. Rebuild after changing them.

Google Tag Manager container contents are controlled outside this repository. Review container tags before enabling one. The application consent gate is not a guarantee about arbitrary third-party tag behavior.

## Validation

Run `npm run check` and browser tests before deploying changes. After deployment, check HTTPS, language routing, generation, a hash operation, and browser console errors. Keep Node and dependencies maintained; do not run an automatic major dependency upgrade directly against production.
