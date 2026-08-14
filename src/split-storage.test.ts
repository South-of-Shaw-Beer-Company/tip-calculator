import { describe, expect, it } from 'vitest';
import { parseTipSplit } from './split-storage';

describe('parseTipSplit', () => {
  it('reads valid BOH and FOH percentages', () => {
    expect(parseTipSplit(JSON.stringify({ boh: 60, foh: 40 }))).toEqual({
      boh: 60,
      foh: 40,
    });
  });

  it('returns null for missing, corrupt, or incomplete payloads', () => {
    expect(parseTipSplit(null)).toBeNull();
    expect(parseTipSplit('{')).toBeNull();
    expect(parseTipSplit(JSON.stringify({ boh: 60 }))).toBeNull();
    expect(parseTipSplit(JSON.stringify({ boh: '60', foh: 40 }))).toBeNull();
    expect(parseTipSplit(JSON.stringify({ boh: Number.NaN, foh: 40 }))).toBeNull();
  });
});
