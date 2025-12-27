import { supabase } from './supabase';
import type { ContributionEntry, IncomeEntry, ExpenseEntry } from '../types/finance';

export interface FinanceSummary {
  totalContributions: number;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
}

export interface RecentTransaction {
  id: string;
  type: 'contribution' | 'income' | 'expense';
  amount: number;
  reason: string;
  paymentDate: string;
  category?: string;
}

export async function fetchFinanceSummary(): Promise<FinanceSummary> {
  const [contributions, income, expenses] = await Promise.all([
    supabase.from('contributions').select('amount'),
    supabase.from('income').select('amount'),
    supabase.from('expenses').select('amount'),
  ]);

  const totalContributions = contributions.data?.reduce((sum, c) => sum + c.amount, 0) || 0;
  const totalIncome = income.data?.reduce((sum, i) => sum + i.amount, 0) || 0;
  const totalExpenses = expenses.data?.reduce((sum, e) => sum + e.amount, 0) || 0;

  return {
    totalContributions,
    totalIncome,
    totalExpenses,
    netBalance: totalContributions + totalIncome - totalExpenses,
  };
}

export async function fetchRecentTransactions(limit = 10): Promise<RecentTransaction[]> {
  const [contributions, income, expenses] = await Promise.all([
    supabase
      .from('contributions')
      .select('id, amount, reason, payment_date, contribution_type')
      .order('payment_date', { ascending: false })
      .limit(limit),
    supabase
      .from('income')
      .select('id, amount, reason, payment_date, income_type')
      .order('payment_date', { ascending: false })
      .limit(limit),
    supabase
      .from('expenses')
      .select('id, amount, reason, payment_date, expense_type')
      .order('payment_date', { ascending: false })
      .limit(limit),
  ]);

  const transactions: RecentTransaction[] = [
    ...(contributions.data || []).map(c => ({
      id: c.id,
      type: 'contribution' as const,
      amount: c.amount,
      reason: c.reason,
      paymentDate: c.payment_date,
      category: c.contribution_type,
    })),
    ...(income.data || []).map(i => ({
      id: i.id,
      type: 'income' as const,
      amount: i.amount,
      reason: i.reason,
      paymentDate: i.payment_date,
      category: i.income_type,
    })),
    ...(expenses.data || []).map(e => ({
      id: e.id,
      type: 'expense' as const,
      amount: e.amount,
      reason: e.reason,
      paymentDate: e.payment_date,
      category: e.expense_type,
    })),
  ];

  return transactions
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
    .slice(0, limit);
}

