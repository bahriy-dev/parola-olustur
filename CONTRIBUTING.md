# Contributing

Thank you for improving Parola Oluştur. Contributions in English or Turkish are welcome.

## Local setup

1. Fork the repository and clone your fork.
2. Use Node.js 24 (`nvm use` if you use nvm), then run `npm ci`.
3. Create a focused branch: `git switch -c fix/describe-the-change`.
4. Run `npm run dev` and check both `/` and `/en` when changing user-facing content.

## Before opening a pull request

```bash
npm run check
npm run lint -- --max-warnings 0
```

For UI, routing, or browser behavior changes, also install Playwright browsers, build the app, and run `npm run test:e2e`. For algorithm changes, run `npm run test:tools` and add known-answer or differential tests against an independent implementation. Explain checks you could not run.

Keep changes focused. Describe the problem, resulting behavior, and validation. Include screenshots for visible changes, using synthetic data only. Do not reformat unrelated files or commit generated output, environment files, editor settings, credentials, or source archives.

## Adding or changing tools

Follow [the architecture guide](docs/architecture.md). Keep registry metadata, execution capabilities, UI fields, both locales, and tests consistent. Unsupported algorithms must fail explicitly; do not silently substitute another algorithm. Avoid unverified security, compliance, constant-time, or entropy claims.

Read the Next.js documentation bundled in `node_modules/next/dist/docs/` before changing framework behavior, as requested in `AGENTS.md`.

## Issues and conduct

Use the issue templates for bugs and feature requests. Describe browser/Node versions and reproduction steps. Treat contributors respectfully, discuss the work rather than the person, and do not post harassment or private information. Maintainers may remove abusive content.

Report exploitable vulnerabilities privately as described in [SECURITY.md](SECURITY.md), not in a public issue. Contributions are provided under the repository's [MIT license](LICENSE).
