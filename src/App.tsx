import { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Alert,
  AppShell,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Grid,
  Group,
  NumberInput,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { AlertTriangle, Plus, Printer, Share2, Trash2 } from 'lucide-react';
import { calculateGroup, centsFromDollars, formatCurrency } from './calculations';
import type { EmployeeRow, GroupKey, GroupResult } from './types';

let fallbackRowId = 0;

const createId = () =>
  globalThis.crypto?.randomUUID?.() ?? `row-${Date.now()}-${fallbackRowId++}`;

const initialBohRows: EmployeeRow[] = [
  { id: createId(), name: 'Emp 1', hours: 3 },
  { id: createId(), name: 'Emp 2', hours: 6 },
];

const initialFohRows: EmployeeRow[] = [
  { id: createId(), name: 'Emp 1', hours: 5 },
  { id: createId(), name: 'Emp 2', hours: 4 },
  { id: createId(), name: 'Emp 3', hours: 6 },
  { id: createId(), name: 'Emp 4', hours: 9 },
];

const today = new Date().toISOString().slice(0, 10);
const appIconSrc = '/apple-touch-icon.png';

const loadAppIcon = async () => {
  try {
    const response = await fetch(appIconSrc);
    return response.ok ? new Uint8Array(await response.arrayBuffer()) : undefined;
  } catch {
    return undefined;
  }
};

function App() {
  const [date, setDate] = useState(today);
  const [totalTips, setTotalTips] = useState(20);
  const [bohPercent, setBohPercent] = useState(10);
  const [fohPercent, setFohPercent] = useState(90);
  const [bohRows, setBohRows] = useState<EmployeeRow[]>(initialBohRows);
  const [fohRows, setFohRows] = useState<EmployeeRow[]>(initialFohRows);
  const [isSharingPdf, setIsSharingPdf] = useState(false);
  const [pdfError, setPdfError] = useState('');

  useEffect(() => {
    void import('./report-pdf');
    void loadAppIcon();
  }, []);

  const totalTipsCents = centsFromDollars(totalTips);
  const percentTotal = bohPercent + fohPercent;
  const hasPercentMismatch = Math.abs(percentTotal - 100) > 0.001;

  const results = useMemo(
    () => [
      calculateGroup({
        key: 'boh',
        label: 'Back of House',
        totalTipsCents,
        percent: bohPercent,
        employees: bohRows,
      }),
      calculateGroup({
        key: 'foh',
        label: 'Front of House',
        totalTipsCents,
        percent: fohPercent,
        employees: fohRows,
      }),
    ],
    [bohPercent, bohRows, fohPercent, fohRows, totalTipsCents],
  );

  const totalPayoutCents = results.reduce((sum, result) => sum + result.totalPayoutCents, 0);
  const totalRemainderCents = results.reduce((sum, result) => sum + result.remainderCents, 0);

  const updateRows = (key: GroupKey, rows: EmployeeRow[]) => {
    if (key === 'boh') {
      setBohRows(rows);
    } else {
      setFohRows(rows);
    }
  };

  const sharePdf = async () => {
    setIsSharingPdf(true);
    setPdfError('');

    try {
      const [{ createTipAllocationPdf }, iconData] = await Promise.all([
        import('./report-pdf'),
        loadAppIcon(),
      ]);
      const { blob, filename } = createTipAllocationPdf({
        date,
        totalTipsCents,
        percentTotal,
        hasPercentMismatch,
        results,
        totalPayoutCents,
        totalRemainderCents,
        iconData,
      });
      const file = new File([blob], filename, { type: 'application/pdf' });
      const shareData = { files: [file], title: 'Tip Allocation Report' };

      if (navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      setPdfError('Unable to create the PDF. Please try again.');
    } finally {
      setIsSharingPdf(false);
    }
  };

  return (
    <AppShell padding={0}>
      <Container size="lg" py="xl" className="app-container">
        <Stack gap="lg" className="screen-layout">
          <Paper className="summary-panel" withBorder radius="sm" p="lg">
            <Group className="app-header" justify="space-between" align="flex-start" gap="lg">
              <Group className="app-title" gap="md" align="center">
                <img className="app-logo" src={appIconSrc} alt="Tip Calculator app icon" />
                <Box>
                  <Title order={1}>Tip Calculator</Title>
                  <Text c="dimmed" mt={4}>
                    Cash tip allocation by employee hours
                  </Text>
                </Box>
              </Group>
              <>
                <Button
                  className="screen-only print-button desktop-print-button"
                  leftSection={<Printer size={18} />}
                  onClick={() => window.print()}
                >
                  Print
                </Button>
                <Button
                  className="screen-only print-button mobile-share-button"
                  leftSection={<Share2 size={18} />}
                  loading={isSharingPdf}
                  onClick={sharePdf}
                >
                  Share PDF
                </Button>
              </>
            </Group>

            <Divider my="lg" />

            <Grid>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <TextInput
                  label="Date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.currentTarget.value)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <NumberInput
                  label="Total Cash Tips"
                  value={totalTips}
                  onChange={(value) => setTotalTips(Number(value) || 0)}
                  prefix="$"
                  hideControls
                  min={0}
                  decimalScale={2}
                  fixedDecimalScale
                  thousandSeparator=","
                />
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 2 }}>
                <NumberInput
                  label="BOH %"
                  value={bohPercent}
                  onChange={(value) => setBohPercent(Number(value) || 0)}
                  hideControls
                  min={0}
                  decimalScale={2}
                  suffix="%"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 2 }}>
                <NumberInput
                  label="FOH %"
                  value={fohPercent}
                  onChange={(value) => setFohPercent(Number(value) || 0)}
                  hideControls
                  min={0}
                  decimalScale={2}
                  suffix="%"
                />
              </Grid.Col>
            </Grid>

            {hasPercentMismatch ? (
              <Alert
                className="print-warning"
                mt="md"
                color="yellow"
                icon={<AlertTriangle size={18} />}
                title="Split percentages do not equal 100%"
              >
                Current total is {percentTotal.toFixed(2)}%. Calculations still use the entered
                percentages.
              </Alert>
            ) : null}

            {pdfError ? (
              <Alert mt="md" color="red" title="PDF export failed">
                {pdfError}
              </Alert>
            ) : null}
          </Paper>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            {results.map((result) => (
              <EmployeeGroup
                key={result.key}
                result={result}
                onRowsChange={(rows) => updateRows(result.key, rows)}
              />
            ))}
          </SimpleGrid>

          <Paper withBorder radius="sm" p="lg" className="totals-panel">
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              <SummaryMetric label="Total Cash Tips" value={formatCurrency(totalTipsCents)} />
              <SummaryMetric label="Rounded Payouts" value={formatCurrency(totalPayoutCents)} />
              <SummaryMetric label="Unallocated Remainder" value={formatCurrency(totalRemainderCents)} />
            </SimpleGrid>
          </Paper>
        </Stack>
        <PrintReport
          date={date}
          totalTipsCents={totalTipsCents}
          percentTotal={percentTotal}
          hasPercentMismatch={hasPercentMismatch}
          results={results}
          totalPayoutCents={totalPayoutCents}
          totalRemainderCents={totalRemainderCents}
        />
      </Container>
    </AppShell>
  );
}

