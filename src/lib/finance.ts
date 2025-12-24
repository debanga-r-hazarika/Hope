const evidenceBucket = 'evidence';

export async function uploadEvidence(file: File, category: 'contributions' | 'income' | 'expenses') {
  const ext = file.name.split('.').pop() || 'dat';
  const path = `${category}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const { data, error } = await supabase.storage.from(evidenceBucket).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) {
    throw new Error(`Failed to upload evidence: ${error.message}`);
  }
  const { data: publicData } = supabase.storage.from(evidenceBucket).getPublicUrl(data.path);
  return publicData.publicUrl;
}
import { supabase } from './supabase';
import type {
  ContributionEntry,
  ExpenseEntry,
  IncomeEntry,
  PaymentMethod,
  PaymentTo,
} from '../types/finance';

type TxPrefix = 'INC' | 'EXP';

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
  evidence_url?: string | null;
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

const parseSequence = (transactionId: string, prefix: TxPrefix) => {
  const match = transactionId?.match(new RegExp(`^TXN-${prefix}-(\\d+)$`));
  return match ? Number(match[1]) : 0;
};

const fetchMaxSequence = async (tables: Array<'contributions' | 'income' | 'expenses'>, prefix: TxPrefix) => {
  const requests = tables.map(async (table) => {
    const { data, error } = await supabase
      .from(table)
      .select('transaction_id')
      .ilike('transaction_id', `TXN-${prefix}-%`)
      .order('transaction_id', { ascending: false })
      .limit(1);
    if (error) {
      return 0;
    }
    const row = data?.[0] as { transaction_id?: string } | undefined;
    return row?.transaction_id ? parseSequence(row.transaction_id, prefix) : 0;
  });

  const results = await Promise.all(requests);
  return Math.max(0, ...results);
};

const generateTransactionId = async (prefix: TxPrefix, tables: Array<'contributions' | 'income' | 'expenses'>) => {
  const currentMax = await fetchMaxSequence(tables, prefix);
  const next = currentMax + 1;
  return `TXN-${prefix}-${String(next).padStart(3, '0')}`;
};

const mapBaseRow = (row: BaseFinanceRow) => ({
  id: row.id,
  amount: toNumber(row.amount),
  reason: row.reason,
  transactionId: row.transaction_id,
  paymentTo: row.payment_to,
  paidToUser: row.paid_to_user ?? null,
  paymentDate: row.payment_date,
  paymentMethod: row.payment_method,
  bankReference: (row as { bank_reference?: string | null }).bank_reference ?? null,
  evidenceUrl: row.evidence_url ?? null,
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
  bank_reference: data.bankReference ?? null,
  evidence_url: data.evidenceUrl ?? null,
  description: data.description ?? null,
  category: data.category ?? null,
  recorded_by: data.recordedBy ?? null,
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
  bank_reference: data.bankReference ?? null,
  evidence_url: data.evidenceUrl ?? null,
  description: data.description ?? null,
  category: data.category ?? null,
  recorded_by: data.recordedBy ?? null,
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
  bank_reference: data.bankReference ?? null,
  evidence_url: data.evidenceUrl ?? null,
  description: data.description ?? null,
  category: data.category ?? null,
  recorded_by: data.recordedBy ?? null,
});

export async function fetchContributions() {
  const { data, error } = await supabase
    .from('contributions')
    .select('*')
    .order('payment_date', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapContributionRow(row as ContributionRow));
}

export async function createContribution(
  payload: Partial<ContributionEntry>,
  options?: { mirrorToIncome?: boolean; currentUserId?: string | null }
) {
  const transactionId = payload.transactionId || await generateTransactionId('INC', ['contributions', 'income']);

  const { data, error } = await supabase
    .from('contributions')
    .insert(toContributionPayload({ ...payload, transactionId, recordedBy: options?.currentUserId ?? undefined }))
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  const contribution = mapContributionRow(data as ContributionRow);

  const shouldMirror = options?.mirrorToIncome !== false;
  if (shouldMirror) {
    const incomePayload: Partial<IncomeEntry> = {
      amount: contribution.amount,
      reason: contribution.reason,
      transactionId,
      paymentTo: contribution.paymentTo,
      paidToUser: contribution.paidToUser ?? undefined,
      paymentDate: contribution.paymentDate,
      paymentMethod: contribution.paymentMethod,
      bankReference: contribution.bankReference ?? null,
      evidenceUrl: contribution.evidenceUrl ?? null,
      description: contribution.description ?? `Generated from contribution ${transactionId}`,
      source: 'Contribution',
      incomeType: 'other',
      category: contribution.category ?? null,
    };
    await createIncome(incomePayload, { currentUserId: options?.currentUserId ?? null });
  }

  return contribution;
}

export async function updateContribution(
  id: string,
  payload: Partial<ContributionEntry>,
  options?: { currentUserId?: string | null }
) {
  const { data, error } = await supabase
    .from('contributions')
    .update(toContributionPayload({ ...payload, recordedBy: options?.currentUserId ?? undefined }))
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

export async function createIncome(
  payload: Partial<IncomeEntry>,
  options?: { currentUserId?: string | null }
) {
  const transactionId = payload.transactionId || await generateTransactionId('INC', ['income', 'contributions']);

  const { data, error } = await supabase
    .from('income')
    .insert(toIncomePayload({ ...payload, transactionId, recordedBy: options?.currentUserId ?? undefined }))
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return mapIncomeRow(data as IncomeRow);
}

export async function updateIncome(
  id: string,
  payload: Partial<IncomeEntry>,
  options?: { currentUserId?: string | null }
) {
  const { data, error } = await supabase
    .from('income')
    .update(toIncomePayload({ ...payload, recordedBy: options?.currentUserId ?? undefined }))
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

export async function createExpense(
  payload: Partial<ExpenseEntry>,
  options?: { currentUserId?: string | null }
) {
  const transactionId = payload.transactionId || await generateTransactionId('EXP', ['expenses']);

  const { data, error } = await supabase
    .from('expenses')
    .insert(toExpensePayload({ ...payload, transactionId, recordedBy: options?.currentUserId ?? undefined }))
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return mapExpenseRow(data as ExpenseRow);
}

export async function updateExpense(
  id: string,
  payload: Partial<ExpenseEntry>,
  options?: { currentUserId?: string | null }
) {
  const { data, error } = await supabase
    .from('expenses')
    .update(toExpensePayload({ ...payload, recordedBy: options?.currentUserId ?? undefined }))
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

