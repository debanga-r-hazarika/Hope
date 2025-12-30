import { useEffect, useState } from 'react';
import { RefreshCw, Box } from 'lucide-react';
import type { AccessLevel } from '../types/access';
import type { ProcessedGood } from '../types/operations';
import { fetchProcessedGoods } from '../lib/operations';

interface ProcessedGoodsProps {
  accessLevel: AccessLevel;
}

export function ProcessedGoods({ accessLevel }: ProcessedGoodsProps) {
  const [goods, setGoods] = useState<ProcessedGood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProcessedGoods();
      setGoods(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load processed goods');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessLevel === 'no-access') return;
    void loadData();
  }, [accessLevel]);

  if (accessLevel === 'no-access') {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Operations module is not available</h1>
          <p className="text-gray-600 mt-2">Your account does not have access to this module.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Processed Goods</h1>
            <p className="text-gray-600">Finished goods ready for sale</p>
          </div>
        </div>
        <button
          onClick={() => void loadData()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
        Note: Processed goods are automatically created from approved production batches. Manual entry is not allowed.
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch Reference</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity Available</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Production Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">QA Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  Loading processed goods...
                </td>
              </tr>
            ) : goods.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  No processed goods found
                </td>
              </tr>
            ) : (
              goods.map((good) => (
                <tr key={good.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{good.product_type}</td>
                  <td className="px-4 py-3 font-mono text-sm text-gray-700">{good.batch_reference}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`font-semibold ${
                        good.quantity_available === 0
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}
                    >
                      {good.quantity_available} {good.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{good.production_date}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded">
                      {good.qa_status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="text-2xl font-semibold text-gray-900">{goods.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">In Stock</p>
          <p className="text-2xl font-semibold text-gray-900">
            {goods.filter((g) => g.quantity_available > 0).length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Out of Stock</p>
          <p className="text-2xl font-semibold text-gray-900">
            {goods.filter((g) => g.quantity_available === 0).length}
          </p>
        </div>
      </div>
    </div>
  );
}