export async function searchTransactions(query: string): Promise<RecentTransaction[]> {
  const [contributions, income, expenses] = await Promise.all([
    supabase
      .from('contributions')
      .select('id, amount, reason, payment_date, contribution_type')
      .ilike('reason', `%${query}%`)
      .order('payment_date', { ascending: false }),
    supabase
      .from('income')
      .select('id, amount, reason, payment_date, income_type')
      .ilike('reason', `%${query}%`)
      .order('payment_date', { ascending: false }),
    supabase
      .from('expenses')
      .select('id, amount, reason, payment_date, expense_type')
      .ilike('reason', `%${query}%`)
      .order('payment_date', { ascending: false }),
  ]);

  const transactions: RecentTransaction[] = [
    ...(contributions.data || []).map(c => ({
      id: c.id,
      type: 'contribution' as const,
      amount: c.amount,
      reason: c.reason,
      paymentDate: c.payment_date,
      category: c.contribution_type,
    })),
    ...(income.data || []).map(i => ({
      id: i.id,
      type: 'income' as const,
      amount: i.amount,
      reason: i.reason,
      paymentDate: i.payment_date,
      category: i.income_type,
    })),
    ...(expenses.data || []).map(e => ({
      id: e.id,
      type: 'expense' as const,
      amount: e.amount,
      reason: e.reason,
      paymentDate: e.payment_date,
      category: e.expense_type,
    })),
  ];

  return transactions.sort(
    (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
  );
}

export async function fetchContributions(): Promise<ContributionEntry[]> {
  const { data, error } = await supabase
    .from('contributions')
    .select('*')
    .order('payment_date', { ascending: false });

  if (error) throw error;

  return (data || []).map(row => ({
    id: row.id,
    amount: row.amount,
    reason: row.reason,
    transactionId: row.transaction_id,
    paymentTo: row.payment_to,
    paidToUser: row.paid_to_user,
    paymentDate: row.payment_date,
    paymentMethod: row.payment_method,
    bankReference: row.bank_reference,
    evidenceUrl: row.evidence_url,
    description: row.description,
    category: row.contribution_type,
    contributionType: row.contribution_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    recordedBy: row.recorded_by,
  }));
}

export async function createContribution(data: Partial<ContributionEntry>): Promise<ContributionEntry> {
  const { data: result, error } = await supabase
    .from('contributions')
    .insert({
      amount: data.amount,
      reason: data.reason,
      transaction_id: data.transactionId,
      payment_to: data.paymentTo,
      paid_to_user: data.paidToUser,
      payment_date: data.paymentDate,
      payment_method: data.paymentMethod,
      bank_reference: data.bankReference,
      evidence_url: data.evidenceUrl,
      description: data.description,
      contribution_type: data.contributionType,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: result.id,
    amount: result.amount,
    reason: result.reason,
    transactionId: result.transaction_id,
    paymentTo: result.payment_to,
    paidToUser: result.paid_to_user,
    paymentDate: result.payment_date,
    paymentMethod: result.payment_method,
    bankReference: result.bank_reference,
    evidenceUrl: result.evidence_url,
    description: result.description,
    category: result.contribution_type,
    contributionType: result.contribution_type,
    createdAt: result.created_at,
    updatedAt: result.updated_at,
    recordedBy: result.recorded_by,
  };
}

export async function updateContribution(id: string, data: Partial<ContributionEntry>): Promise<ContributionEntry> {
  const updateData: Record<string, unknown> = {};

  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.reason !== undefined) updateData.reason = data.reason;
  if (data.transactionId !== undefined) updateData.transaction_id = data.transactionId;
  if (data.paymentTo !== undefined) updateData.payment_to = data.paymentTo;
  if (data.paidToUser !== undefined) updateData.paid_to_user = data.paidToUser;
  if (data.paymentDate !== undefined) updateData.payment_date = data.paymentDate;
  if (data.paymentMethod !== undefined) updateData.payment_method = data.paymentMethod;
  if (data.bankReference !== undefined) updateData.bank_reference = data.bankReference;
  if (data.evidenceUrl !== undefined) updateData.evidence_url = data.evidenceUrl;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.contributionType !== undefined) updateData.contribution_type = data.contributionType;

  const { data: result, error } = await supabase
    .from('contributions')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return {
    id: result.id,
    amount: result.amount,
    reason: result.reason,
    transactionId: result.transaction_id,
    paymentTo: result.payment_to,
    paidToUser: result.paid_to_user,
    paymentDate: result.payment_date,
    paymentMethod: result.payment_method,
    bankReference: result.bank_reference,
    evidenceUrl: result.evidence_url,
    description: result.description,
    category: result.contribution_type,
    contributionType: result.contribution_type,
    createdAt: result.created_at,
    updatedAt: result.updated_at,
    recordedBy: result.recorded_by,
  };
}

