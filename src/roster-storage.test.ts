import { describe, expect, it } from 'vitest';
import { parseRosterNames, rowsFromNames } from './roster-storage';

describe('parseRosterNames', () => {
  it('reads valid BOH and FOH name lists', () => {
    expect(
      parseRosterNames(
        JSON.stringify({
          boh: ['Alex', 'Sam'],
          foh: ['Jordan', ''],
        }),
      ),
    ).toEqual({
      boh: ['Alex', 'Sam'],
      foh: ['Jordan', ''],
    });
  });

  it('returns null for missing, corrupt, or incomplete payloads', () => {
    expect(parseRosterNames(null)).toBeNull();
    expect(parseRosterNames('{')).toBeNull();
    expect(parseRosterNames(JSON.stringify({ boh: ['Alex'] }))).toBeNull();
    expect(parseRosterNames(JSON.stringify({ boh: ['Alex'], foh: [1] }))).toBeNull();
  });
});

describe('rowsFromNames', () => {
  it('creates unpaid rows from saved names', () => {
    const rows = rowsFromNames(['Alex', 'Sam']);

    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.name)).toEqual(['Alex', 'Sam']);
    expect(rows.every((row) => row.hours === 0)).toBe(true);
    expect(new Set(rows.map((row) => row.id)).size).toBe(2);
  });

  it('keeps a single blank row when no names are stored', () => {
    const rows = rowsFromNames([]);

    expect(rows).toEqual([expect.objectContaining({ name: '', hours: 0 })]);
  });
});
