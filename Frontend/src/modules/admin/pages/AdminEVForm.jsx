import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Bike, 
  Save, 
  X, 
  Package, 
  DollarSign, 
  MapPin, 
  Zap, 
  Upload, 
  Tag, 
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon
} from 'lucide-react';
import { adminService } from '../services/adminService';

export default function AdminEVForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  useEffect(() => {
    const urls = images.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [images]);

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
    totalStock: 1,
    availableStock: 1,
    stockStatus: 'IN_STOCK',
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
          totalStock: vehicle.totalStock ?? 1,
          availableStock: vehicle.availableStock ?? 1,
          stockStatus: vehicle.stockStatus || (vehicle.availableStock === 0 ? 'OUT_OF_STOCK' : 'IN_STOCK'),
          location: vehicle.location || 'Bengaluru Hub',
          status: vehicle.status || 'AVAILABLE',
        });
        setExistingImages(vehicle.images || []);
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
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'availableStock') {
        const avail = Number(value);
        if (avail === 0) updated.stockStatus = 'OUT_OF_STOCK';
        else if (avail < 3) updated.stockStatus = 'LOW_STOCK';
        else updated.stockStatus = 'IN_STOCK';
      }
      return updated;
    });
  };

  const handleRemoveExistingImage = async (imageId) => {
    if (!window.confirm("Are you sure you want to delete this saved image?")) return;
    try {
      await adminService.deleteVehicleImage(id, imageId);
      setExistingImages(prev => prev.filter(img => img._id !== imageId));
    } catch (error) {
      console.error("Failed to delete image", error);
      alert("Failed to delete image");
    }
  };

  const handleRemoveNewImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.plateNumber || !formData.name || !formData.category || !formData.zone) {
      alert("Please fill in all required fields (Plate Number, Vehicle Name, Category, Zone)");
      return;
    }

    try {
      setSaving(true);
      
      const payload = new FormData();
      payload.append('plateNumber', formData.plateNumber.trim().toUpperCase());
      payload.append('name', formData.name.trim());
      payload.append('brand', formData.brand.trim());
      payload.append('model', formData.model.trim());
      payload.append('type', formData.type);
      payload.append('category', formData.category);
      payload.append('zone', formData.zone);
      payload.append('rangeKm', formData.rangeKm);
      payload.append('batteryCapacity', formData.batteryCapacity);
      payload.append('batteryPercent', formData.batteryPercent);
      payload.append('pricePerHour', formData.pricePerHour);
      payload.append('pricePerDay', formData.pricePerDay);
      payload.append('securityDeposit', formData.securityDeposit);
      payload.append('totalStock', formData.totalStock);
      payload.append('availableStock', formData.availableStock);
      payload.append('stockStatus', formData.stockStatus);
      payload.append('location', formData.location);
      payload.append('status', formData.status);
      payload.append('coordinates', JSON.stringify({ lat: 12.9716, lng: 77.5946 }));
      
      images.forEach(file => {
        payload.append('images', file);
      });

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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading vehicle configuration...</p>
        </div>
      </div>
    );
  }

  const isOutOfStock = Number(formData.availableStock) === 0;
  const isLowStock = Number(formData.availableStock) > 0 && Number(formData.availableStock) < 3;

  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => navigate('/admin/evs')}
            className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all border border-slate-200/60"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <Link to="/admin/evs" className="hover:text-slate-600 transition-colors">EV Fleet</Link>
              <span>/</span>
              <span>{isEditing ? 'Edit Vehicle' : 'New Registration'}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              {isEditing ? (formData.name || 'Edit Vehicle') : 'Add New EV Scooty'}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/evs')}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create EV')}
          </button>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Core Information */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Basic Information */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <Bike size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Vehicle Identification</h2>
                <p className="text-xs text-slate-500">Registration and model specification details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Plate / Registration Number <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text"
                  placeholder="e.g. KA 01 EV 1234"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono font-bold text-slate-900 uppercase text-sm"
                  value={formData.plateNumber}
                  onChange={(e) => handleChange('plateNumber', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Display Name <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text"
                  placeholder="e.g. Ather 450X Gen 3"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-medium text-slate-900"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Brand <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text"
                  placeholder="e.g. Ather"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-medium text-slate-900"
                  value={formData.brand}
                  onChange={(e) => handleChange('brand', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Model Variant <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text"
                  placeholder="e.g. 450X HR"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-medium text-slate-900"
                  value={formData.model}
                  onChange={(e) => handleChange('model', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select 
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-medium text-slate-900 bg-white"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Assigned Operational Zone <span className="text-rose-500">*</span>
                </label>
                <select 
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-medium text-slate-900 bg-white"
                  value={formData.zone}
                  onChange={(e) => handleChange('zone', e.target.value)}
                >
                  <option value="">Select Zone</option>
                  {zones.map(z => (
                    <option key={z._id || z.id} value={z._id || z.id}>{z.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Card 2: Fleet Stock Management */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <Package size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Inventory & Stock Controls</h2>
                  <p className="text-xs text-slate-500">Fleet count and real-time booking availability</p>
                </div>
              </div>

              {/* Status Pill */}
              <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
                isOutOfStock 
                  ? 'bg-rose-50 text-rose-700 border-rose-200' 
                  : isLowStock 
                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  isOutOfStock ? 'bg-rose-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
                {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock Alert' : 'Stock Optimal'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Total Fleet Units <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="number"
                  min="0"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-bold text-slate-900"
                  value={formData.totalStock}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    handleChange('totalStock', val);
                    if (formData.availableStock > val) {
                      handleChange('availableStock', val);
                    }
                  }}
                />
                <p className="text-[11px] text-slate-400 mt-1">Total physical vehicles in fleet</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Available Units <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="number"
                  min="0"
                  max={formData.totalStock}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-bold text-slate-900"
                  value={formData.availableStock}
                  onChange={(e) => handleChange('availableStock', Number(e.target.value))}
                />
                <p className="text-[11px] text-slate-400 mt-1">Ready for user booking</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Stock Condition Status
                </label>
                <select 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-semibold text-slate-900 bg-white"
                  value={formData.stockStatus}
                  onChange={(e) => handleChange('stockStatus', e.target.value)}
                >
                  <option value="IN_STOCK">In Stock</option>
                  <option value="LOW_STOCK">Low Stock</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Manual status override</p>
              </div>
            </div>
          </div>

          {/* Card 3: Media & Images */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
                <ImageIcon size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Vehicle Gallery</h2>
                <p className="text-xs text-slate-500">Upload high-resolution vehicle photos for customer preview</p>
              </div>
            </div>

            <div>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer hover:bg-slate-50/80 hover:border-slate-300 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload size={22} className="text-slate-400 mb-1" />
                  <p className="text-xs font-semibold text-slate-700">Click to upload vehicle images</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG or WEBP (Max 5 files)</p>
                </div>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    if (files.length > 5) {
                      alert('Maximum 5 images allowed');
                      e.target.value = '';
                    } else {
                      setImages(files);
                    }
                  }}
                />
              </label>
            </div>

            {/* Previews Grid */}
            {(existingImages.length > 0 || previewUrls.length > 0) && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-2">
                {/* Existing Images */}
                {existingImages.map((img, idx) => (
                  <div key={img._id || idx} className="relative aspect-square rounded-xl border border-slate-200 overflow-hidden bg-slate-50 group">
                    <img 
                      src={img.url.startsWith('http') ? img.url : `http://localhost:5000${img.url}`} 
                      className="w-full h-full object-cover" 
                      alt="EV" 
                    />
                    <div className="absolute top-1 left-1 bg-slate-900/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
                      Saved
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleRemoveExistingImage(img._id)}
                      className="absolute inset-0 bg-slate-900/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
                
                {/* New Image Previews */}
                {previewUrls.map((url, idx) => (
                  <div key={url} className="relative aspect-square rounded-xl border border-indigo-200 overflow-hidden bg-indigo-50/20 group">
                    <img src={url} className="w-full h-full object-cover" alt="Preview" />
                    <div className="absolute top-1 left-1 bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      New
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleRemoveNewImage(idx)}
                      className="absolute inset-0 bg-rose-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right 1 Column: Pricing & Operational Specs */}
        <div className="space-y-6">
          
          {/* Card 4: Rental Pricing */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <DollarSign size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Rental Tariff</h2>
                <p className="text-xs text-slate-500">Weekly & monthly pricing rates</p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Weekly Rental Price (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                  <input 
                    type="number"
                    required
                    min="0"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-bold text-slate-900"
                    value={formData.pricePerDay}
                    onChange={(e) => handleChange('pricePerDay', Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Monthly Rental Price (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                  <input 
                    type="number"
                    required
                    min="0"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-bold text-slate-900"
                    value={formData.pricePerHour}
                    onChange={(e) => handleChange('pricePerHour', Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Security Deposit (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                  <input 
                    type="number"
                    required
                    min="0"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-bold text-slate-900"
                    value={formData.securityDeposit}
                    onChange={(e) => handleChange('securityDeposit', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Vehicle Specs & Location */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                <Zap size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Specs & Station Hub</h2>
                <p className="text-xs text-slate-500">Battery range & pickup location</p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Pickup Hub / Station Location <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Indiranagar Hub, Bengaluru"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-medium text-slate-900"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Range per Full Charge (km)
                </label>
                <input 
                  type="number"
                  min="0"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-bold text-slate-900"
                  value={formData.rangeKm}
                  onChange={(e) => handleChange('rangeKm', Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Operational Fleet Status <span className="text-rose-500">*</span>
                </label>
                <select 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-semibold text-slate-900 bg-white"
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="BOOKED">Booked</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
          </div>

        </div>

      </form>
    </div>
  );
}
