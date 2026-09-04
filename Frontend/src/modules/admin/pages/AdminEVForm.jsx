import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Bike, Tag, MapPin, Save, Battery, IndianRupee } from 'lucide-react';
import { adminService } from '../services/adminService';
import { Button } from '@/shared/components/ui/Button';

export default function AdminEVForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const title = isEditing ? "Edit EV Scooty" : "Add New EV Scooty";

  const [categories, setCategories] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    plateNumber: '',
    name: '',
    brand: 'Ather',
    model: '450X',
    type: 'Scoots',
    category: '',
    zone: '',
    rangeKm: 100,
    batteryCapacity: '3.7 kWh',
    batteryPercent: 100,
    pricePerHour: 40,
    pricePerDay: 350,
    securityDeposit: 1000,
    location: 'Bengaluru Hub',
    status: 'AVAILABLE',
  });

  useEffect(() => {
    fetchDropdowns();
    if (isEditing && id) {
      fetchVehicle();
    }
  }, [id, isEditing]);

  const fetchDropdowns = async () => {
    try {
      const [catsRes, zonesRes] = await Promise.all([
        adminService.getCategories(),
        adminService.getZones(),
      ]);

      const cats = Array.isArray(catsRes) ? catsRes : (catsRes?.categories || catsRes?.data || []);
      const zonesList = Array.isArray(zonesRes) ? zonesRes : (zonesRes?.zones || zonesRes?.data || []);

      setCategories(cats);
      setZones(zonesList);

      // Auto select first option if creating
      if (!isEditing) {
        setFormData(prev => ({
          ...prev,
          category: prev.category || cats?.[0]?._id || cats?.[0]?.id || '',
          zone: prev.zone || zonesList?.[0]?._id || zonesList?.[0]?.id || '',
        }));
      }
    } catch (err) {
      console.error("Failed to load categories/zones for EV form", err);
    }
  };

  const fetchVehicle = async () => {
    try {
      setLoading(true);
      const vehicle = await adminService.getVehicleById(id);
      if (vehicle) {
        setFormData({
          plateNumber: vehicle.plateNumber || '',
          name: vehicle.name || '',
          brand: vehicle.brand || 'Ather',
          model: vehicle.model || '',
          type: vehicle.type || 'Scoots',
          category: vehicle.category?._id || vehicle.category || '',
          zone: vehicle.zone?._id || vehicle.zone || '',
          rangeKm: vehicle.rangeKm || 100,
          batteryCapacity: vehicle.batteryCapacity || '3.7 kWh',
          batteryPercent: vehicle.batteryPercent ?? 100,
          pricePerHour: vehicle.pricePerHour || 40,
          pricePerDay: vehicle.pricePerDay || 350,
          securityDeposit: vehicle.securityDeposit || 1000,
          location: vehicle.location || 'Bengaluru Hub',
          status: vehicle.status || 'AVAILABLE',
        });
      }
    } catch (err) {
      console.error("Failed to load vehicle details", err);
      alert("Failed to load vehicle details");
      navigate('/admin/evs');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.plateNumber || !formData.name || !formData.category || !formData.zone) {
      alert("Please fill in all required fields (Plate Number, Vehicle Name, Category, Zone)");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        plateNumber: formData.plateNumber.trim().toUpperCase(),
        name: formData.name.trim(),
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        coordinates: { lat: 12.9716, lng: 77.5946 }, // Default coordinates if unassigned
      };

      if (isEditing) {
        await adminService.updateVehicle(id, payload);
      } else {
        await adminService.createVehicle(payload);
      }

      navigate('/admin/evs');
    } catch (error) {
      console.error("Failed to save vehicle", error);
      alert(error.response?.data?.message || "Failed to save vehicle");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading vehicle details...</div>;
  }

  return (
    <div className="space-y-6 pb-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <button 
          onClick={() => navigate('/admin/evs')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        
        <div className="bg-orange-500 text-white p-2.5 rounded-xl shadow-sm">
          <Bike size={22} />
        </div>
        
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">{title}</h1>
          <p className="text-sm text-gray-500">Manage vehicle details, pricing and zone assignment</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Plate Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Registration / Plate Number <span className="text-red-500">*</span>
            </label>
            <input 
              type="text"
              placeholder="e.g. KA 01 EV 1234"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              value={formData.plateNumber}
              onChange={(e) => handleChange('plateNumber', e.target.value)}
            />
          </div>

          {/* EV Model Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Vehicle Name <span className="text-red-500">*</span>
            </label>
            <input 
              type="text"
              placeholder="e.g. Ather 450X Gen 3"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Brand <span className="text-red-500">*</span>
            </label>
            <input 
              type="text"
              placeholder="e.g. Ather, Ola, TVS"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.brand}
              onChange={(e) => handleChange('brand', e.target.value)}
            />
          </div>

          {/* Model Version */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Model Version <span className="text-red-500">*</span>
            </label>
            <input 
              type="text"
              placeholder="e.g. 450X"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.model}
              onChange={(e) => handleChange('model', e.target.value)}
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select 
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
            >
              <option value="">Select Category</option>
              {categories.map(c => (
                <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
              ))}
            </select>
            {categories.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No categories found. <a href="/admin/categories/new" target="_blank" className="underline font-semibold">Create a Category</a> first.
              </p>
            )}
          </div>

          {/* Zone Dropdown */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Assigned Zone <span className="text-red-500">*</span>
            </label>
            <select 
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={formData.zone}
              onChange={(e) => handleChange('zone', e.target.value)}
            >
              <option value="">Select Zone</option>
              {zones.map(z => (
                <option key={z._id || z.id} value={z._id || z.id}>{z.name}</option>
              ))}
            </select>
            {zones.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No zones found. <a href="/admin/zones/new" target="_blank" className="underline font-semibold">Create a Zone</a> first.
              </p>
            )}
          </div>

          {/* Daily Price */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Price Per Day (₹) <span className="text-red-500">*</span>
            </label>
            <input 
              type="number"
              required
              min="0"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.pricePerDay}
              onChange={(e) => handleChange('pricePerDay', Number(e.target.value))}
            />
          </div>

          {/* Hourly Price */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Price Per Hour (₹) <span className="text-red-500">*</span>
            </label>
            <input 
              type="number"
              required
              min="0"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.pricePerHour}
              onChange={(e) => handleChange('pricePerHour', Number(e.target.value))}
            />
          </div>

          {/* Security Deposit */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Security Deposit (₹) <span className="text-red-500">*</span>
            </label>
            <input 
              type="number"
              required
              min="0"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.securityDeposit}
              onChange={(e) => handleChange('securityDeposit', Number(e.target.value))}
            />
          </div>

          {/* Location Hub */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Pickup Location / Hub <span className="text-red-500">*</span>
            </label>
            <input 
              type="text"
              required
              placeholder="e.g. Indiranagar Hub, Bengaluru"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
            />
          </div>

          {/* Range (km) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Range per Full Charge (km)
            </label>
            <input 
              type="number"
              min="0"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.rangeKm}
              onChange={(e) => handleChange('rangeKm', Number(e.target.value))}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <select 
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <option value="AVAILABLE">Available</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
          <Button 
            type="button"
            variant="outline" 
            onClick={() => navigate('/admin/evs')}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={saving}
            className="bg-[#ea580c] hover:bg-[#c2410c] border-none text-white shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={16} />
            {saving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create EV')}
          </Button>
        </div>
      </form>
    </div>
  );
}
