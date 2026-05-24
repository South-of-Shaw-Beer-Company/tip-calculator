# Tip Calculator

A one-page React app for calculating employee cash tip payouts.

The calculator is built with Vite, TypeScript, React, and Mantine. It does not use a backend, login, or data storage.

## What It Does

- Enter a date and total cash tips.
- Set editable Back of House and Front of House split percentages.
- Add, remove, and edit employee rows for each group.
- Allocate each group pool by employee hours.
- Round each employee payout down to the nearest nickel.
- Show any unallocated remainder caused by rounding.
- Print a compact one-page report.

## Calculation Rules

- Back of House defaults to `10%`.
- Front of House defaults to `90%`.
- Each group pool is calculated from the total cash tips and that group's percentage.
- Each employee payout is based on `employee hours / group total hours`.
- Blank employee rows and rows with zero hours receive `$0.00`.
- Payouts are rounded down to the nearest `$0.05`.
- Remainders are displayed and are not redistributed.

## Getting Started

Install dependencies:

```sh
npm install
```

Start the local development server:

```sh
npm run dev
```

Build for production:

```sh
npm run build
```

Preview the production build:

```sh
npm run preview
```

## Checks

Run unit tests:

```sh
npm test
```

Run lint:

```sh
npm run lint
```

## Project Structure

- `src/App.tsx` contains the calculator UI and print report.
- `src/calculations.ts` contains payout, rounding, and formatting logic.
- `src/calculations.test.ts` covers core rounding and allocation behavior.
- `src/styles.css` contains screen and print styles.
