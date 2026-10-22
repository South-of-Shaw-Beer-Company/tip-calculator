# Maintenance policy

No new paid service is required. This repository is public; use standard GitHub-hosted Linux runners only. Vercel preview builds use the existing hosting account and its separate allowances.

## Automatic checks and updates

- Dependabot checks npm dependencies and GitHub Actions weekly on Monday at 08:00 America/Los_Angeles. Routine patch/minor updates are grouped by production/development dependencies. Major npm upgrades remain separate, not ignored. The routine PR limit queues additional updates rather than dropping them.
- Security-update PRs are enabled in repository settings independently of the weekly version-update schedule. A security fix can require a major upgrade; review it rather than suppressing it.
- GitHub secret scanning and secret push protection are enabled. They are not a guarantee that every credential format will be detected.
- The CI `check` job runs on PRs and pushes to main, using Node 24, lockfile installs, tests, lint and a production build. The build includes TypeScript checking. It has read-only repository permissions, cancellation of superseded runs, and a ten-minute timeout.
- Main requires the GitHub Actions `check` result and an up-to-date branch, including for administrators. No second reviewer is required. No automatic merging is configured.
- A separate dependency audit runs on dependency PRs, manually, and weekly at 16:35 UTC Monday (09:35 PDT / 08:35 PST). It fails for high/critical findings or scanner errors. It uses the lockfile without installing packages and is intentionally NOT a required check until the existing vulnerability baseline is resolved. Do not mistake passing CI for a clean vulnerability audit.

## Weekly review

1. Review security fixes first; do not wait for Monday for a critical advisory.
2. Review the PR diff and both CI and audit results. Separate browser-bundled dependencies from build/test tooling when evaluating applicability. A semver patch is not automatically safe.
3. Check the Vercel preview: calculate a known payout, change BOH/FOH percentages, reload to verify stored settings, and generate the PDF. Use fictional employee names.
4. Merge only when understood and validated; production deployment remains the existing Vercel integration.
5. Verify https://tipcalc.brewpubops.com after deployment and repeat the calculation/PDF smoke check. If broken, restore the prior known-good deployment in Vercel and revert the change through a PR. This static app has no application database migration.

## Initial baseline and outstanding work

Local baseline on Node 24: all 10 tests passed, lint passed, TypeScript and production build passed. npm audit reported 14 affected package entries (2 critical, 7 high, 3 moderate, 2 low); these are package-path findings, not 14 proven production vulnerabilities. GitHub returned no open Dependabot alerts at the earlier inspection, so scanner agreement must not be assumed.

Vite/esbuild findings concern build/development tooling; Vitest and Tinypool critical-rated findings concern test tooling and require advisory-specific applicability review. DOMPurify is pulled in through the PDF dependency and needs separate browser-path review. Do not expose development/test servers publicly. Do not run `npm audit fix --force` or hide findings with blanket exceptions.

Next remediation is a separate tested dependency update, including a deliberate Vite migration if needed. Once the baseline is clean, require the audit check on dependency PRs only through a workflow that always reports a stable required check (avoid permanently pending path-filtered checks).

The Node 24 CI choice does not establish Vercel build settings or the deployed commit. Confirm those through the provider before calling production standardized. GitHub Actions failure notifications must be enabled for the maintainer; scheduled audit failure alone is not an independent uptime alert.
