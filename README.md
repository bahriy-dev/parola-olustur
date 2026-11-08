# Parola Oluştur

**Browser-based password generation, hashing, and cryptography tools — in Turkish and English.**

[![CI](https://github.com/bahriy-dev/parola-olustur/actions/workflows/ci.yml/badge.svg)](https://github.com/bahriy-dev/parola-olustur/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js 24](https://img.shields.io/badge/Node.js-24-43853d.svg)](.nvmrc)

[Live application](https://parolaolustur.com) · [Türkçe](README.tr.md) · [Contributing](CONTRIBUTING.md) · [Deployment](docs/deployment.md) · [Security](SECURITY.md)

Generate passwords and passphrases, inspect tokens, compare hashes, and experiment with cryptographic operations without sending tool inputs to an application API. Computation runs in the browser; expensive operations use a cancellable Web Worker.

This repository is a self-hostable **Next.js application**, not a published npm SDK or an independently audited cryptography library.

## What you can do

| Area | Capabilities |
| --- | --- |
| Passwords | Configurable random passwords, TR/EN passphrases, PINs, bulk generation, strength estimates |
| Hashing | SHA-2, SHA-3, BLAKE2b, BLAKE3, Keccak, hash identification and verification |
| Password derivation | Argon2 variants, scrypt, PBKDF2, bcrypt generation and verification |
| Tokens & encoding | JWT, HOTP/TOTP, UUID, NanoID, secure tokens, Base64, hex, URL encoding |
| Cryptography | AES-GCM, HMAC, HKDF, RSA, ECDSA, browser-dependent Ed25519, ECDH demonstration |
| Interface | Turkish and English routes, light/dark themes, search, responsive forms |

The tool registry records availability explicitly. AES-CBC, ChaCha20-Poly1305, and Shamir are unavailable; legacy hashes and classical ciphers are for compatibility or education.

## Quick start

Use Node.js 24 (see [.nvmrc](.nvmrc)) and npm.

```bash
git clone https://github.com/bahriy-dev/parola-olustur.git
cd parola-olustur
npm ci
npm run dev
```

Open <http://localhost:3000> for Turkish or <http://localhost:3000/en> for English. No database, account, API key, or environment file is required for local development.

For a production server:

```bash
npm run build
npm start
```

Use HTTPS outside localhost so browser cryptography and clipboard APIs work. See [self-hosting and Railway](docs/deployment.md) for configuration and domain changes.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development server |
| `npm run check` | Type checking, lint, unit tests, production build |
| `npm test` | Reference vectors, differential checks, content and capability tests |
| `npm run test:tools` | Extended tool tests; can be CPU/memory intensive |
| `npm run test:e2e` | Playwright flows, route metadata and accessibility checks |
| `npm run lint -- --max-warnings 0` | Strict lint check used by CI |
| `npm audit --omit=dev` | Production dependency advisories |
| `npm run package:source` | Source archive excluding local configuration and generated files |

Install browser binaries and build before running end-to-end tests:

```bash
npx playwright install --with-deps chromium firefox webkit
npm run build
npm run test:e2e
```

Playwright starts the production server on port 3100. The all-tools sweep runs in Chromium; other test suites also exercise Firefox, WebKit, and a mobile device profile. Tests are evidence of specific behaviors, not a security certification.

## Architecture

```text
src/app/                 App Router pages and locale-aware routes
src/components/          Generator, tool forms, navigation and shared UI
src/content/             Tool explanations and educational content
src/lib/crypto.ts        Password, PIN and passphrase generation
src/lib/tools-engine.ts  Tool execution and algorithm dispatch
src/lib/hash/            Hash implementations, registry and identification
src/lib/crypto.worker.ts Worker entry point for expensive computations
src/lib/i18n/            Translations and public URL mapping
src/proxy.ts             Routing and request-specific CSP
tests/                  Unit, differential and browser tests
```

See [developer architecture](docs/architecture.md) for adding a tool and reusing internal functions.

## Privacy and boundaries

- Randomness uses Web Crypto with rejection sampling; missing secure randomness fails explicitly.
- Tool inputs and outputs are processed locally by application code. Hosting still involves network requests for pages and assets.
- Optional Google Analytics/Tag Manager and Meta integrations are disabled when their environment IDs are empty. When configured, they load after consent. Review third-party container configuration separately; self-hosters can leave these integrations disabled.
- Language, theme, and consent preferences use browser storage. Clipboard copies and downloaded output are controlled by the user.
- File operations are in memory and limited to 10 MiB. There is no streaming file processing.
- Strength estimates are not guarantees of cracking time. Local passphrase wordlists are not EFF wordlists.
- The SHA-1 prefix tool does not query a breach database. A JWT decode is not signature verification, and a PEM inspection is not certificate-chain validation.
- JavaScript does not provide a blanket constant-time guarantee. Browser extensions, device compromise, and modified hosting can defeat application-level protections.

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities and [the historical remediation notes](docs/remediation.md) for earlier implementation changes.

## Contributing

Bug reports, reproducible test cases, translation improvements, documentation, and focused pull requests are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md). Never include real passwords, private keys, tokens, or personal data in an issue.

## License

[MIT](LICENSE) © 2026 Bahri Yilmaz. Third-party dependencies retain their own licenses. The license does not imply an independent security audit or endorsement.
