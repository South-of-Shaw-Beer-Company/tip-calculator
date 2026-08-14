import type { EmployeeRow } from './types';

export const ROSTER_STORAGE_KEY = 'tip-calculator.employee-names';

export type RosterNames = {
  boh: string[];
  foh: string[];
};

let fallbackRowId = 0;

const createId = () =>
  globalThis.crypto?.randomUUID?.() ?? `row-${Date.now()}-${fallbackRowId++}`;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

export const parseRosterNames = (raw: string | null): RosterNames | null => {
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const { boh, foh } = parsed as { boh?: unknown; foh?: unknown };
    if (!isStringArray(boh) || !isStringArray(foh)) {
      return null;
    }

    return { boh, foh };
  } catch {
    return null;
  }
};

export const rowsFromNames = (names: string[]): EmployeeRow[] => {
  const list = names.length > 0 ? names : [''];
  return list.map((name) => ({ id: createId(), name, hours: 0 }));
};

export const loadRosterNames = (): RosterNames | null => {
  try {
    return parseRosterNames(globalThis.localStorage?.getItem(ROSTER_STORAGE_KEY) ?? null);
  } catch {
    return null;
  }
};

export const saveRosterNames = (bohRows: EmployeeRow[], fohRows: EmployeeRow[]): void => {
  try {
    globalThis.localStorage?.setItem(
      ROSTER_STORAGE_KEY,
      JSON.stringify({
        boh: bohRows.map((row) => row.name),
        foh: fohRows.map((row) => row.name),
      } satisfies RosterNames),
    );
  } catch {
    // Ignore quota and private-mode failures; the calculator still works without persistence.
  }
};
