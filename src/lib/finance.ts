import { supabase } from './supabase';
import type { ContributionEntry, IncomeEntry, ExpenseEntry } from '../types/finance';

export interface TransactionListItem {
  id: string;
  transactionId: string;
  amount: number;
  reason: string;
  date: string;
  type: 'income' | 'expense' | 'contribution';
  source?: string;
}

export interface LedgerItem {
  id: string;
  transactionId: string;
  amount: number;
  reason: string;
  date: string;
  type: 'income' | 'expense' | 'contribution';
  table: string;
}

export async function fetchFinanceSummary() {
  const [contributions, ledgerIncome, expenses] = await Promise.all([
    supabase.from('contributions').select('amount'),
    supabase.from('income_combined').select('amount'),
    supabase.from('expenses').select('amount'),
  ]);

  const totalContributions = (contributions.data || []).reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalLedgerIncome = (ledgerIncome.data || []).reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalExpenses = (expenses.data || []).reduce((sum, item) => sum + (item.amount || 0), 0);

  return {
    contributions: {
      totalAmount: totalContributions,
      count: contributions.data?.length || 0,
    },
    ledgerIncome: {
      totalAmount: totalLedgerIncome,
      count: ledgerIncome.data?.length || 0,
    },
    expenses: {
      totalAmount: totalExpenses,
      count: expenses.data?.length || 0,
    },
  };
}

