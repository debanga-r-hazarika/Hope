import { supabase } from './supabase';
import type {
  ContributionEntry,
  ExpenseEntry,
  IncomeEntry,
  PaymentMethod,
  PaymentTo,
} from '../types/finance';

type BaseFinanceRow = {
  id: string;
  amount: number | string;
  reason: string;
  transaction_id: string;
  payment_to: PaymentTo;
  paid_to_user?: string | null;
  payment_date: string;
  payment_method: PaymentMethod;
  description?: string | null;
  category?: string | null;
  created_at: string;
  updated_at: string;
  recorded_by?: string | null;
};

type ContributionRow = BaseFinanceRow & {
  contribution_type: ContributionEntry['contributionType'];
};

type IncomeRow = BaseFinanceRow & {
  source: string;
  income_type: IncomeEntry['incomeType'];
};

type ExpenseRow = BaseFinanceRow & {
  vendor?: string | null;
  expense_type: ExpenseEntry['expenseType'];
};

const toNumber = (value: number | string | null | undefined) =>
  typeof value === 'number' ? value : parseFloat(value ?? '0');

const mapBaseRow = (row: BaseFinanceRow) => ({
  id: row.id,
  amount: toNumber(row.amount),
  reason: row.reason,
  transactionId: row.transaction_id,
  paymentTo: row.payment_to,
  paidToUser: row.paid_to_user ?? null,
  paymentDate: row.payment_date,
  paymentMethod: row.payment_method,
  description: row.description ?? null,
  category: row.category ?? null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  recordedBy: row.recorded_by ?? null,
});

const mapContributionRow = (row: ContributionRow): ContributionEntry => ({
  ...mapBaseRow(row),
  contributionType: row.contribution_type,
});

const mapIncomeRow = (row: IncomeRow): IncomeEntry => ({
  ...mapBaseRow(row),
  source: row.source,
  incomeType: row.income_type,
});

const mapExpenseRow = (row: ExpenseRow): ExpenseEntry => ({
  ...mapBaseRow(row),
  vendor: row.vendor ?? undefined,
  expenseType: row.expense_type,
});

const toContributionPayload = (data: Partial<ContributionEntry>) => ({
  amount: data.amount,
  contribution_type: data.contributionType,
  reason: data.reason,
  transaction_id: data.transactionId,
  payment_to: data.paymentTo,
  paid_to_user: data.paymentTo === 'other_bank_account' ? data.paidToUser ?? null : null,
  payment_date: data.paymentDate,
  payment_method: data.paymentMethod,
  description: data.description ?? null,
  category: data.category ?? null,
});

const toIncomePayload = (data: Partial<IncomeEntry>) => ({
  amount: data.amount,
  source: data.source,
  income_type: data.incomeType,
  reason: data.reason,
  transaction_id: data.transactionId,
  payment_to: data.paymentTo,
  paid_to_user: data.paymentTo === 'other_bank_account' ? data.paidToUser ?? null : null,
  payment_date: data.paymentDate,
  payment_method: data.paymentMethod,
  description: data.description ?? null,
  category: data.category ?? null,
});

const toExpensePayload = (data: Partial<ExpenseEntry>) => ({
  amount: data.amount,
  expense_type: data.expenseType,
  vendor: data.vendor ?? null,
  reason: data.reason,
  transaction_id: data.transactionId,
  payment_to: data.paymentTo,
  paid_to_user: data.paymentTo === 'other_bank_account' ? data.paidToUser ?? null : null,
  payment_date: data.paymentDate,
  payment_method: data.paymentMethod,
  description: data.description ?? null,
  category: data.category ?? null,
});

export async function fetchContributions() {
  const { data, error } = await supabase
    .from('contributions')
    .select('*')
    .order('payment_date', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapContributionRow(row as ContributionRow));
}

export async function createContribution(payload: Partial<ContributionEntry>) {
  const { data, error } = await supabase
    .from('contributions')
    .insert(toContributionPayload(payload))
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return mapContributionRow(data as ContributionRow);
}

export async function updateContribution(id: string, payload: Partial<ContributionEntry>) {
  const { data, error } = await supabase
    .from('contributions')
    .update(toContributionPayload(payload))
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return mapContributionRow(data as ContributionRow);
}

export async function deleteContribution(id: string) {
  const { error } = await supabase.from('contributions').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchIncome() {
  const { data, error } = await supabase
    .from('income')
    .select('*')
    .order('payment_date', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapIncomeRow(row as IncomeRow));
}

export async function createIncome(payload: Partial<IncomeEntry>) {
  const { data, error } = await supabase
    .from('income')
    .insert(toIncomePayload(payload))
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return mapIncomeRow(data as IncomeRow);
}

export async function updateIncome(id: string, payload: Partial<IncomeEntry>) {
  const { data, error } = await supabase
    .from('income')
    .update(toIncomePayload(payload))
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return mapIncomeRow(data as IncomeRow);
}

export async function deleteIncome(id: string) {
  const { error } = await supabase.from('income').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchExpenses() {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('payment_date', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapExpenseRow(row as ExpenseRow));
}

export async function createExpense(payload: Partial<ExpenseEntry>) {
  const { data, error } = await supabase
    .from('expenses')
    .insert(toExpensePayload(payload))
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return mapExpenseRow(data as ExpenseRow);
}

export async function updateExpense(id: string, payload: Partial<ExpenseEntry>) {
  const { data, error } = await supabase
    .from('expenses')
    .update(toExpensePayload(payload))
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return mapExpenseRow(data as ExpenseRow);
}

export async function deleteExpense(id: string) {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

const fetchSummaryForTable = async (table: 'contributions' | 'income' | 'expenses') => {
  const { data, error, count } = await supabase
    .from(table)
    .select('amount', { count: 'exact' });

  if (error) throw new Error(error.message);

  const totalAmount = (data ?? []).reduce((sum, row) => sum + toNumber((row as { amount: number | string }).amount), 0);
  return { totalAmount, count: count ?? data?.length ?? 0 };
};

export async function fetchFinanceSummary() {
  const [contributions, income, expenses] = await Promise.all([
    fetchSummaryForTable('contributions'),
    fetchSummaryForTable('income'),
    fetchSummaryForTable('expenses'),
  ]);

  return {
    contributions,
    income,
    expenses,
  };
}