export async function deleteContribution(id: string): Promise<void> {
  const { error } = await supabase.from('contributions').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchIncome(): Promise<IncomeEntry[]> {
  const { data, error } = await supabase
    .from('income')
    .select('*')
    .order('payment_date', { ascending: false });

  if (error) throw error;

  return (data || []).map(row => ({
    id: row.id,
    amount: row.amount,
    reason: row.reason,
    transactionId: row.transaction_id,
    paymentTo: row.payment_to,
    paidToUser: row.paid_to_user,
    paymentDate: row.payment_date,
    paymentMethod: row.payment_method,
    bankReference: row.bank_reference,
    evidenceUrl: row.evidence_url,
    description: row.description,
    category: row.income_type,
    source: row.source,
    incomeType: row.income_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    recordedBy: row.recorded_by,
  }));
}

export async function createIncome(data: Partial<IncomeEntry>): Promise<IncomeEntry> {
  const { data: result, error } = await supabase
    .from('income')
    .insert({
      amount: data.amount,
      reason: data.reason,
      transaction_id: data.transactionId,
      payment_to: data.paymentTo,
      paid_to_user: data.paidToUser,
      payment_date: data.paymentDate,
      payment_method: data.paymentMethod,
      bank_reference: data.bankReference,
      evidence_url: data.evidenceUrl,
      description: data.description,
      source: data.source,
      income_type: data.incomeType,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: result.id,
    amount: result.amount,
    reason: result.reason,
    transactionId: result.transaction_id,
    paymentTo: result.payment_to,
    paidToUser: result.paid_to_user,
    paymentDate: result.payment_date,
    paymentMethod: result.payment_method,
    bankReference: result.bank_reference,
    evidenceUrl: result.evidence_url,
    description: result.description,
    category: result.income_type,
    source: result.source,
    incomeType: result.income_type,
    createdAt: result.created_at,
    updatedAt: result.updated_at,
    recordedBy: result.recorded_by,
  };
}

export async function updateIncome(id: string, data: Partial<IncomeEntry>): Promise<IncomeEntry> {
  const updateData: Record<string, unknown> = {};

  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.reason !== undefined) updateData.reason = data.reason;
  if (data.transactionId !== undefined) updateData.transaction_id = data.transactionId;
  if (data.paymentTo !== undefined) updateData.payment_to = data.paymentTo;
  if (data.paidToUser !== undefined) updateData.paid_to_user = data.paidToUser;
  if (data.paymentDate !== undefined) updateData.payment_date = data.paymentDate;
  if (data.paymentMethod !== undefined) updateData.payment_method = data.paymentMethod;
  if (data.bankReference !== undefined) updateData.bank_reference = data.bankReference;
  if (data.evidenceUrl !== undefined) updateData.evidence_url = data.evidenceUrl;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.source !== undefined) updateData.source = data.source;
  if (data.incomeType !== undefined) updateData.income_type = data.incomeType;

  const { data: result, error } = await supabase
    .from('income')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return {
    id: result.id,
    amount: result.amount,
    reason: result.reason,
    transactionId: result.transaction_id,
    paymentTo: result.payment_to,
    paidToUser: result.paid_to_user,
    paymentDate: result.payment_date,
    paymentMethod: result.payment_method,
    bankReference: result.bank_reference,
    evidenceUrl: result.evidence_url,
    description: result.description,
    category: result.income_type,
    source: result.source,
    incomeType: result.income_type,
    createdAt: result.created_at,
    updatedAt: result.updated_at,
    recordedBy: result.recorded_by,
  };
}

