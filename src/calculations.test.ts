import { describe, expect, it } from 'vitest';
import { calculateGroup, roundDownToNickelCents } from './calculations';

describe('roundDownToNickelCents', () => {
  it('floors payouts to the nearest nickel', () => {
    expect(roundDownToNickelCents(123.4)).toBe(120);
    expect(roundDownToNickelCents(125)).toBe(125);
    expect(roundDownToNickelCents(129.9)).toBe(125);
  });
});

describe('calculateGroup', () => {
  it('splits the default BOH pool by hours', () => {
    const result = calculateGroup({
      key: 'boh',
      label: 'Back of House',
      totalTipsCents: 2000,
      percent: 10,
      employees: [
        { id: '1', name: 'Emp 1', hours: 3 },
        { id: '2', name: 'Emp 2', hours: 6 },
      ],
    });

    expect(result.poolCents).toBe(200);
    expect(result.rows.map((row) => row.payoutCents)).toEqual([65, 130]);
    expect(result.totalPayoutCents).toBeLessThanOrEqual(result.poolCents);
    expect(result.remainderCents).toBe(5);
  });

  it('does not pay blank rows or exceed the pool', () => {
    const result = calculateGroup({
      key: 'foh',
      label: 'Front of House',
      totalTipsCents: 2000,
      percent: 90,
      employees: [
        { id: '1', name: 'Emp 1', hours: 5 },
        { id: '2', name: '', hours: 10 },
        { id: '3', name: 'Emp 3', hours: 0 },
      ],
    });

    expect(result.rows.map((row) => row.payoutCents)).toEqual([1800, 0, 0]);
    expect(result.totalPayoutCents).toBeLessThanOrEqual(result.poolCents);
  });
});
