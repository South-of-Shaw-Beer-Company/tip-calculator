# Maintenance policy

No new paid service is required. This repository is public; use standard GitHub-hosted Linux runners only. Vercel preview builds use the existing hosting account and its separate allowances.

## Automatic checks and updates

- Dependabot checks npm dependencies and GitHub Actions weekly on Monday at 08:00 America/Los_Angeles. Routine patch/minor updates are grouped by production/development dependencies. Major npm upgrades remain separate, not ignored. The routine PR limit queues additional updates rather than dropping them.
- Security-update PRs are enabled in repository settings independently of the weekly version-update schedule. A security fix can require a major upgrade; review it rather than suppressing it.
- GitHub secret scanning and secret push protection are enabled. They are not a guarantee that every credential format will be detected.
- The CI `check` job runs on PRs and pushes to main, using Node 24, lockfile installs, a high/critical dependency audit, tests, lint and a production build. The build includes TypeScript checking. It has read-only repository permissions, cancellation of superseded runs, and a ten-minute timeout.
- Main requires the GitHub Actions `check` result and an up-to-date branch, including for administrators. No second reviewer is required. No automatic merging is configured.
- A separate dependency audit runs on dependency PRs, manually, and weekly at 16:35 UTC Monday (09:35 PDT / 08:35 PST). It fails for high/critical findings or scanner errors. It uses the lockfile without installing packages and is supplemental to the audit inside the always-reporting required CI check. A newly disclosed high/critical finding blocks CI; low/moderate findings still need triage.

## Weekly review

1. Review security fixes first; do not wait for Monday for a critical advisory.
2. Review the PR diff and both CI and audit results. Separate browser-bundled dependencies from build/test tooling when evaluating applicability. A semver patch is not automatically safe.
3. Check the Vercel preview: calculate a known payout, change BOH/FOH percentages, reload to verify stored settings, and generate the PDF. Use fictional employee names.
4. Merge only when understood and validated; production deployment remains the existing Vercel integration.
5. Verify https://tipcalc.brewpubops.com after deployment and repeat the calculation/PDF smoke check. If broken, restore the prior known-good deployment in Vercel and revert the change through a PR. This static app has no application database migration.

## Verified dependency baseline

The initial lockfile audit flagged 14 affected package entries, including test/build tooling. The maintenance branch now uses Vite 7.3.7, React build plugin 5.2.0 and Vitest 4.1.12. Vite and its React plugin are correctly classified as development dependencies; Node type definitions track Node 24. Compatible transitive fixes were applied without force-fixing or security overrides. React and Mantine major versions were deliberately left unchanged.

Fresh lockfile installation on Node 24 passed all 10 tests, lint, TypeScript/production build and npm audit (zero reported vulnerabilities at verification time). A browser smoke check of the built artifact verified a known payout, persisted BOH/FOH split after reload, and a downloaded PDF with application/pdf MIME and a %PDF header. These are point-in-time checks, not a guarantee of vulnerability-free code or a complete mobile/browser compatibility review.

The required CI job now includes `npm audit --audit-level=high` for every PR, avoiding a permanently pending required check caused by path filters. The separate audit retains a weekly/manual trigger so newly published advisories can be detected without a source change. Do not disable or blanket-suppress findings to force a release.

## Current dependency maintenance

React and React DOM now use 19.3.1, with both React type packages on 19.3.0. The application already uses `createRoot` and the modern JSX transform; calculation, storage and PDF behavior remain unchanged. Dependabot's React groups precede the generic groups, cover runtime and development dependencies together, and include major/minor/patch updates for both version and security updates.

### Temporary minimatch security overrides

[GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) affects minimatch below 11.0.1. At review time, the latest ESLint 10.14.0, config-array 0.23.5 and typescript-estree 8.72.1 still request minimatch 10.x; normal lockfile updates and non-forced audit fixes cannot remediate it. This is development-only glob-pattern processing, not calculator input processing.

The overrides replace only minimatch 10.2.6 under these consumers with 11.0.1. npm requires a direct dependency's override selector to match its declared range, so ESLint uses `^10.14.0`; the two transitive parent selectors are exact. Do not broaden these selectors or replace this with an audit suppression. Remove each override when its upstream parent accepts a patched minimatch release, then regenerate the lockfile and repeat all checks.

Minimatch 11 removes RegExp-oriented APIs and changes matching internals. These consumers use the retained `Minimatch.match` / `minimatch` APIs. The security regression tests require a patched lockfile, verify TSX discovery and prove TypeScript lint errors are still rejected. The original lint target set is preserved. Clean installation, all 17 tests, lint, TypeScript/build, full and production-only audits pass; both audits report zero vulnerabilities at verification time.

## Remaining production verification

Node 24 CI does not establish Vercel build settings or the deployed commit. Confirm those through the provider before calling production standardized. Validate the Vercel preview before merge and production after release. GitHub Actions failure notifications must be enabled for the maintainer; scheduled audit failure alone is not an independent uptime alert. Main has not been updated merely by preparing this branch.
