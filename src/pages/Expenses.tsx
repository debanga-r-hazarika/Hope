import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, TrendingDown } from 'lucide-react';
import { ExpenseEntry } from '../types/finance';
import { ExpenseForm } from '../components/ExpenseForm';
import {
  fetchExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../lib/finance';
import { supabase } from '../lib/supabase';
import { useModuleAccess } from '../contexts/ModuleAccessContext';

interface ExpensesProps {
  onBack: () => void;
  hasWriteAccess: boolean;
}

export function Expenses({ onBack, hasWriteAccess }: ExpensesProps) {
  const { userId: currentUserId } = useModuleAccess();
  const [view, setView] = useState<'list' | 'detail' | 'form'>('list');
  const [selectedEntry, setSelectedEntry] = useState<ExpenseEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usersLookup, setUsersLookup] = useState<Record<string, string>>({});

  const loadExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchExpenses();
      setExpenseEntries(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load expenses';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadExpenses();
    void supabase
      .from('users')
      .select('id, full_name')
      .then(({ data }) => {
        const map: Record<string, string> = {};
        (data ?? []).forEach((u) => {
          map[u.id] = (u as { id: string; full_name: string }).full_name;
        });
        setUsersLookup(map);
      });
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleViewDetail = (entry: ExpenseEntry) => {
    setSelectedEntry(entry);
    setView('detail');
  };

  const handleAddNew = () => {
    setSelectedEntry(null);
    setIsEditing(false);
    setView('form');
  };

  const handleEdit = (entry: ExpenseEntry) => {
    setSelectedEntry(entry);
    setIsEditing(true);
    setView('form');
  };

  const handleDelete = async (id: string) => {
    if (!hasWriteAccess) {
      setError('You only have read-only access to Finance.');
      return;
    }
    if (!confirm('Are you sure you want to delete this expense entry?')) return;
    setSaving(true);
    setError(null);
    try {
      await deleteExpense(id);
      setExpenseEntries((prev) => prev.filter((e) => e.id !== id));
      setSelectedEntry(null);
      setView('list');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete expense entry';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (data: Partial<ExpenseEntry>) => {
    if (!hasWriteAccess) {
      setError('You only have read-only access to Finance.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isEditing && selectedEntry) {
        const updated = await updateExpense(selectedEntry.id, data, { currentUserId });
        setExpenseEntries((prev) =>
          prev.map((e) => (e.id === updated.id ? updated : e))
        );
        setSelectedEntry(updated);
      } else {
        const created = await createExpense(data, { currentUserId });
        setExpenseEntries((prev) => [created, ...prev]);
      }
      setView('list');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save expense entry';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const totalAmount = expenseEntries.reduce((sum, e) => sum + e.amount, 0);
  const lookupName = useMemo(() => (userId?: string | null) => {
    if (!userId) return '—';
    return usersLookup[userId] || userId;
  }, [usersLookup]);

  if (view === 'form') {
    return (
      <ExpenseForm
        entry={isEditing ? selectedEntry : null}
        onSave={handleSave}
        onCancel={() => setView(selectedEntry ? 'detail' : 'list')}
      />
    );
  }

  if (view === 'detail' && selectedEntry) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setView('list')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to List
          </button>

          {hasWriteAccess && (
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(selectedEntry)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                    onClick={() => void handleDelete(selectedEntry.id)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    disabled={saving}
              >
                <Trash2 className="w-4 h-4" />
                    {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedEntry.reason}
              </h1>
              <p className="text-gray-600">
                Transaction ID: {selectedEntry.transactionId}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Last modified by: {lookupName(selectedEntry.recordedBy)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-red-600">
                {formatCurrency(selectedEntry.amount)}
              </p>
              <p className="text-sm text-gray-500 mt-1 capitalize">
                {selectedEntry.expenseType}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {selectedEntry.vendor && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Vendor</p>
                  <p className="text-gray-900">{selectedEntry.vendor}</p>
                </div>
              )}

              {selectedEntry.bankReference && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Payment Reference</p>
                  <p className="text-gray-900">{selectedEntry.bankReference}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Payment Date</p>
                <p className="text-gray-900">{formatDate(selectedEntry.paymentDate)}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Payment Method</p>
                <p className="text-gray-900 capitalize">{selectedEntry.paymentMethod.replace('_', ' ')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Payment To</p>
                <p className="text-gray-900 capitalize">
                  {selectedEntry.paymentTo === 'organization_bank'
                    ? 'Organization Bank'
                    : `Other Bank Account - ${lookupName(selectedEntry.paidToUser)}`
                  }
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Created At</p>
                <p className="text-gray-900">{formatDate(selectedEntry.createdAt)}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Last Updated</p>
                <p className="text-gray-900">{formatDate(selectedEntry.updatedAt)}</p>
              </div>
            </div>
          </div>

          {selectedEntry.description && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-500 mb-2">Description</p>
              <p className="text-gray-900">{selectedEntry.description}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Finance Dashboard
        </button>

        {hasWriteAccess && (
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            disabled={saving}
          >
            <Plus className="w-5 h-5" />
            Add Expense
          </button>
        )}
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
        <p className="mt-2 text-gray-600">
          Total: {formatCurrency(totalAmount)} • {expenseEntries.length} entries
        </p>
        {error && (
          <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading expenses...</div>
        ) : expenseEntries.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No expenses recorded yet.</div>
        ) : (
          expenseEntries.map((expense) => (
            <div
              key={expense.id}
              onClick={() => handleViewDetail(expense)}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {expense.reason}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {expense.vendor || 'N/A'} • {formatDate(expense.paymentDate)}
                    </p>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded capitalize">
                        {expense.expenseType}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded capitalize">
                        {expense.paymentMethod.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xl font-bold text-red-600">
                    {formatCurrency(expense.amount)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