function EmployeeGroup({
  result,
  onRowsChange,
}: {
  result: GroupResult;
  onRowsChange: (rows: EmployeeRow[]) => void;
}) {
  const updateRow = (id: string, patch: Partial<EmployeeRow>) => {
    onRowsChange(result.rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const addRow = () => {
    onRowsChange([...result.rows, { id: createId(), name: '', hours: 0 }]);
  };

  const removeRow = (id: string) => {
    if (result.rows.length === 1) {
      onRowsChange([{ id: createId(), name: '', hours: 0 }]);
      return;
    }

    onRowsChange(result.rows.filter((row) => row.id !== id));
  };

  return (
    <Paper withBorder radius="sm" p="lg" className="group-panel">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <Box>
            <Group gap="xs">
              <Title order={2}>{result.label}</Title>
              <Badge variant="light">{result.percent}%</Badge>
            </Group>
            <Text c="dimmed" size="sm">
              Pool {formatCurrency(result.poolCents)} | Hours {formatHours(result.totalHours)}
            </Text>
          </Box>
          <Button className="screen-only" leftSection={<Plus size={16} />} variant="light" onClick={addRow}>
            Add row
          </Button>
        </Group>

        <Table className="tips-table" verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Employee</Table.Th>
              <Table.Th className="hours-column">Hours</Table.Th>
              <Table.Th className="money-column">Tips</Table.Th>
              <Table.Th className="screen-only action-column" aria-label="Actions" />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {result.rows.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>
                  <TextInput
                    aria-label={`${result.label} employee name`}
                    value={row.name}
                    placeholder="Employee name"
                    onChange={(event) => updateRow(row.id, { name: event.currentTarget.value })}
                  />
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    aria-label={`${result.label} hours for ${row.name || 'employee'}`}
                    value={row.hours}
                    onChange={(value) => updateRow(row.id, { hours: Number(value) || 0 })}
                    hideControls
                    min={0}
                    decimalScale={2}
                  />
                </Table.Td>
                <Table.Td className="money-column payout-cell">{formatCurrency(row.payoutCents)}</Table.Td>
                <Table.Td className="screen-only action-column">
                  <ActionIcon
                    aria-label={`Remove ${row.name || 'employee row'}`}
                    size={40}
                    variant="subtle"
                    color="red"
                    onClick={() => removeRow(row.id)}
                  >
                    <Trash2 size={18} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        <Flex justify="space-between" gap="md" className="group-totals">
          <SummaryMetric label="Remainder" value={formatCurrency(result.remainderCents)} />
          <SummaryMetric label="Rounded payouts" value={formatCurrency(result.totalPayoutCents)} />
        </Flex>
      </Stack>
    </Paper>
  );
}

function PrintReport({
  date,
  totalTipsCents,
  percentTotal,
  hasPercentMismatch,
  results,
  totalPayoutCents,
  totalRemainderCents,
}: {
  date: string;
  totalTipsCents: number;
  percentTotal: number;
  hasPercentMismatch: boolean;
  results: GroupResult[];
  totalPayoutCents: number;
  totalRemainderCents: number;
}) {
  return (
    <section className="print-report" aria-label="Printable tip allocation report">
      <header className="report-header">
        <div className="report-brand">
          <img src={appIconSrc} alt="Tip Calculator app icon" />
          <div>
            <h1>Tip Allocation Report</h1>
            <p>Cash tips distributed by employee hours</p>
          </div>
        </div>
        <div className="report-date">
          <span>Date</span>
          <strong>{formatReportDate(date)}</strong>
        </div>
      </header>

      <div className="report-summary-grid">
        <ReportMetric label="Total cash tips" value={formatCurrency(totalTipsCents)} />
        <ReportMetric label="Rounded payouts" value={formatCurrency(totalPayoutCents)} />
        <ReportMetric label="Unallocated remainder" value={formatCurrency(totalRemainderCents)} />
        <ReportMetric label="Split total" value={`${percentTotal.toFixed(2)}%`} />
      </div>

      {hasPercentMismatch ? (
        <div className="report-warning">
          Split percentages do not equal 100%. Calculations used the entered percentages.
        </div>
      ) : null}

      <div className="report-groups">
        {results.map((result) => (
          <ReportGroup key={result.key} result={result} />
        ))}
      </div>

      <footer className="report-footer">
        Payouts are rounded down to the nearest nickel. Remainders are not redistributed.
      </footer>
    </section>
  );
}

function ReportGroup({ result }: { result: GroupResult }) {
  const reportRows = result.rows.filter((row) => row.name.trim() !== '' || row.hours > 0);

  return (
    <section className="report-group">
      <div className="report-group-heading">
        <h2>{result.label}</h2>
        <div>
          <span>{result.percent}%</span>
          <span>{formatCurrency(result.poolCents)}</span>
          <span>{formatHours(result.totalHours)} hrs</span>
        </div>
      </div>

      <table className="report-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Hours</th>
            <th>Rounded payout</th>
          </tr>
        </thead>
        <tbody>
          {reportRows.length > 0 ? (
            reportRows.map((row) => (
              <tr key={row.id}>
                <td>{row.name.trim() || 'Unnamed employee'}</td>
                <td>{formatHours(row.hours)}</td>
                <td>{formatCurrency(row.payoutCents)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3}>No employees entered</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr>
            <th>Total</th>
            <th>{formatHours(result.totalHours)}</th>
            <th>{formatCurrency(result.totalPayoutCents)}</th>
          </tr>
          <tr>
            <th colSpan={2}>Remainder</th>
            <th>{formatCurrency(result.remainderCents)}</th>
          </tr>
        </tfoot>
      </table>
    </section>
  );
}

function ReportMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="report-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text size="xs" tt="uppercase" fw={700} c="dimmed">
        {label}
      </Text>
      <Text fw={700} size="lg">
        {value}
      </Text>
    </Box>
  );
}

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

export default App;
