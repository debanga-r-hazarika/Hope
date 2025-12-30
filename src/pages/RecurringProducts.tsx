import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Package } from 'lucide-react';
import type { AccessLevel } from '../types/access';
import type { RecurringProduct, Supplier } from '../types/operations';
import {
  createRecurringProduct,
  deleteRecurringProduct,
  fetchRecurringProducts,
  fetchSuppliers,
} from '../lib/operations';
import { useModuleAccess } from '../contexts/ModuleAccessContext';

interface RecurringProductsProps {
  accessLevel: AccessLevel;
}

export function RecurringProducts({ accessLevel }: RecurringProductsProps) {
  const { userId } = useModuleAccess();
  const canWrite = accessLevel === 'read-write';
  const [products, setProducts] = useState<RecurringProduct[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    supplier_id: '',
    quantity_received: '',
    unit: '',
    received_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsData, suppliersData] = await Promise.all([
        fetchRecurringProducts(),
        fetchSuppliers(),
      ]);
      setProducts(productsData);
      setSuppliers(suppliersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessLevel === 'no-access') return;
    void loadData();
  }, [accessLevel]);

  const handleSubmit = async () => {
    if (!canWrite || !formData.name || !formData.category || !formData.quantity_received || !formData.unit) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const created = await createRecurringProduct({
        name: formData.name,
        category: formData.category,
        supplier_id: formData.supplier_id || undefined,
        quantity_received: Number(formData.quantity_received),
        unit: formData.unit,
        received_date: formData.received_date,
        notes: formData.notes || undefined,
        created_by: userId,
      });
      setProducts((prev) => [created, ...prev]);
      setShowForm(false);
      setFormData({
        name: '',
        category: '',
        supplier_id: '',
        quantity_received: '',
        unit: '',
        received_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create recurring product');
    }
  };

  const handleDelete = async (id: string) => {
    if (!canWrite || !confirm('Delete this recurring product?')) return;

    try {
      await deleteRecurringProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete recurring product');
    }
  };

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
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recurring Products</h1>
            <p className="text-gray-600">Packaging and consumables inventory</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void loadData()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          {canWrite && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {canWrite && showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Add New Recurring Product</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Plastic Packets"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Packaging, Labels"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier
              </label>
              <select
                value={formData.supplier_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, supplier_id: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Supplier</option>
                {suppliers
                  .filter((s) => s.supplier_type === 'recurring_product' || s.supplier_type === 'multiple')
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity Received
              </label>
              <input
                type="number"
                value={formData.quantity_received}
                onChange={(e) => setFormData((prev) => ({ ...prev, quantity_received: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                placeholder="1000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit of Measure
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                placeholder="pieces, rolls, boxes"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Received Date
              </label>
              <input
                type="date"
                value={formData.received_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, received_date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleSubmit()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Create Product
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Received</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Available</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              {canWrite && <th className="px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={canWrite ? 7 : 6} className="px-4 py-6 text-center text-gray-500">
                  Loading products...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={canWrite ? 7 : 6} className="px-4 py-6 text-center text-gray-500">
                  No recurring products found
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{product.supplier_name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {product.quantity_received} {product.unit}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`font-semibold ${
                        product.quantity_available === 0
                          ? 'text-red-600'
                          : product.quantity_available < product.quantity_received * 0.2
                            ? 'text-amber-600'
                            : 'text-green-600'
                      }`}
                    >
                      {product.quantity_available} {product.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{product.received_date}</td>
                  {canWrite && (
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => void handleDelete(product.id)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
