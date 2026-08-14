export const SPLIT_STORAGE_KEY = 'tip-calculator.split-percents';

export type TipSplit = {
  boh: number;
  foh: number;
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export const parseTipSplit = (raw: string | null): TipSplit | null => {
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const { boh, foh } = parsed as { boh?: unknown; foh?: unknown };
    if (!isFiniteNumber(boh) || !isFiniteNumber(foh)) {
      return null;
    }

    return { boh, foh };
  } catch {
    return null;
  }
};

export const loadTipSplit = (): TipSplit | null => {
  try {
    return parseTipSplit(globalThis.localStorage?.getItem(SPLIT_STORAGE_KEY) ?? null);
  } catch {
    return null;
  }
};

export const saveTipSplit = (boh: number, foh: number): void => {
  try {
    globalThis.localStorage?.setItem(
      SPLIT_STORAGE_KEY,
      JSON.stringify({ boh, foh } satisfies TipSplit),
    );
  } catch {
    // Ignore quota and private-mode failures; the calculator still works without persistence.
  }
};