export async function deleteIncome(id: string): Promise<void> {
  const { error } = await supabase.from('income').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchExpenses(): Promise<ExpenseEntry[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('payment_date', { ascending: false });

  if (error) throw error;

  return (data || []).map(row => ({
    id: row.id,
    amount: row.amount,
    reason: row.reason,
    transactionId: row.transaction_id,
    paymentTo: row.payment_to,
    paidToUser: row.paid_to_user,
    paymentDate: row.payment_date,
    paymentMethod: row.payment_method,
    bankReference: row.bank_reference,
    evidenceUrl: row.evidence_url,
    description: row.description,
    category: row.expense_type,
    vendor: row.vendor,
    expenseType: row.expense_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    recordedBy: row.recorded_by,
  }));
}

export async function createExpense(data: Partial<ExpenseEntry>): Promise<ExpenseEntry> {
  const { data: result, error } = await supabase
    .from('expenses')
    .insert({
      amount: data.amount,
      reason: data.reason,
      transaction_id: data.transactionId,
      payment_to: data.paymentTo,
      paid_to_user: data.paidToUser,
      payment_date: data.paymentDate,
      payment_method: data.paymentMethod,
      bank_reference: data.bankReference,
      evidence_url: data.evidenceUrl,
      description: data.description,
      vendor: data.vendor,
      expense_type: data.expenseType,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: result.id,
    amount: result.amount,
    reason: result.reason,
    transactionId: result.transaction_id,
    paymentTo: result.payment_to,
    paidToUser: result.paid_to_user,
    paymentDate: result.payment_date,
    paymentMethod: result.payment_method,
    bankReference: result.bank_reference,
    evidenceUrl: result.evidence_url,
    description: result.description,
    category: result.expense_type,
    vendor: result.vendor,
    expenseType: result.expense_type,
    createdAt: result.created_at,
    updatedAt: result.updated_at,
    recordedBy: result.recorded_by,
  };
}

export async function updateExpense(id: string, data: Partial<ExpenseEntry>): Promise<ExpenseEntry> {
  const updateData: Record<string, unknown> = {};

  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.reason !== undefined) updateData.reason = data.reason;
  if (data.transactionId !== undefined) updateData.transaction_id = data.transactionId;
  if (data.paymentTo !== undefined) updateData.payment_to = data.paymentTo;
  if (data.paidToUser !== undefined) updateData.paid_to_user = data.paidToUser;
  if (data.paymentDate !== undefined) updateData.payment_date = data.paymentDate;
  if (data.paymentMethod !== undefined) updateData.payment_method = data.paymentMethod;
  if (data.bankReference !== undefined) updateData.bank_reference = data.bankReference;
  if (data.evidenceUrl !== undefined) updateData.evidence_url = data.evidenceUrl;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.vendor !== undefined) updateData.vendor = data.vendor;
  if (data.expenseType !== undefined) updateData.expense_type = data.expenseType;

  const { data: result, error } = await supabase
    .from('expenses')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return {
    id: result.id,
    amount: result.amount,
    reason: result.reason,
    transactionId: result.transaction_id,
    paymentTo: result.payment_to,
    paidToUser: result.paid_to_user,
    paymentDate: result.payment_date,
    paymentMethod: result.payment_method,
    bankReference: result.bank_reference,
    evidenceUrl: result.evidence_url,
    description: result.description,
    category: result.expense_type,
    vendor: result.vendor,
    expenseType: result.expense_type,
    createdAt: result.created_at,
    updatedAt: result.updated_at,
    recordedBy: result.recorded_by,
  };
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadEvidence(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `evidence/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('evidence')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('evidence').getPublicUrl(filePath);

  return data.publicUrl;
}

export async function fetchLedgerTransactions(startDate?: string, endDate?: string): Promise<RecentTransaction[]> {
  let contributionsQuery = supabase
    .from('contributions')
    .select('id, amount, reason, payment_date, contribution_type')
    .order('payment_date', { ascending: false });

  let incomeQuery = supabase
    .from('income')
    .select('id, amount, reason, payment_date, income_type')
    .order('payment_date', { ascending: false });

  let expensesQuery = supabase
    .from('expenses')
    .select('id, amount, reason, payment_date, expense_type')
    .order('payment_date', { ascending: false });

  if (startDate) {
    contributionsQuery = contributionsQuery.gte('payment_date', startDate);
    incomeQuery = incomeQuery.gte('payment_date', startDate);
    expensesQuery = expensesQuery.gte('payment_date', startDate);
  }

  if (endDate) {
    contributionsQuery = contributionsQuery.lte('payment_date', endDate);
    incomeQuery = incomeQuery.lte('payment_date', endDate);
    expensesQuery = expensesQuery.lte('payment_date', endDate);
  }

  const [contributions, income, expenses] = await Promise.all([
    contributionsQuery,
    incomeQuery,
    expensesQuery,
  ]);

  const transactions: RecentTransaction[] = [
    ...(contributions.data || []).map(c => ({
      id: c.id,
      type: 'contribution' as const,
      amount: c.amount,
      reason: c.reason,
      paymentDate: c.payment_date,
      category: c.contribution_type,
    })),
    ...(income.data || []).map(i => ({
      id: i.id,
      type: 'income' as const,
      amount: i.amount,
      reason: i.reason,
      paymentDate: i.payment_date,
      category: i.income_type,
    })),
    ...(expenses.data || []).map(e => ({
      id: e.id,
      type: 'expense' as const,
      amount: e.amount,
      reason: e.reason,
      paymentDate: e.payment_date,
      category: e.expense_type,
    })),
  ];

  return transactions.sort(
    (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
  );
}
