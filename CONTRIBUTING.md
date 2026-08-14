# Contributing

Thanks for taking a look. Small, focused pull requests are welcome.

## Setup

```sh
npm install
npm run dev
```

## Before you open a PR

```sh
npm test
npm run lint
```

The GitHub Actions workflow runs the same checks, plus `npm run build`.

## Calculation rules

The payout rules are intentional and should stay consistent:

- Each group pool is `total cash tips * group percent`.
- Each employee payout is `employee hours / group total hours`.
- Blank names and zero-hour rows get `$0.00`.
- Payouts round down to the nearest `$0.05`.
- Remainders are shown and are not redistributed.

If you want to change those rules, open an issue first so we can talk through it.

## Pull requests

- Keep the change scoped to one problem.
- Add or update tests when you change calculation or PDF behavior.
- Do not commit `node_modules`, `dist`, `.env` files, or editor settings.
