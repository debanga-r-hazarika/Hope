import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Package } from 'lucide-react';
import type { AccessLevel } from '../types/access';
import type { RawMaterial, Supplier } from '../types/operations';
import {
  createRawMaterial,
  deleteRawMaterial,
  fetchRawMaterials,
  fetchSuppliers,
} from '../lib/operations';
import { useModuleAccess } from '../contexts/ModuleAccessContext';

interface RawMaterialsProps {
  accessLevel: AccessLevel;
}

export function RawMaterials({ accessLevel }: RawMaterialsProps) {
  const { userId } = useModuleAccess();
  const canWrite = accessLevel === 'read-write';
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    supplier_id: '',
    quantity_received: '',
    unit: '',
    received_date: new Date().toISOString().split('T')[0],
    storage_notes: '',
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [materialsData, suppliersData] = await Promise.all([
        fetchRawMaterials(),
        fetchSuppliers(),
      ]);
      setMaterials(materialsData);
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
    if (!canWrite || !formData.name || !formData.quantity_received || !formData.unit) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const created = await createRawMaterial({
        name: formData.name,
        supplier_id: formData.supplier_id || undefined,
        quantity_received: Number(formData.quantity_received),
        unit: formData.unit,
        received_date: formData.received_date,
        storage_notes: formData.storage_notes || undefined,
        created_by: userId,
      });
      setMaterials((prev) => [created, ...prev]);
      setShowForm(false);
      setFormData({
        name: '',
        supplier_id: '',
        quantity_received: '',
        unit: '',
        received_date: new Date().toISOString().split('T')[0],
        storage_notes: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create raw material');
    }
  };

  const handleDelete = async (id: string) => {
    if (!canWrite || !confirm('Delete this raw material lot?')) return;

    try {
      await deleteRawMaterial(id);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete raw material');
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
          <div className="w-12 h-12 rounded-xl bg-green-100 text-green-700 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Raw Materials</h1>
            <p className="text-gray-600">Lot-based inventory tracking</p>
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
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Lot
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
          <h3 className="text-lg font-semibold text-gray-900">Add New Raw Material Lot</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Material Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                placeholder="e.g., Banana"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier
              </label>
              <select
                value={formData.supplier_id}
                onChange={(e) => setFormData((prev) => ({ ...prev, supplier_id: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select Supplier</option>
                {suppliers
                  .filter((s) => s.supplier_type === 'raw_material' || s.supplier_type === 'multiple')
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                placeholder="100"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                placeholder="kg, tons, pieces"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Storage Notes
              </label>
              <input
                type="text"
                value={formData.storage_notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, storage_notes: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                placeholder="Location, temperature, etc."
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
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Create Lot
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lot ID</th>
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
                  Loading materials...
                </td>
              </tr>
            ) : materials.length === 0 ? (
              <tr>
                <td colSpan={canWrite ? 7 : 6} className="px-4 py-6 text-center text-gray-500">
                  No raw materials found
                </td>
              </tr>
            ) : (
              materials.map((material) => (
                <tr key={material.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{material.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 font-mono">{material.lot_id}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{material.supplier_name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {material.quantity_received} {material.unit}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`font-semibold ${
                        material.quantity_available === 0
                          ? 'text-red-600'
                          : material.quantity_available < material.quantity_received * 0.2
                            ? 'text-amber-600'
                            : 'text-green-600'
                      }`}
                    >
                      {material.quantity_available} {material.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{material.received_date}</td>
                  {canWrite && (
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => void handleDelete(material.id)}
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
