import type { EmployeeRow, GroupKey, GroupResult } from './types';

export const centsFromDollars = (amount: number): number => Math.round(amount * 100);

export const dollarsFromCents = (cents: number): number => cents / 100;

export const formatCurrency = (cents: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollarsFromCents(cents));

export const roundDownToNickelCents = (amountCents: number): number =>
  Math.floor(Math.max(0, amountCents) / 5) * 5;

export const calculateGroup = ({
  key,
  label,
  totalTipsCents,
  percent,
  employees,
}: {
  key: GroupKey;
  label: string;
  totalTipsCents: number;
  percent: number;
  employees: EmployeeRow[];
}): GroupResult => {
  const eligibleRows = employees.filter((row) => row.name.trim() !== '' && row.hours > 0);
  const totalHours = eligibleRows.reduce((sum, row) => sum + row.hours, 0);
  const poolCents = Math.round((totalTipsCents * percent) / 100);

  const rows = employees.map((row) => {
    const canReceivePayout = row.name.trim() !== '' && row.hours > 0 && totalHours > 0;
    const rawPayoutCents = canReceivePayout ? (poolCents * row.hours) / totalHours : 0;
    const payoutCents = roundDownToNickelCents(rawPayoutCents);

    return {
      ...row,
      rawPayoutCents,
      payoutCents,
    };
  });

  const totalPayoutCents = rows.reduce((sum, row) => sum + row.payoutCents, 0);

  return {
    key,
    label,
    percent,
    poolCents,
    totalHours,
    totalPayoutCents,
    remainderCents: poolCents - totalPayoutCents,
    rows,
  };
};
