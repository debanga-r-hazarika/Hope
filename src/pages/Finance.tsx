import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, ArrowRight, RefreshCcw, ShieldCheck } from 'lucide-react';
import { fetchFinanceSummary } from '../lib/finance';
import type { AccessLevel } from '../types/access';

interface FinanceProps {
  onNavigateToSection: (section: 'contributions' | 'income' | 'expenses') => void;
  accessLevel: AccessLevel;
}

export function Finance({ onNavigateToSection, accessLevel }: FinanceProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    totalContributions: 0,
    totalIncome: 0,
    totalExpenses: 0,
    contributionsCount: 0,
    incomeCount: 0,
    expensesCount: 0,
  });

  const loadSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFinanceSummary();
      setSummary({
        totalContributions: data.contributions.totalAmount,
        totalIncome: data.income.totalAmount,
        totalExpenses: data.expenses.totalAmount,
        contributionsCount: data.contributions.count,
        incomeCount: data.income.count,
        expensesCount: data.expenses.count,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load finance summary';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSummary();
  }, []);

  if (accessLevel === 'no-access') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-700">
        You do not have access to the Finance module. Please contact an administrator.
      </div>
    );
  }

  const netBalance = summary.totalIncome - summary.totalExpenses + summary.totalContributions;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const stats: Array<{
    title: string;
    value: string;
    count: string;
    icon: typeof DollarSign;
    color: 'blue' | 'green' | 'red';
    section: 'contributions' | 'income' | 'expenses';
  }> = [
    {
      title: 'Total Contributions & Investment',
      value: formatCurrency(summary.totalContributions),
      count: `${summary.contributionsCount} entries`,
      icon: DollarSign,
      color: 'blue',
      section: 'contributions' as const,
    },
    {
      title: 'Total Income',
      value: formatCurrency(summary.totalIncome),
      count: `${summary.incomeCount} entries`,
      icon: TrendingUp,
      color: 'green',
      section: 'income' as const,
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(summary.totalExpenses),
      count: `${summary.expensesCount} entries`,
      icon: TrendingDown,
      color: 'red',
      section: 'expenses' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Overview of contributions, income, and expenses
        </p>
        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">
          <ShieldCheck className="w-4 h-4" />
          {accessLevel === 'read-write' ? 'Read & Write' : 'Read Only'}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => void loadSummary()}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={loading}
          >
            <RefreshCcw className="w-4 h-4" />
            {loading ? 'Refreshing...' : 'Refresh totals'}
          </button>
          {error && (
            <span className="text-sm text-red-600">
              {error}
            </span>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm font-medium">Net Balance</p>
            <h2 className="text-4xl font-bold mt-2">{formatCurrency(netBalance)}</h2>
            <p className="text-blue-100 mt-2">
              Current financial position
            </p>
          </div>
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <DollarSign className="w-10 h-10" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'bg-blue-50 text-blue-600 border-blue-200',
            green: 'bg-green-50 text-green-600 border-green-200',
            red: 'bg-red-50 text-red-600 border-red-200',
          };

          return (
            <div
              key={stat.title}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${colorClasses[stat.color]} flex items-center justify-center border`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>

              <h3 className="text-sm font-medium text-gray-600 mb-2">
                {stat.title}
              </h3>

              <p className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </p>

              <p className="text-sm text-gray-500 mb-4">
                {stat.count}
              </p>

              <button
                onClick={() => onNavigateToSection(stat.section)}
                className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                View Details
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Stats
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Average Income per Entry</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(summary.incomeCount ? summary.totalIncome / summary.incomeCount : 0)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Average Expense per Entry</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(summary.expensesCount ? summary.totalExpenses / summary.expensesCount : 0)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Income vs Expenses Ratio</span>
              <span className="text-sm font-semibold text-green-600">
                {summary.totalExpenses > 0
                  ? ((summary.totalIncome / summary.totalExpenses) * 100).toFixed(0)
                  : '0'
                }%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Financial Health
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Operating Margin</span>
                <span className="text-sm font-semibold text-gray-900">
                  {summary.totalIncome > 0
                    ? (((summary.totalIncome - summary.totalExpenses) / summary.totalIncome) * 100).toFixed(1)
                    : '0.0'
                  }%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${
                      summary.totalIncome > 0
                        ? ((summary.totalIncome - summary.totalExpenses) / summary.totalIncome) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600 mb-2">Status</p>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-sm font-medium text-gray-900">Healthy Financial Position</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
