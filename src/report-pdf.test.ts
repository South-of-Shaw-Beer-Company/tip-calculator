import { describe, expect, it } from 'vitest';
import { createTipAllocationPdf } from './report-pdf';
import type { GroupResult } from './types';

const result: GroupResult = {
  key: 'boh',
  label: 'Back of House',
  percent: 10,
  poolCents: 200,
  totalHours: 3,
  totalPayoutCents: 200,
  remainderCents: 0,
  rows: [
    {
      id: 'employee-1',
      name: 'Sam',
      hours: 3,
      rawPayoutCents: 200,
      payoutCents: 200,
    },
  ],
};

describe('createTipAllocationPdf', () => {
  it('creates a downloadable PDF with a date-based filename', async () => {
    const { blob, filename } = createTipAllocationPdf({
      date: '2026-08-05',
      totalTipsCents: 2000,
      percentTotal: 100,
      hasPercentMismatch: false,
      results: [result],
      totalPayoutCents: 200,
      totalRemainderCents: 0,
    });

    const header = new TextDecoder().decode((await blob.arrayBuffer()).slice(0, 4));

    expect(blob.type).toBe('application/pdf');
    expect(header).toBe('%PDF');
    expect(filename).toBe('tip-allocation-2026-08-05.pdf');
  });
});
