import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/shared/components/admin/PageHeader';
import StatusBadge from '@/shared/components/admin/StatusBadge';
import { Button } from '@/shared/components/ui/Button';
import { Plus, Eye, Edit3, Trash2, Power, Search } from 'lucide-react';

const defaultCategories = [
  { id: 'C-001', name: 'Electric Scooty', type: 'Two-Wheeler', pricing: '₹5/km (Base) + ₹1/min', status: 'Active' },
  { id: 'C-002', name: 'Premium', type: 'Two-Wheeler', pricing: '₹8/km (Base) + ₹2/min', status: 'Active' },
  { id: 'C-003', name: 'Standard', type: 'Two-Wheeler', pricing: '₹4/km (Base) + ₹1/min', status: 'Active' },
  { id: 'C-004', name: 'Long Range', type: 'Two-Wheeler', pricing: '₹6/km (Base) + ₹1.5/min', status: 'Inactive' },
];

export default function AdminCategories() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  
  // Load categories from localStorage, or use defaults
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('vegah_categories');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('vegah_categories', JSON.stringify(defaultCategories));
    return defaultCategories;
  });

  return (
    <div className="space-y-6 pb-8 max-w-7xl mx-auto">
      <PageHeader 
        title="All Categories" 
        description="Manage vehicle categories and pricing plans."
        actions={
          <Button 
            className="flex items-center gap-2 bg-[#ea580c] hover:bg-[#c2410c] text-white border-none shadow-sm"
            onClick={() => navigate('/admin/categories/new')}
          >
            <Plus size={16} /> Add Category
          </Button>
        }
      />
      
      {/* Search Bar */}
      <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex items-center px-4">
        <Search className="text-gray-400 mr-3" size={20} />
        <input 
          type="text" 
          placeholder="Search categories..." 
          className="w-full bg-transparent border-none outline-none text-gray-700 py-2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div key={category.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            
            {/* Card Header */}
            <div className="p-5 pb-0 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-900 leading-tight">{category.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{category.type}</p>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <button className="hover:text-blue-600 transition-colors"><Eye size={18} strokeWidth={2.5} /></button>
                <button 
                  className="hover:text-green-600 transition-colors"
                  onClick={() => navigate(`/admin/categories/${category.id}`)}
                >
                  <Edit3 size={18} strokeWidth={2.5} />
                </button>
                <button className="hover:text-red-600 transition-colors"><Trash2 size={18} strokeWidth={2.5} /></button>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5 space-y-4 flex-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Category ID:</span>
                <span className="font-semibold text-gray-900">{category.id}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Status:</span>
                <StatusBadge status={category.status} />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Pricing:</span>
                <span className="font-semibold text-gray-900">{category.pricing}</span>
              </div>
            </div>

            {/* Card Footer (Action) */}
            <div className="p-5 pt-0">
              {category.status === 'Active' ? (
                <button className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2.5 rounded-lg transition-colors">
                  <Power size={18} /> Deactivate Category
                </button>
              ) : (
                <button className="w-full flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-600 font-medium py-2.5 rounded-lg transition-colors">
                  <Power size={18} /> Activate Category
                </button>
              )}
            </div>
            
          </div>
        ))}
      </div>

    </div>
  );
}
