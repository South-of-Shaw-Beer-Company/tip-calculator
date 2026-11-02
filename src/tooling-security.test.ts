import { readFileSync } from 'node:fs';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

describe('security-patched lint toolchain', () => {
  it('locks every minimatch dependency to a patched release', () => {
    const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
    const matchers = Object.entries(lock.packages)
      .filter(([path]) => path.endsWith('/minimatch'))
      .map(([, entry]) => (entry as { version: string }).version);

    expect(matchers.length).toBeGreaterThan(0);
    for (const version of matchers) {
      const [major, minor, patch] = version.split('.').map(Number);
      expect(major > 11 || (major === 11 && (minor > 0 || patch >= 1))).toBe(true);
    }
  });

  it('still discovers TSX files and rejects invalid TypeScript with the patched matcher', async () => {
    const eslint = new ESLint();
    const results = await eslint.lintFiles(['src/**/*.{ts,tsx}']);
    expect(results.some((result) => result.filePath.endsWith('/src/App.tsx'))).toBe(true);
    expect(results.every((result) => result.errorCount === 0)).toBe(true);

    const [invalid] = await eslint.lintText('const unused: number = 1;', { filePath: 'src/probe.ts' });
    expect(invalid.messages.some((message) => message.ruleId === '@typescript-eslint/no-unused-vars')).toBe(true);
  });
});
