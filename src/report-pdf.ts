import { jsPDF } from 'jspdf';
import { formatCurrency } from './calculations';
import type { CalculatedEmployeeRow, GroupResult } from './types';

type ReportPdfInput = {
  date: string;
  totalTipsCents: number;
  percentTotal: number;
  hasPercentMismatch: boolean;
  results: GroupResult[];
  totalPayoutCents: number;
  totalRemainderCents: number;
  iconData?: Uint8Array;
};

const pageWidth = 612;
const pageHeight = 792;
const margin = 25;
const contentWidth = pageWidth - margin * 2;
const columnGap = 6;
const columnWidth = (contentWidth - columnGap) / 2;
const rowsPerPage = 26;

export const createTipAllocationPdf = (input: ReportPdfInput) => {
  const pdf = new jsPDF({ format: 'letter', unit: 'pt' });
  const reportRows = input.results.map((group) =>
    group.rows.filter((row) => row.name.trim() !== '' || row.hours > 0),
  );
  const pageCount = Math.max(
    1,
    ...reportRows.map((rows) => Math.ceil(Math.max(rows.length, 1) / rowsPerPage)),
  );

  pdf.setProperties({
    title: 'Tip Allocation Report',
    subject: 'Cash tips distributed by employee hours',
  });

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    if (pageIndex > 0) {
      pdf.addPage();
    }

    const groupStartY = pageIndex === 0 ? drawFirstPageHeader(pdf, input) : drawContinuationHeader(pdf, input, pageIndex + 1);
    let lowestGroupY = groupStartY;

    input.results.slice(0, 2).forEach((group, groupIndex) => {
      const rows = reportRows[groupIndex] ?? [];
      const start = pageIndex * rowsPerPage;
      const pageRows = rows.slice(start, start + rowsPerPage);
      const isFinalChunk = start + rowsPerPage >= rows.length;
      const groupY = drawGroup(
        pdf,
        group,
        pageRows,
        margin + groupIndex * (columnWidth + columnGap),
        groupStartY,
        pageIndex === 0 && rows.length === 0,
        isFinalChunk,
      );
      lowestGroupY = Math.max(lowestGroupY, groupY);
    });

    const footerY = Math.min(pageHeight - 34, Math.max(lowestGroupY + 14, 292));
    pdf.setDrawColor(0);
    pdf.setLineWidth(0.8);
    pdf.line(margin, footerY, pageWidth - margin, footerY);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(45);
    pdf.setFontSize(7.5);
    pdf.text(
      'Payouts are rounded down to the nearest nickel. Remainders are not redistributed.',
      margin,
      footerY + 11,
    );
    pdf.setTextColor(0);
  }

  return {
    blob: pdf.output('blob'),
    filename: `tip-allocation-${input.date || 'report'}.pdf`,
  };
};

const drawFirstPageHeader = (pdf: jsPDF, input: ReportPdfInput) => {
  if (input.iconData) {
    pdf.addImage(input.iconData, 'PNG', 32, 58, 30, 30);
  }

  pdf.setTextColor(0);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(17);
  pdf.text('Tip Allocation Report', 75, 69);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.text('Cash tips distributed by employee hours', 75, 84);

  pdf.setLineWidth(0.8);
  pdf.rect(481, 52, 105, 32);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(65);
  pdf.setFontSize(6.5);
  pdf.text('DATE', 579, 64, { align: 'right' });
  pdf.setTextColor(0);
  pdf.setFontSize(10);
  pdf.text(formatReportDate(input.date), 579, 76, { align: 'right' });

  pdf.setLineWidth(1.5);
  pdf.line(margin, 100, pageWidth - margin, 100);

  const metrics = [
    ['TOTAL CASH TIPS', formatCurrency(input.totalTipsCents)],
    ['ROUNDED PAYOUTS', formatCurrency(input.totalPayoutCents)],
    ['UNALLOCATED REMAINDER', formatCurrency(input.totalRemainderCents)],
    ['SPLIT TOTAL', `${input.percentTotal.toFixed(2)}%`],
  ];
  const metricGap = 5;
  const metricWidth = (contentWidth - metricGap * 3) / 4;

  metrics.forEach(([label, value], index) => {
    const x = margin + index * (metricWidth + metricGap);
    pdf.setLineWidth(0.6);
    pdf.rect(x, 109, metricWidth, 33);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(65);
    pdf.setFontSize(6.5);
    pdf.text(label, x + 7, 121);
    pdf.setTextColor(0);
    pdf.setFontSize(11.5);
    pdf.text(value, x + 7, 135);
  });

  if (!input.hasPercentMismatch) {
    return 158;
  }

  pdf.setLineWidth(0.6);
  pdf.rect(margin, 149, contentWidth, 20);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.text('Split percentages do not equal 100%. Calculations used the entered percentages.', margin + 7, 162);
  return 184;
};

