export type ModuleId = 'finance' | 'inventory' | 'sales' | 'analytics' | 'documents';

export interface ModuleDefinition {
  id: ModuleId;
  name: string;
  description: string;
}

export const MODULE_DEFINITIONS: ModuleDefinition[] = [
  { id: 'finance', name: 'Finance', description: 'Manage budgets and expenses' },
  { id: 'inventory', name: 'Inventory', description: 'Track stock and supplies' },
  { id: 'sales', name: 'Sales', description: 'Track sales and orders' },
  { id: 'analytics', name: 'Analytics', description: 'View performance metrics' },
  { id: 'documents', name: 'Documents', description: 'Manage files and records' },
];

export const MODULE_IDS = MODULE_DEFINITIONS.map((module) => module.id);



