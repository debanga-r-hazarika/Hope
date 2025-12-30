import { Suppliers } from './Suppliers';
import { RawMaterials } from './RawMaterials';
import { RecurringProducts } from './RecurringProducts';
import { Production } from './Production';
import { ProcessedGoods } from './ProcessedGoods';
import { Machines } from './Machines';
import { ShieldCheck } from 'lucide-react';
import type { AccessLevel } from '../types/access';

type OperationsSection = 'suppliers' | 'raw-materials' | 'recurring-products' | 'production' | 'processed-goods' | 'machines';

interface OperationsProps {
  section: OperationsSection;
  onNavigateToSection: (section: OperationsSection) => void;
  accessLevel: AccessLevel;
}

export function Operations({ section, onNavigateToSection, accessLevel }: OperationsProps) {
  if (accessLevel === 'no-access') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-700">
        You do not have access to the Operations module. Please contact an administrator.
      </div>
    );
  }

  const sections: Array<{ id: OperationsSection; label: string }> = [
    { id: 'suppliers', label: 'Suppliers' },
    { id: 'raw-materials', label: 'Raw Materials' },
    { id: 'recurring-products', label: 'Recurring Products' },
    { id: 'production', label: 'Production' },
    { id: 'processed-goods', label: 'Processed Goods' },
    { id: 'machines', label: 'Machines & Hardware' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Operations</h1>
        <p className="mt-2 text-gray-600">
          Manage production, inventory, and operations
        </p>
        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">
          <ShieldCheck className="w-4 h-4" />
          {accessLevel === 'read-write' ? 'Read & Write' : 'Read Only'}
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => onNavigateToSection(sec.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  section === sec.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {sec.label}
            </button>
          ))}
        </nav>
      </div>

      <div>
        {section === 'suppliers' && <Suppliers accessLevel={accessLevel} />}
        {section === 'raw-materials' && <RawMaterials accessLevel={accessLevel} />}
        {section === 'recurring-products' && <RecurringProducts accessLevel={accessLevel} />}
        {section === 'production' && <Production accessLevel={accessLevel} />}
        {section === 'processed-goods' && <ProcessedGoods accessLevel={accessLevel} />}
        {section === 'machines' && <Machines accessLevel={accessLevel} />}
      </div>
    </div>
  );
}
