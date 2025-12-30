import { supabase } from './supabase';
import type {
  Supplier,
  RawMaterial,
  RecurringProduct,
  ProductionBatch,
  BatchRawMaterial,
  BatchRecurringProduct,
  ProcessedGood,
  Machine,
} from '../types/operations';

export async function fetchSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('name');

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createSupplier(supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<Supplier> {
  const { data, error } = await supabase
    .from('suppliers')
    .insert(supplier)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier> {
  const { data, error } = await supabase
    .from('suppliers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteSupplier(id: string): Promise<void> {
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function fetchRawMaterials(): Promise<RawMaterial[]> {
  const { data, error } = await supabase
    .from('raw_materials')
    .select(`
      *,
      supplier:suppliers(name)
    `)
    .order('received_date', { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map((item: any) => ({
    ...item,
    supplier_name: item.supplier?.name,
  }));
}

export async function generateLotId(): Promise<string> {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `LOT-${timestamp}-${random}`;
}

export async function createRawMaterial(
  material: Omit<RawMaterial, 'id' | 'created_at' | 'updated_at' | 'lot_id' | 'quantity_available' | 'supplier_name'>
): Promise<RawMaterial> {
  const lotId = await generateLotId();

  const { data, error } = await supabase
    .from('raw_materials')
    .insert({
      ...material,
      lot_id: lotId,
      quantity_available: material.quantity_received,
    })
    .select(`
      *,
      supplier:suppliers(name)
    `)
    .single();

  if (error) throw new Error(error.message);

  return {
    ...data,
    supplier_name: data.supplier?.name,
  };
}

export async function updateRawMaterial(id: string, updates: Partial<RawMaterial>): Promise<RawMaterial> {
  const { data, error } = await supabase
    .from('raw_materials')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`
      *,
      supplier:suppliers(name)
    `)
    .single();

  if (error) throw new Error(error.message);

  return {
    ...data,
    supplier_name: data.supplier?.name,
  };
}

export async function deleteRawMaterial(id: string): Promise<void> {
  const { error } = await supabase
    .from('raw_materials')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function fetchRecurringProducts(): Promise<RecurringProduct[]> {
  const { data, error } = await supabase
    .from('recurring_products')
    .select(`
      *,
      supplier:suppliers(name)
    `)
    .order('received_date', { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map((item: any) => ({
    ...item,
    supplier_name: item.supplier?.name,
  }));
}

export async function createRecurringProduct(
  product: Omit<RecurringProduct, 'id' | 'created_at' | 'updated_at' | 'quantity_available' | 'supplier_name'>
): Promise<RecurringProduct> {
  const { data, error } = await supabase
    .from('recurring_products')
    .insert({
      ...product,
      quantity_available: product.quantity_received,
    })
    .select(`
      *,
      supplier:suppliers(name)
    `)
    .single();

  if (error) throw new Error(error.message);

  return {
    ...data,
    supplier_name: data.supplier?.name,
  };
}

export async function updateRecurringProduct(id: string, updates: Partial<RecurringProduct>): Promise<RecurringProduct> {
  const { data, error } = await supabase
    .from('recurring_products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`
      *,
      supplier:suppliers(name)
    `)
    .single();

  if (error) throw new Error(error.message);

  return {
    ...data,
    supplier_name: data.supplier?.name,
  };
}

export async function deleteRecurringProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from('recurring_products')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function fetchProductionBatches(): Promise<ProductionBatch[]> {
  const { data, error } = await supabase
    .from('production_batches')
    .select('*')
    .order('batch_date', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function generateBatchId(): Promise<string> {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `BATCH-${timestamp}-${random}`;
}

export async function createProductionBatch(
  batch: Omit<ProductionBatch, 'id' | 'created_at' | 'updated_at' | 'batch_id' | 'is_locked'>,
  rawMaterials: Array<{ raw_material_id: string; quantity_consumed: number }>,
  recurringProducts: Array<{ recurring_product_id: string; quantity_consumed: number }>
): Promise<ProductionBatch> {
  const batchId = await generateBatchId();

  const { data: batchData, error: batchError } = await supabase
    .from('production_batches')
    .insert({
      ...batch,
      batch_id: batchId,
      is_locked: false,
    })
    .select()
    .single();

  if (batchError) throw new Error(batchError.message);

  for (const rm of rawMaterials) {
    const { data: rawMaterialData, error: rmFetchError } = await supabase
      .from('raw_materials')
      .select('*')
      .eq('id', rm.raw_material_id)
      .single();

    if (rmFetchError) throw new Error(rmFetchError.message);

    if (rawMaterialData.quantity_available < rm.quantity_consumed) {
      throw new Error(`Insufficient quantity for raw material ${rawMaterialData.name}`);
    }

    const { error: rmUpdateError } = await supabase
      .from('raw_materials')
      .update({
        quantity_available: rawMaterialData.quantity_available - rm.quantity_consumed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', rm.raw_material_id);

    if (rmUpdateError) throw new Error(rmUpdateError.message);

    const { error: junctionError } = await supabase
      .from('batch_raw_materials')
      .insert({
        batch_id: batchData.id,
        raw_material_id: rm.raw_material_id,
        raw_material_name: rawMaterialData.name,
        lot_id: rawMaterialData.lot_id,
        quantity_consumed: rm.quantity_consumed,
        unit: rawMaterialData.unit,
      });

    if (junctionError) throw new Error(junctionError.message);
  }

  for (const rp of recurringProducts) {
    const { data: recurringProductData, error: rpFetchError } = await supabase
      .from('recurring_products')
      .select('*')
      .eq('id', rp.recurring_product_id)
      .single();

    if (rpFetchError) throw new Error(rpFetchError.message);

    if (recurringProductData.quantity_available < rp.quantity_consumed) {
      throw new Error(`Insufficient quantity for recurring product ${recurringProductData.name}`);
    }

    const { error: rpUpdateError } = await supabase
      .from('recurring_products')
      .update({
        quantity_available: recurringProductData.quantity_available - rp.quantity_consumed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', rp.recurring_product_id);

    if (rpUpdateError) throw new Error(rpUpdateError.message);

    const { error: junctionError } = await supabase
      .from('batch_recurring_products')
      .insert({
        batch_id: batchData.id,
        recurring_product_id: rp.recurring_product_id,
        recurring_product_name: recurringProductData.name,
        quantity_consumed: rp.quantity_consumed,
        unit: recurringProductData.unit,
      });

    if (junctionError) throw new Error(junctionError.message);
  }

  return batchData;
}

export async function updateProductionBatch(id: string, updates: Partial<ProductionBatch>): Promise<ProductionBatch> {
  const { data, error } = await supabase
    .from('production_batches')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function approveBatch(batchId: string): Promise<void> {
  const { data: batch, error: fetchError } = await supabase
    .from('production_batches')
    .select('*')
    .eq('id', batchId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  if (batch.qa_status === 'approved' && batch.is_locked) {
    throw new Error('Batch is already approved and locked');
  }

  const { error: updateError } = await supabase
    .from('production_batches')
    .update({
      qa_status: 'approved',
      is_locked: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', batchId);

  if (updateError) throw new Error(updateError.message);

  const { error: goodsError } = await supabase
    .from('processed_goods')
    .insert({
      batch_id: batchId,
      batch_reference: batch.batch_id,
      product_type: batch.output_product_type,
      quantity_available: batch.output_quantity,
      unit: batch.output_unit,
      production_date: batch.batch_date,
      qa_status: 'approved',
    });

  if (goodsError) throw new Error(goodsError.message);
}

export async function deleteProductionBatch(id: string): Promise<void> {
  const { error } = await supabase
    .from('production_batches')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function fetchBatchRawMaterials(batchId: string): Promise<BatchRawMaterial[]> {
  const { data, error } = await supabase
    .from('batch_raw_materials')
    .select('*')
    .eq('batch_id', batchId);

  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchBatchRecurringProducts(batchId: string): Promise<BatchRecurringProduct[]> {
  const { data, error } = await supabase
    .from('batch_recurring_products')
    .select('*')
    .eq('batch_id', batchId);

  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchProcessedGoods(): Promise<ProcessedGood[]> {
  const { data, error } = await supabase
    .from('processed_goods')
    .select('*')
    .order('production_date', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchMachines(): Promise<Machine[]> {
  const { data, error } = await supabase
    .from('machines')
    .select(`
      *,
      supplier:suppliers(name)
    `)
    .order('name');

  if (error) throw new Error(error.message);

  return (data || []).map((item: any) => ({
    ...item,
    supplier_name: item.supplier?.name,
  }));
}

export async function createMachine(
  machine: Omit<Machine, 'id' | 'created_at' | 'updated_at' | 'supplier_name'>
): Promise<Machine> {
  const { data, error } = await supabase
    .from('machines')
    .insert(machine)
    .select(`
      *,
      supplier:suppliers(name)
    `)
    .single();

  if (error) throw new Error(error.message);

  return {
    ...data,
    supplier_name: data.supplier?.name,
  };
}

export async function updateMachine(id: string, updates: Partial<Machine>): Promise<Machine> {
  const { data, error } = await supabase
    .from('machines')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`
      *,
      supplier:suppliers(name)
    `)
    .single();

  if (error) throw new Error(error.message);

  return {
    ...data,
    supplier_name: data.supplier?.name,
  };
}

export async function deleteMachine(id: string): Promise<void> {
  const { error } = await supabase
    .from('machines')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}
