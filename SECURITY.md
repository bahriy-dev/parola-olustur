# Security policy

## Reporting a vulnerability

Use [GitHub private vulnerability reporting](https://github.com/bahriy-dev/parola-olustur/security/advisories/new) for exploitable findings. Include the affected commit, impact, minimal reproduction, browser/Node version, and synthetic test data. Do not post real credentials or an exploit involving another person's data.

If private reporting is unavailable, open an issue requesting a private contact channel without disclosing the vulnerability. No response-time or bounty commitment is implied.

## Supported code

Security fixes target the latest `main` branch. There are no maintained older release lines yet. The project has not been independently security-audited; automated checks do not establish cryptographic certification.

## Boundaries

Application tool calculations run in the browser. This does not protect against a compromised browser, malicious extension, modified deployment, clipboard observer, or third-party script. Optional analytics require configuration and user consent; leave analytics IDs empty for deployments that do not need tracking.

MD5, SHA-1, and classical ciphers are exposed for compatibility or education. The SHA-1 prefix tool is not a breach lookup. Entropy and strength estimates do not guarantee password resistance. JWT decoding and PEM inspection are not trust validation. JavaScript operations are not guaranteed constant-time, and clearing a field does not guarantee secure memory erasure.

Please report issues in random generation, algorithm dispatch, parameter validation, secret handling, workers, dependencies, CSP, and verification logic. Use reference vectors and independent implementations when evaluating correctness.
