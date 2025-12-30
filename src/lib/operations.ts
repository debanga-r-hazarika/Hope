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

  if (error) throw error;
  return data || [];
}

export async function createSupplier(supplier: Partial<Supplier>): Promise<Supplier> {
  const { data, error } = await supabase
    .from('suppliers')
    .insert([supplier])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier> {
  const { data, error } = await supabase
    .from('suppliers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSupplier(id: string): Promise<void> {
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function fetchRawMaterials(): Promise<RawMaterial[]> {
  const { data, error } = await supabase
    .from('raw_materials')
    .select(`
      *,
      suppliers!raw_materials_supplier_id_fkey(name)
    `)
    .order('received_date', { ascending: false });

  if (error) throw error;

  return (data || []).map((item: any) => ({
    ...item,
    supplier_name: item.suppliers?.name,
  }));
}

export async function createRawMaterial(material: Partial<RawMaterial>): Promise<RawMaterial> {
  const { data, error } = await supabase
    .from('raw_materials')
    .insert([material])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRawMaterial(id: string): Promise<void> {
  const { error } = await supabase
    .from('raw_materials')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function fetchRecurringProducts(): Promise<RecurringProduct[]> {
  const { data, error } = await supabase
    .from('recurring_products')
    .select(`
      *,
      suppliers!recurring_products_supplier_id_fkey(name)
    `)
    .order('received_date', { ascending: false });

  if (error) throw error;

  return (data || []).map((item: any) => ({
    ...item,
    supplier_name: item.suppliers?.name,
  }));
}

export async function createRecurringProduct(product: Partial<RecurringProduct>): Promise<RecurringProduct> {
  const { data, error } = await supabase
    .from('recurring_products')
    .insert([product])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRecurringProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from('recurring_products')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function fetchProductionBatches(): Promise<ProductionBatch[]> {
  const { data, error } = await supabase
    .from('production_batches')
    .select('*')
    .order('batch_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createProductionBatch(batch: Partial<ProductionBatch>): Promise<ProductionBatch> {
  const { data, error } = await supabase
    .from('production_batches')
    .insert([batch])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProductionBatch(id: string, updates: Partial<ProductionBatch>): Promise<ProductionBatch> {
  const { data, error } = await supabase
    .from('production_batches')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProductionBatch(id: string): Promise<void> {
  const { error } = await supabase
    .from('production_batches')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function approveBatch(id: string): Promise<void> {
  const { error } = await supabase
    .from('production_batches')
    .update({ qa_status: 'approved' })
    .eq('id', id);

  if (error) throw error;
}

export async function fetchBatchRawMaterials(batchId: string): Promise<BatchRawMaterial[]> {
  const { data, error } = await supabase
    .from('batch_raw_materials')
    .select('*')
    .eq('batch_id', batchId);

  if (error) throw error;
  return data || [];
}

export async function fetchBatchRecurringProducts(batchId: string): Promise<BatchRecurringProduct[]> {
  const { data, error } = await supabase
    .from('batch_recurring_products')
    .select('*')
    .eq('batch_id', batchId);

  if (error) throw error;
  return data || [];
}

export async function fetchProcessedGoods(): Promise<ProcessedGood[]> {
  const { data, error } = await supabase
    .from('processed_goods')
    .select('*')
    .order('production_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchMachines(): Promise<Machine[]> {
  const { data, error } = await supabase
    .from('machines')
    .select(`
      *,
      suppliers!machines_supplier_id_fkey(name)
    `)
    .order('name');

  if (error) throw error;

  return (data || []).map((item: any) => ({
    ...item,
    supplier_name: item.suppliers?.name,
  }));
}

export async function createMachine(machine: Partial<Machine>): Promise<Machine> {
  const { data, error } = await supabase
    .from('machines')
    .insert([machine])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMachine(id: string, updates: Partial<Machine>): Promise<Machine> {
  const { data, error } = await supabase
    .from('machines')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMachine(id: string): Promise<void> {
  const { error } = await supabase
    .from('machines')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
