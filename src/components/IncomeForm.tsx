import { useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { IncomeEntry, PaymentMethod, PaymentTo } from '../types/finance';

interface IncomeFormProps {
  entry: IncomeEntry | null;
  onSave: (data: Partial<IncomeEntry>) => void;
  onCancel: () => void;
}

const mockUsers = [
  'John Smith',
  'Sarah Johnson',
  'Michael Brown',
  'Emily Davis',
  'David Wilson',
  'Lisa Anderson',
];

export function IncomeForm({ entry, onSave, onCancel }: IncomeFormProps) {
  const [formData, setFormData] = useState({
    amount: entry?.amount || 0,
    reason: entry?.reason || '',
    transactionId: entry?.transactionId || '',
    paymentTo: entry?.paymentTo || 'organization_bank' as PaymentTo,
    paidToUser: entry?.paidToUser || '',
    paymentDate: entry?.paymentDate || new Date().toISOString().split('T')[0],
    paymentMethod: entry?.paymentMethod || 'bank_transfer' as PaymentMethod,
    source: entry?.source || '',
    incomeType: entry?.incomeType || 'sales' as 'sales' | 'service' | 'interest' | 'other',
    description: entry?.description || '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Cancel
        </button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {entry ? 'Edit Income' : 'Add New Income'}
        </h1>
        <p className="mt-2 text-gray-600">
          Fill in the details below to {entry ? 'update' : 'create'} an income entry
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (INR) *
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter amount"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Income Type *
            </label>
            <select
              name="incomeType"
              value={formData.incomeType}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="sales">Sales</option>
              <option value="service">Service</option>
              <option value="interest">Interest</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason / Description *
            </label>
            <input
              type="text"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter reason for income"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source *
            </label>
            <input
              type="text"
              name="source"
              value={formData.source}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Customer, Client, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction ID *
            </label>
            <input
              type="text"
              name="transactionId"
              value={formData.transactionId}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="INC-2024-XXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Date *
            </label>
            <input
              type="date"
              name="paymentDate"
              value={formData.paymentDate}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method *
            </label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="upi">UPI</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="card">Card</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment To *
            </label>
            <select
              name="paymentTo"
              value={formData.paymentTo}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="organization_bank">Organization Bank</option>
              <option value="other_bank_account">Other Bank Account</option>
            </select>
          </div>

          {formData.paymentTo === 'other_bank_account' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paid To User *
              </label>
              <select
                name="paidToUser"
                value={formData.paidToUser}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select user</option>
                {mockUsers.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>
          )}

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any additional details about this income"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Save className="w-5 h-5" />
            {entry ? 'Update' : 'Create'} Income Entry
          </button>
        </div>
      </form>
    </div>
  );
}
