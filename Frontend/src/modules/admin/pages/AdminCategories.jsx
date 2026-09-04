import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/shared/components/admin/PageHeader';
import StatusBadge from '@/shared/components/admin/StatusBadge';
import { Button } from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import { Plus, Eye, Edit3, Trash2, Power, Search, Tag } from 'lucide-react';
import { adminService } from '../services/adminService';

export default function AdminCategories() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await adminService.getCategories();
      
      const mapped = (data || []).map(c => ({
        id: c._id,
        name: c.name,
        type: c.type || 'Two-Wheeler',
        pricing: (c.basePricePerKm || c.basePricePerMin) 
          ? `₹${c.basePricePerKm || 0}/km + ₹${c.basePricePerMin || 0}/min` 
          : 'Standard Rates',
        status: (c.status === 'ACTIVE' || c.status === 'Active') ? 'Active' : 'Inactive',
        basePricePerKm: c.basePricePerKm,
        basePricePerMin: c.basePricePerMin,
      }));
      setCategories(mapped);
    } catch (error) {
      console.error("Failed to load categories", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (catId, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'Active' ? 'INACTIVE' : 'ACTIVE';
      const updated = await adminService.updateCategory(catId, { status: nextStatus });
      setCategories(prev => prev.map(c => c.id === catId ? {
        ...c,
        status: (updated.status === 'ACTIVE' || updated.status === 'Active') ? 'Active' : 'Inactive'
      } : c));
      if (selectedCategory?.id === catId) {
        setSelectedCategory(prev => prev ? { ...prev, status: nextStatus === 'ACTIVE' ? 'Active' : 'Inactive' } : null);
      }
    } catch (error) {
      console.error("Failed to update status", error);
      alert(error.response?.data?.message || "Failed to update category status");
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await adminService.deleteCategory(catId);
      setCategories(prev => prev.filter(c => c.id !== catId));
      if (selectedCategory?.id === catId) setSelectedCategory(null);
    } catch (error) {
      console.error("Failed to delete category", error);
      alert(error.response?.data?.message || "Failed to delete category");
    }
  };

  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading categories...</div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          No categories found. Click "Add Category" to create one!
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category) => (
          <div key={category.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            
            {/* Card Header */}
            <div className="p-5 pb-0 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-900 leading-tight">{category.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{category.type}</p>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <button 
                  className="hover:text-blue-600 transition-colors"
                  onClick={() => setSelectedCategory(category)}
                  title="View Category"
                >
                  <Eye size={18} strokeWidth={2.5} />
                </button>
                <button 
                  className="hover:text-green-600 transition-colors"
                  onClick={() => navigate(`/admin/categories/${category.id}`)}
                  title="Edit Category"
                >
                  <Edit3 size={18} strokeWidth={2.5} />
                </button>
                <button 
                  className="hover:text-red-600 transition-colors"
                  onClick={() => handleDeleteCategory(category.id)}
                  title="Delete Category"
                >
                  <Trash2 size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5 space-y-4 flex-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Category ID:</span>
                <span className="font-semibold text-gray-900">{category.id.substring(0, 8).toUpperCase()}</span>
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
                <button 
                  onClick={() => handleToggleStatus(category.id, category.status)}
                  className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2.5 rounded-lg transition-colors"
                >
                  <Power size={18} /> Deactivate Category
                </button>
              ) : (
                <button 
                  onClick={() => handleToggleStatus(category.id, category.status)}
                  className="w-full flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-600 font-medium py-2.5 rounded-lg transition-colors"
                >
                  <Power size={18} /> Activate Category
                </button>
              )}
            </div>
            
          </div>
        ))}
      </div>
      )}

      {/* View Category Modal */}
      <Modal 
        isOpen={!!selectedCategory} 
        onClose={() => setSelectedCategory(null)} 
        title="Category Overview" 
        size="md"
        accent={false}
      >
        {selectedCategory && (
          <div className="space-y-5">
             <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="bg-orange-500 text-white p-3 rounded-xl shadow-sm">
                  <Tag size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedCategory.name}</h2>
                  <p className="text-sm text-gray-500">{selectedCategory.type}</p>
                </div>
             </div>
             
             <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-3">
                  <span className="text-gray-500 font-medium">Category ID</span>
                  <span className="font-semibold text-gray-900">{selectedCategory.id}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-3">
                  <span className="text-gray-500 font-medium">Vehicle Type</span>
                  <span className="font-semibold text-gray-900">{selectedCategory.type}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-3">
                  <span className="text-gray-500 font-medium">Pricing Plan</span>
                  <span className="font-semibold text-gray-900">{selectedCategory.pricing}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Current Status</span>
                  <StatusBadge status={selectedCategory.status} />
                </div>
             </div>
             
             <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => navigate(`/admin/categories/${selectedCategory.id}`)}>
                  <Edit3 size={16} className="mr-2" /> Edit Category
                </Button>
                <Button variant="primary" className="bg-blue-600 hover:bg-blue-700 border-none text-white shadow-sm" onClick={() => setSelectedCategory(null)}>
                  Close
                </Button>
             </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
