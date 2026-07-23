# Security Policy

## Supported Versions

Only the latest minor release of each published package receives security fixes.

| Version      | Supported |
| ------------ | --------- |
| latest minor | ✅        |
| older        | ❌        |

## Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

Report privately via GitHub Security Advisories ("Report a vulnerability" on the repository's Security tab) once the repository is published on GitHub. Until then, contact the maintainer directly.

Include:

- Affected package and version
- Reproduction steps or proof of concept
- Impact assessment (what an attacker gains)

## Response Targets

- Acknowledgement: within 72 hours
- Triage and severity assessment: within 7 days
- Fix for critical/high issues: within 14 days of triage

## Scope

In scope: code in this repository and published packages built from it.

Out of scope: vulnerabilities in third-party dependencies (report upstream; we will still bump versions promptly), and issues requiring physical access to a user's machine.

## Handling

- Fixes for critical vulnerabilities are released as patch versions with a security note in the changelog.
- Exposed secrets are rotated immediately and the exposure window documented.
- Dependency audits run in CI; critical/high findings block releases.