const drawContinuationHeader = (pdf: jsPDF, input: ReportPdfInput, pageNumber: number) => {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.text('Tip Allocation Report', margin, 47);
  pdf.setFontSize(8);
  pdf.text(formatReportDate(input.date), pageWidth - margin, 46, { align: 'right' });
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Page ${pageNumber}`, pageWidth - margin, 58, { align: 'right' });
  pdf.setLineWidth(1);
  pdf.line(margin, 64, pageWidth - margin, 64);
  return 82;
};

const drawGroup = (
  pdf: jsPDF,
  group: GroupResult,
  rows: CalculatedEmployeeRow[],
  x: number,
  y: number,
  showEmptyState: boolean,
  showTotals: boolean,
) => {
  const hoursX = x + columnWidth - 73;
  const payoutX = x + columnWidth - 4;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11.5);
  pdf.text(group.label, x, y);
  pdf.setFontSize(8);
  pdf.text(
    `${group.percent}%   ${formatCurrency(group.poolCents)}   ${formatHours(group.totalHours)} hrs`,
    x + columnWidth - 1,
    y,
    { align: 'right' },
  );
  pdf.setLineWidth(0.8);
  pdf.line(x, y + 6, x + columnWidth, y + 6);

  pdf.setFontSize(6.5);
  pdf.text('EMPLOYEE', x + 4, y + 19);
  pdf.text('HOURS', hoursX, y + 19, { align: 'right' });
  pdf.text('ROUNDED PAYOUT', payoutX, y + 19, { align: 'right' });
  pdf.setLineWidth(0.45);
  pdf.line(x, y + 25, x + columnWidth, y + 25);

  let rowY = y + 37;
  if (showEmptyState) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.text('No employees entered', x + 4, rowY);
    pdf.line(x, rowY + 6, x + columnWidth, rowY + 6);
    rowY += 17;
  } else {
    rows.forEach((row) => {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.text(fitText(pdf, row.name.trim() || 'Unnamed employee', 150), x + 4, rowY);
      pdf.text(formatHours(row.hours), hoursX, rowY, { align: 'right' });
      pdf.text(formatCurrency(row.payoutCents), payoutX, rowY, { align: 'right' });
      pdf.setDrawColor(180);
      pdf.line(x, rowY + 6, x + columnWidth, rowY + 6);
      pdf.setDrawColor(0);
      rowY += 17;
    });
  }

  if (!showTotals) {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(7.5);
    pdf.text('Continued on next page', x + 4, rowY + 2);
    return rowY + 8;
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.text('Total', x + 4, rowY);
  pdf.text(formatHours(group.totalHours), hoursX, rowY, { align: 'right' });
  pdf.text(formatCurrency(group.totalPayoutCents), payoutX, rowY, { align: 'right' });
  pdf.setLineWidth(0.8);
  pdf.line(x, rowY + 6, x + columnWidth, rowY + 6);
  rowY += 17;
  pdf.text('Remainder', x + 4, rowY);
  pdf.text(formatCurrency(group.remainderCents), payoutX, rowY, { align: 'right' });
  return rowY + 6;
};

const fitText = (pdf: jsPDF, value: string, maxWidth: number) => {
  if (pdf.getTextWidth(value) <= maxWidth) {
    return value;
  }

  let fitted = value;
  while (fitted.length > 1 && pdf.getTextWidth(`${fitted}...`) > maxWidth) {
    fitted = fitted.slice(0, -1);
  }
  return `${fitted}...`;
};

const formatHours = (hours: number) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(hours);

const formatReportDate = (value: string) => {
  if (!value) {
    return '';
  }

  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
};
