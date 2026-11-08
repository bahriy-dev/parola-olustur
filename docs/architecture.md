# Developer architecture

## Data flow

Pages in `src/app` render the application shell and tool components. Tool metadata lives in `src/lib/tools-registry.ts`; executable IDs live in `src/lib/tool-capabilities.ts`. Shared tool fields and result presentation live under `src/components/tools`.

Execution passes through the tool execution/worker client modules into `src/lib/crypto.worker.ts` and the engine. Hash code lives in `src/lib/hash`, password derivation in `src/lib/kdf.ts`, and asymmetric operations in `src/lib/asymmetric.ts`. Password generation is in `src/lib/crypto.ts`. Worker cancellation prevents expensive jobs from indefinitely blocking the interface.

`src/proxy.ts` handles public locale routes and CSP. Turkish URLs have no locale prefix; English routes use `/en` and translated path segments. `src/lib/i18n/routing.ts` defines the mapping. `src/lib/site.ts` owns canonical site identity.

## Add a tool

1. Define truthful metadata and availability in the tool registry.
2. Add an executable capability and implementation if the tool is supported. Unknown IDs must fail explicitly.
3. Define input fields, validation, output, and translations. Update both Turkish and English explanatory content.
4. Use the worker path for expensive work and preserve cancellation and stale-result handling.
5. Add independent known-answer tests, invalid-input tests, and browser coverage. Check the capability and content tests.
6. Verify routes and metadata; unsupported pages should not be advertised as working tools.

## Reuse an internal function

These are internal source modules, not a stable package API. Within this checkout, a password-generation call can look like:

```ts
import { generateRandomPassword } from '@/lib/crypto';

const password = generateRandomPassword({
  length: 24,
  lowercase: true,
  uppercase: true,
  numbers: true,
  symbols: true,
  excludeSimilar: false,
  noAdjacentDuplicates: false,
  requireEachCategory: true,
  customCharset: '',
  excludedChars: '',
});
```

Run in an environment with Web Crypto. The `@/` import alias belongs to this application's TypeScript configuration. Extracting these modules into another project requires preserving their dependencies, types, wordlists, tests, and license; do not treat the web application's npm package name as an installable SDK.

## Tests

`tests/*.test.ts` cover unit/reference behavior, catalog consistency and content. `tests/tools.fuzz.ts` exercises broader algorithm cases. `tests/e2e` covers browser execution, metadata and accessibility. Test fixtures use synthetic values; never replace them with production secrets.
