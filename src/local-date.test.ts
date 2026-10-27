import { execFileSync } from 'node:child_process';
import { env, execPath } from 'node:process';
import { describe, expect, it } from 'vitest';

const moduleUrl = new URL('./local-date.ts', import.meta.url).href;

describe('formatLocalDate', () => {
  it.each([
    ['Pacific evening after UTC midnight', 'America/Los_Angeles', '2026-10-27T03:15:00Z', '2026-10-26'],
    ['Pacific daytime', 'America/Los_Angeles', '2026-10-26T19:00:00Z', '2026-10-26'],
    ['Pacific year rollover', 'America/Los_Angeles', '2027-01-01T03:15:00Z', '2026-12-31'],
    ['local morning before UTC midnight', 'Asia/Tokyo', '2026-01-01T15:30:00Z', '2026-01-02'],
    ['UTC leap day', 'UTC', '2028-02-29T12:00:00Z', '2028-02-29'],
  ])('uses the local calendar date for %s', (_label, timezone, instant, expected) => {
    // Separate processes make timezone behavior independent of Vitest worker settings.
    const actual = execFileSync(
      execPath,
      [
        '--experimental-strip-types',
        '--input-type=module',
        '-e',
        `import { formatLocalDate } from ${JSON.stringify(moduleUrl)};
         console.log(formatLocalDate(new Date(${JSON.stringify(instant)})));`,
      ],
      { env: { ...env, TZ: timezone }, encoding: 'utf8' },
    );

    expect(actual.trim()).toBe(expected);
  });
});
