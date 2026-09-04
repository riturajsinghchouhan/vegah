import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Tag, Layers } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { adminService } from '../services/adminService';

export default function AdminCategoryForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const isEditing = Boolean(id);
  const title = isEditing ? "Edit Category" : "Add New Category";
  
  const [categoryName, setCategoryName] = useState('');
  const [vehicleType, setVehicleType] = useState('Two-Wheeler');
  const [status, setStatus] = useState('Active');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      const fetchCategory = async () => {
        try {
          setLoading(true);
          const category = await adminService.getCategoryById(id);
          setCategoryName(category.name || '');
          setVehicleType(category.type || 'Two-Wheeler');
          setStatus((category.status === 'ACTIVE' || category.status === 'Active') ? 'Active' : 'Inactive');
        } catch (error) {
          console.error("Failed to load category details", error);
          alert("Failed to load category details");
        } finally {
          setLoading(false);
        }
      };
      fetchCategory();
    }
  }, [id, isEditing]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!categoryName.trim()) {
      alert("Please enter a category name");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: categoryName.trim(),
        type: vehicleType,
        status: status === 'Active' ? 'ACTIVE' : 'INACTIVE',
      };

      if (isEditing) {
        await adminService.updateCategory(id, payload);
      } else {
        await adminService.createCategory(payload);
      }

      navigate('/admin/categories');
    } catch (error) {
      console.error("Failed to save category", error);
      alert(error.response?.data?.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading category details...</div>;
  }

  return (
    <div className="space-y-6 pb-8 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-2 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <button 
          onClick={() => navigate('/admin/categories')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        
        <div className="bg-orange-500 text-white p-2.5 rounded-xl shadow-sm">
          <Tag size={22} />
        </div>
        
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">{title}</h1>
          <p className="text-sm text-gray-500">Configure vehicle category and pricing</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Layers size={20} className="text-gray-400" /> Category Details
          </h2>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Category Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                placeholder="e.g. Electric Scooty, Premium"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
            </div>

            {/* Vehicle Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Type <span className="text-red-500">*</span>
              </label>
              <select 
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
              >
                <option value="Two-Wheeler">Two-Wheeler</option>
                <option value="Three-Wheeler">Three-Wheeler</option>
                <option value="Four-Wheeler">Four-Wheeler</option>
              </select>
            </div>
            
          </div>
        </div>



        <div className="p-6 border-t border-gray-100 space-y-6">
           {/* Status */}
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="status" 
                    value="Active" 
                    checked={status === 'Active'}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="status" 
                    value="Inactive" 
                    checked={status === 'Inactive'}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Inactive</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button 
                variant="outline" 
                onClick={() => navigate('/admin/categories')}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                disabled={saving}
                className="bg-[#ea580c] hover:bg-[#c2410c] border-none text-white shadow-sm disabled:opacity-50"
                onClick={handleSave}
              >
                {saving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Category')}
              </Button>
            </div>
        </div>

      </div>
    </div>
  );
}
