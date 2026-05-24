export type EmployeeRow = {
  id: string;
  name: string;
  hours: number;
};

export type GroupKey = 'boh' | 'foh';

export type GroupResult = {
  key: GroupKey;
  label: string;
  percent: number;
  poolCents: number;
  totalHours: number;
  totalPayoutCents: number;
  remainderCents: number;
  rows: CalculatedEmployeeRow[];
};

export type CalculatedEmployeeRow = EmployeeRow & {
  rawPayoutCents: number;
  payoutCents: number;
};
