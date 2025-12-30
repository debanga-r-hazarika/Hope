import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Factory, Check, X } from 'lucide-react';
import type { AccessLevel } from '../types/access';
import type { ProductionBatch, RawMaterial, RecurringProduct } from '../types/operations';
import {
  approveBatch,
  createProductionBatch,
  deleteProductionBatch,
  fetchProductionBatches,
  fetchRawMaterials,
  fetchRecurringProducts,
  fetchBatchRawMaterials,
  fetchBatchRecurringProducts,
  updateProductionBatch,
} from '../lib/operations';
import { useModuleAccess } from '../contexts/ModuleAccessContext';

interface ProductionProps {
  accessLevel: AccessLevel;
}

export function Production({ accessLevel }: ProductionProps) {
  const { userId, userEmail } = useModuleAccess();
  const canWrite = accessLevel === 'read-write';
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [recurringProducts, setRecurringProducts] = useState<RecurringProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [formData, setFormData] = useState({
    batch_date: new Date().toISOString().split('T')[0],
    output_product_type: '',
    output_quantity: '',
    output_unit: '',
    notes: '',
  });
  const [selectedRawMaterials, setSelectedRawMaterials] = useState<Array<{ raw_material_id: string; quantity_consumed: number }>>([]);
  const [selectedRecurringProducts, setSelectedRecurringProducts] = useState<Array<{ recurring_product_id: string; quantity_consumed: number }>>([]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [batchesData, rawMaterialsData, recurringProductsData] = await Promise.all([
        fetchProductionBatches(),
        fetchRawMaterials(),
        fetchRecurringProducts(),
      ]);
      setBatches(batchesData);
      setRawMaterials(rawMaterialsData.filter(rm => rm.quantity_available > 0));
      setRecurringProducts(recurringProductsData.filter(rp => rp.quantity_available > 0));
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
    if (!canWrite) return;

    if (selectedRawMaterials.length === 0) {
      setError('At least one raw material must be selected');
      return;
    }

    if (!formData.output_product_type || !formData.output_quantity || !formData.output_unit) {
      setError('Please fill in all output fields');
      return;
    }

    try {
      const created = await createProductionBatch(
        {
          batch_date: formData.batch_date,
          responsible_user_id: userId,
          responsible_user_name: userEmail || undefined,
          output_product_type: formData.output_product_type,
          output_quantity: Number(formData.output_quantity),
          output_unit: formData.output_unit,
          qa_status: 'pending',
          notes: formData.notes || undefined,
          created_by: userId,
        },
        selectedRawMaterials,
        selectedRecurringProducts
      );
      setBatches((prev) => [created, ...prev]);
      setShowForm(false);
      setFormStep(1);
      setFormData({
        batch_date: new Date().toISOString().split('T')[0],
        output_product_type: '',
        output_quantity: '',
        output_unit: '',
        notes: '',
      });
      setSelectedRawMaterials([]);
      setSelectedRecurringProducts([]);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create batch');
    }
  };

  const handleApprove = async (batchId: string) => {
    if (!canWrite || !confirm('Approve this batch? This will lock it and generate processed goods.')) return;

    try {
      await approveBatch(batchId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve batch');
    }
  };

  const handleReject = async (batchId: string) => {
    if (!canWrite || !confirm('Reject this batch?')) return;

    try {
      await updateProductionBatch(batchId, { qa_status: 'rejected' });
      setBatches((prev) => prev.map((b) => (b.id === batchId ? { ...b, qa_status: 'rejected' as const } : b)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject batch');
    }
  };

  const handleDelete = async (id: string) => {
    if (!canWrite || !confirm('Delete this batch?')) return;

    try {
      await deleteProductionBatch(id);
      setBatches((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete batch');
    }
  };

  const addRawMaterial = (materialId: string) => {
    if (selectedRawMaterials.some((rm) => rm.raw_material_id === materialId)) return;
    setSelectedRawMaterials((prev) => [...prev, { raw_material_id: materialId, quantity_consumed: 0 }]);
  };

  const updateRawMaterialQuantity = (materialId: string, quantity: number) => {
    setSelectedRawMaterials((prev) =>
      prev.map((rm) => (rm.raw_material_id === materialId ? { ...rm, quantity_consumed: quantity } : rm))
    );
  };

  const removeRawMaterial = (materialId: string) => {
    setSelectedRawMaterials((prev) => prev.filter((rm) => rm.raw_material_id !== materialId));
  };

  const addRecurringProduct = (productId: string) => {
    if (selectedRecurringProducts.some((rp) => rp.recurring_product_id === productId)) return;
    setSelectedRecurringProducts((prev) => [...prev, { recurring_product_id: productId, quantity_consumed: 0 }]);
  };

  const updateRecurringProductQuantity = (productId: string, quantity: number) => {
    setSelectedRecurringProducts((prev) =>
      prev.map((rp) => (rp.recurring_product_id === productId ? { ...rp, quantity_consumed: quantity } : rp))
    );
  };

  const removeRecurringProduct = (productId: string) => {
    setSelectedRecurringProducts((prev) => prev.filter((rp) => rp.recurring_product_id !== productId));
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
          <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
            <Factory className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Production Batches</h1>
            <p className="text-gray-600">Manage production workflow</p>
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
              onClick={() => {
                setShowForm(!showForm);
                setFormStep(1);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Batch
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
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Create Production Batch</h3>
            <div className="text-sm text-gray-600">Step {formStep} of 3</div>
          </div>

          {formStep === 1 && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Select Raw Materials</h4>
              <div className="space-y-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) addRawMaterial(e.target.value);
                    e.target.value = '';
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Add raw material...</option>
                  {rawMaterials
                    .filter((rm) => !selectedRawMaterials.some((srm) => srm.raw_material_id === rm.id))
                    .map((rm) => (
                      <option key={rm.id} value={rm.id}>
                        {rm.name} (Lot: {rm.lot_id}) - Available: {rm.quantity_available} {rm.unit}
                      </option>
                    ))}
                </select>
                {selectedRawMaterials.map((srm) => {
                  const material = rawMaterials.find((rm) => rm.id === srm.raw_material_id);
                  if (!material) return null;
                  return (
                    <div key={srm.raw_material_id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{material.name}</div>
                        <div className="text-sm text-gray-600">
                          Lot: {material.lot_id} | Available: {material.quantity_available} {material.unit}
                        </div>
                      </div>
                      <input
                        type="number"
                        value={srm.quantity_consumed || ''}
                        onChange={(e) => updateRawMaterialQuantity(srm.raw_material_id, Number(e.target.value))}
                        className="w-24 border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="Qty"
                      />
                      <button
                        onClick={() => removeRawMaterial(srm.raw_material_id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedRawMaterials.length === 0) {
                      setError('Please select at least one raw material');
                      return;
                    }
                    setError(null);
                    setFormStep(2);
                  }}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {formStep === 2 && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Select Recurring Products (Optional)</h4>
              <div className="space-y-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) addRecurringProduct(e.target.value);
                    e.target.value = '';
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Add recurring product...</option>
                  {recurringProducts
                    .filter((rp) => !selectedRecurringProducts.some((srp) => srp.recurring_product_id === rp.id))
                    .map((rp) => (
                      <option key={rp.id} value={rp.id}>
                        {rp.name} - Available: {rp.quantity_available} {rp.unit}
                      </option>
                    ))}
                </select>
                {selectedRecurringProducts.map((srp) => {
                  const product = recurringProducts.find((rp) => rp.id === srp.recurring_product_id);
                  if (!product) return null;
                  return (
                    <div key={srp.recurring_product_id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-600">
                          Available: {product.quantity_available} {product.unit}
                        </div>
                      </div>
                      <input
                        type="number"
                        value={srp.quantity_consumed || ''}
                        onChange={(e) => updateRecurringProductQuantity(srp.recurring_product_id, Number(e.target.value))}
                        className="w-24 border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="Qty"
                      />
                      <button
                        onClick={() => removeRecurringProduct(srp.recurring_product_id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setFormStep(1)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={() => setFormStep(3)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {formStep === 3 && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Define Output</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
                  <input
                    type="text"
                    value={formData.output_product_type}
                    onChange={(e) => setFormData((prev) => ({ ...prev, output_product_type: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., Banana Khar"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch Date</label>
                  <input
                    type="date"
                    value={formData.batch_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, batch_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Output Quantity</label>
                  <input
                    type="number"
                    value={formData.output_quantity}
                    onChange={(e) => setFormData((prev) => ({ ...prev, output_quantity: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Output Unit</label>
                  <input
                    type="text"
                    value={formData.output_unit}
                    onChange={(e) => setFormData((prev) => ({ ...prev, output_unit: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                    placeholder="kg, pieces, etc."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setFormStep(2)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={() => void handleSubmit()}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Create Batch
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Output</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responsible</th>
              {canWrite && <th className="px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={canWrite ? 7 : 6} className="px-4 py-6 text-center text-gray-500">
                  Loading batches...
                </td>
              </tr>
            ) : batches.length === 0 ? (
              <tr>
                <td colSpan={canWrite ? 7 : 6} className="px-4 py-6 text-center text-gray-500">
                  No production batches found
                </td>
              </tr>
            ) : (
              batches.map((batch) => (
                <tr key={batch.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm text-gray-900">{batch.batch_id}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{batch.batch_date}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{batch.output_product_type}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {batch.output_quantity} {batch.output_unit}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        batch.qa_status === 'approved'
                          ? 'bg-green-50 text-green-700'
                          : batch.qa_status === 'rejected'
                            ? 'bg-red-50 text-red-700'
                            : batch.qa_status === 'hold'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {batch.qa_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{batch.responsible_user_name || '—'}</td>
                  {canWrite && (
                    <td className="px-4 py-3 text-right space-x-2">
                      {batch.qa_status === 'pending' && !batch.is_locked && (
                        <>
                          <button
                            onClick={() => void handleApprove(batch.id)}
                            className="text-sm text-green-600 hover:text-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => void handleReject(batch.id)}
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {!batch.is_locked && (
                        <button
                          onClick={() => void handleDelete(batch.id)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      )}
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