export async function fetchRecentTransactions(limit: number = 10): Promise<TransactionListItem[]> {
  const [incomeResult, expensesResult] = await Promise.all([
    supabase
      .from('income_combined')
      .select('id, transaction_id, amount, reason, payment_at, source')
      .order('payment_at', { ascending: false })
      .limit(limit),
    supabase
      .from('expenses')
      .select('id, transaction_id, amount, reason, payment_at')
      .order('payment_at', { ascending: false })
      .limit(limit),
  ]);

  const income: TransactionListItem[] = (incomeResult.data || []).map((item) => ({
    id: item.id,
    transactionId: item.transaction_id,
    amount: item.amount,
    reason: item.reason,
    date: item.payment_at,
    type: 'income' as const,
    source: item.source,
  }));

  const expenses: TransactionListItem[] = (expensesResult.data || []).map((item) => ({
    id: item.id,
    transactionId: item.transaction_id,
    amount: item.amount,
    reason: item.reason,
    date: item.payment_at,
    type: 'expense' as const,
  }));

  return [...income, ...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

export async function searchTransactions(term: string, limit: number = 15) {
  const searchPattern = `%${term}%`;

  const [contributions, income, expenses] = await Promise.all([
    supabase
      .from('contributions')
      .select('id, transaction_id, amount, reason, payment_at')
      .or(`transaction_id.ilike.${searchPattern},reason.ilike.${searchPattern}`)
      .limit(limit),
    supabase
      .from('income_combined')
      .select('id, transaction_id, amount, reason, payment_at')
      .or(`transaction_id.ilike.${searchPattern},reason.ilike.${searchPattern}`)
      .limit(limit),
    supabase
      .from('expenses')
      .select('id, transaction_id, amount, reason, payment_at')
      .or(`transaction_id.ilike.${searchPattern},reason.ilike.${searchPattern}`)
      .limit(limit),
  ]);

  const results: Array<TransactionListItem & { table: 'income' | 'expenses' | 'contributions' }> = [
    ...(contributions.data || []).map((item) => ({
      id: item.id,
      transactionId: item.transaction_id,
      amount: item.amount,
      reason: item.reason,
      date: item.payment_at,
      type: 'contribution' as const,
      table: 'contributions' as const,
    })),
    ...(income.data || []).map((item) => ({
      id: item.id,
      transactionId: item.transaction_id,
      amount: item.amount,
      reason: item.reason,
      date: item.payment_at,
      type: 'income' as const,
      table: 'income' as const,
    })),
    ...(expenses.data || []).map((item) => ({
      id: item.id,
      transactionId: item.transaction_id,
      amount: item.amount,
      reason: item.reason,
      date: item.payment_at,
      type: 'expense' as const,
      table: 'expenses' as const,
    })),
  ];

  return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function fetchLedgerTransactions(limit: number = 300): Promise<LedgerItem[]> {
  const [contributions, income, expenses] = await Promise.all([
    supabase
      .from('contributions')
      .select('id, transaction_id, amount, reason, payment_at')
      .order('payment_at', { ascending: false })
      .limit(limit),
    supabase
      .from('income_combined')
      .select('id, transaction_id, amount, reason, payment_at')
      .order('payment_at', { ascending: false })
      .limit(limit),
    supabase
      .from('expenses')
      .select('id, transaction_id, amount, reason, payment_at')
      .order('payment_at', { ascending: false })
      .limit(limit),
  ]);

  const ledger: LedgerItem[] = [
    ...(contributions.data || []).map((item) => ({
      id: item.id,
      transactionId: item.transaction_id,
      amount: item.amount,
      reason: item.reason,
      date: item.payment_at,
      type: 'contribution' as const,
      table: 'contributions',
    })),
    ...(income.data || []).map((item) => ({
      id: item.id,
      transactionId: item.transaction_id,
      amount: item.amount,
      reason: item.reason,
      date: item.payment_at,
      type: 'income' as const,
      table: 'income',
    })),
    ...(expenses.data || []).map((item) => ({
      id: item.id,
      transactionId: item.transaction_id,
      amount: item.amount,
      reason: item.reason,
      date: item.payment_at,
      type: 'expense' as const,
      table: 'expenses',
    })),
  ];

  return ledger.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function fetchContributions(sort: string = 'all', paymentMethod: string = 'all') {
  let query = supabase.from('contributions').select('*');

  if (paymentMethod !== 'all') {
    query = query.eq('payment_method', paymentMethod);
  }

  const result = await query;
  return result.data || [];
}

export async function fetchIncome(sort: string = 'all', paymentMethod: string = 'all') {
  let query = supabase.from('income_combined').select('*');

  if (paymentMethod !== 'all') {
    query = query.eq('payment_method', paymentMethod);
  }

  const result = await query;
  return result.data || [];
}

export async function fetchExpenses(sort: string = 'all', paymentMethod: string = 'all') {
  let query = supabase.from('expenses').select('*');

  if (paymentMethod !== 'all') {
    query = query.eq('payment_method', paymentMethod);
  }

  const result = await query;
  return result.data || [];
}

export async function createContribution(contribution: Partial<ContributionEntry>): Promise<ContributionEntry> {
  const { data, error } = await supabase
    .from('contributions')
    .insert([contribution])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateContribution(id: string, updates: Partial<ContributionEntry>): Promise<ContributionEntry> {
  const { data, error } = await supabase
    .from('contributions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteContribution(id: string): Promise<void> {
  const { error } = await supabase
    .from('contributions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function createIncome(income: Partial<IncomeEntry>): Promise<IncomeEntry> {
  const { data, error } = await supabase
    .from('income')
    .insert([income])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateIncome(id: string, updates: Partial<IncomeEntry>): Promise<IncomeEntry> {
  const { data, error } = await supabase
    .from('income')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteIncome(id: string): Promise<void> {
  const { error } = await supabase
    .from('income')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function createExpense(expense: Partial<ExpenseEntry>): Promise<ExpenseEntry> {
  const { data, error } = await supabase
    .from('expenses')
    .insert([expense])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateExpense(id: string, updates: Partial<ExpenseEntry>): Promise<ExpenseEntry> {
  const { data, error} = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function uploadEvidence(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `evidence/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('finance-evidence')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('finance-evidence')
    .getPublicUrl(filePath);

  return data.publicUrl;
}
