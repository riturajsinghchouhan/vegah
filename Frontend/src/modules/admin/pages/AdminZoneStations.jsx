import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader } from '@googlemaps/js-api-loader';
import { env } from '@/config/env';
import StatusBadge from '@/shared/components/admin/StatusBadge';
import { Button } from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import Pagination from '@/shared/components/ui/Pagination';
import { BatteryCharging, Plus, Edit3, Trash2, Search, ArrowLeft, MapPin, LocateFixed } from 'lucide-react';
import { adminService } from '../services/adminService';

const STATUS_OPTIONS = ['AVAILABLE', 'BUSY', 'UNAVAILABLE'];

const emptyForm = {
  name: '',
  address: '',
  latitude: '',
  longitude: '',
  status: 'AVAILABLE',
  chargingType: 'Battery Swap',
  speedLabel: '',
  connector: '',
  pricePerKwh: '',
  availablePorts: '',
  totalPorts: '',
  operatingHours: '24x7',
  openStatus: 'Open 24/7',
};

const toForm = (station) => ({
  name: station.name || '',
  address: station.address || '',
  latitude: station.coordinates?.coordinates?.[1] ?? '',
  longitude: station.coordinates?.coordinates?.[0] ?? '',
  status: station.status || 'AVAILABLE',
  chargingType: station.chargingType || 'Battery Swap',
  speedLabel: station.speedLabel || '',
  connector: station.connector || '',
  pricePerKwh: station.pricePerKwh ?? '',
  availablePorts: station.availablePorts ?? '',
  totalPorts: station.totalPorts ?? '',
  operatingHours: station.operatingHours || '',
  openStatus: station.openStatus || '',
});

export default function AdminZoneStations() {
  const { id: zoneId } = useParams();
  const navigate = useNavigate();

  const [zone, setZone] = useState(null);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const locationInputRef = useRef(null);
  const locationAutocompleteRef = useRef(null);
  const [mapsReady, setMapsReady] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchStations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getZoneStations(zoneId, {
        page,
        limit: pageSize,
        search: searchTerm || undefined,
      });
      const items = res?.items || [];
      const meta = res?.meta || {};
      setStations(items);
      setTotal(meta.total ?? items.length);
      setTotalPages(meta.totalPages ?? meta.pages ?? (Math.ceil((meta.total ?? items.length) / pageSize) || 1));
    } catch (error) {
      console.error('Failed to load zone stations', error);
    } finally {
      setLoading(false);
    }
  }, [zoneId, page, pageSize, searchTerm]);

  useEffect(() => {
    let active = true;
    adminService.getZoneById(zoneId)
      .then((z) => { if (active) setZone(z); })
      .catch((e) => console.error('Failed to load zone', e));
    return () => { active = false; };
  }, [zoneId]);

  useEffect(() => {
    const timer = setTimeout(fetchStations, searchTerm ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchStations]);

  // Same Places setup the zone form uses, so admins pick a location instead of
  // typing raw coordinates.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (window.google?.maps?.places) {
        if (!cancelled) setMapsReady(true);
        return;
      }
      const apiKey = env.mapsKey;
      if (!apiKey) return;
      try {
        const loader = new Loader({ apiKey, version: 'weekly', libraries: ['places'] });
        await loader.load();
        if (!cancelled) setMapsReady(true);
      } catch (error) {
        console.error('Error loading Google Maps', error);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  // The input only exists while the modal is mounted, so bind on open.
  useEffect(() => {
    if (!modalOpen || !mapsReady || !locationInputRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(locationInputRef.current, {
      componentRestrictions: { country: 'in' },
      fields: ['formatted_address', 'name', 'geometry'],
    });

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place?.geometry?.location) return;
      setForm((prev) => ({
        ...prev,
        address: place.formatted_address || place.name || '',
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
      }));
      setFormError('');
    });

    locationAutocompleteRef.current = autocomplete;

    return () => {
      listener?.remove?.();
      window.google?.maps?.event?.clearInstanceListeners?.(autocomplete);
      locationAutocompleteRef.current = null;
    };
  }, [modalOpen, mapsReady]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (station) => {
    setEditing(station);
    setForm(toForm(station));
    setFormError('');
    setModalOpen(true);
  };

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);

    if (!form.name.trim() || !form.address.trim()) {
      setFormError('Station name and location are required.');
      return;
    }
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setFormError('Pick the location from the suggestions so its coordinates are captured.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      address: form.address.trim(),
      // Mongo stores GeoJSON as [lng, lat].
      coordinates: { type: 'Point', coordinates: [lng, lat] },
      status: form.status,
      chargingType: form.chargingType || undefined,
      speedLabel: form.speedLabel || undefined,
      connector: form.connector || undefined,
      pricePerKwh: form.pricePerKwh === '' ? undefined : Number(form.pricePerKwh),
      availablePorts: form.availablePorts === '' ? 0 : Number(form.availablePorts),
      totalPorts: form.totalPorts === '' ? 0 : Number(form.totalPorts),
      operatingHours: form.operatingHours || undefined,
      openStatus: form.openStatus || undefined,
    };

    try {
      setSaving(true);
      setFormError('');
      if (editing) {
        await adminService.updateZoneStation(editing._id || editing.id, { ...payload, zone: zoneId });
      } else {
        await adminService.createZoneStation(zoneId, payload);
      }
      setModalOpen(false);
      setPage(1);
      await fetchStations();
    } catch (error) {
      console.error('Failed to save station', error);
      setFormError(error.response?.data?.message || 'Failed to save station');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (station) => {
    if (!window.confirm(`Delete swapping station "${station.name}"?`)) return;
    try {
      await adminService.deleteZoneStation(station._id || station.id);
      await fetchStations();
    } catch (error) {
      console.error('Failed to delete station', error);
      alert(error.response?.data?.message || 'Failed to delete station');
    }
  };

  const prettyStatus = (status) => (status === 'AVAILABLE' ? 'Active' : status === 'BUSY' ? 'Pending' : 'Inactive');

  return (
    <div className="space-y-6 pb-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/zones')}
            className="text-gray-400 hover:text-gray-700 transition-colors"
            title="Back to zones"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="bg-emerald-600 text-white p-3 rounded-xl shadow-sm">
            <BatteryCharging size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Swapping Stations</h1>
            <p className="text-sm text-gray-500">{zone?.name ? `Zone: ${zone.name}` : 'Manage stations inside this zone'}</p>
          </div>
        </div>

        <Button
          variant="primary"
          className="bg-[#ea580c] hover:bg-[#c2410c] border-none text-white shadow-sm gap-2"
          onClick={openCreate}
        >
          <Plus size={16} /> Add Station
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex items-center px-4">
        <Search className="text-gray-400 mr-3" size={20} />
        <input
          type="text"
          placeholder="Search stations by name or address..."
          className="w-full bg-transparent border-none outline-none text-gray-700 py-2"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="p-8 text-center text-gray-500 font-medium">Loading stations...</div>
      ) : stations.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          No swapping stations in this zone yet. Click "Add Station" to create one.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stations.map((station) => (
              <div key={station._id || station.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 pb-0 flex justify-between items-start">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 leading-tight truncate" title={station.name}>{station.name}</h3>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1 truncate" title={station.address}>
                      <MapPin size={14} className="shrink-0" /> {station.address}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-gray-400 shrink-0">
                    <button className="hover:text-green-600 transition-colors" onClick={() => openEdit(station)} title="Edit Station">
                      <Edit3 size={18} strokeWidth={2.5} />
                    </button>
                    <button className="hover:text-red-600 transition-colors" onClick={() => handleDelete(station)} title="Delete Station">
                      <Trash2 size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                <div className="p-5 space-y-3 flex-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Status:</span>
                    <StatusBadge status={prettyStatus(station.status)} />
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Type:</span>
                    <span className="font-medium text-gray-900">{station.chargingType || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Bays:</span>
                    <span className="font-semibold text-gray-900">{station.availablePorts ?? 0} / {station.totalPorts ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Price / kWh:</span>
                    <span className="font-semibold text-gray-900">{station.pricePerKwh != null ? `₹${station.pricePerKwh}` : '—'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Hours:</span>
                    <span className="font-medium text-gray-900">{station.operatingHours || station.openStatus || '—'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={pageSize}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
              loading={loading}
            />
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Swapping Station' : 'Add Swapping Station'}
        size="lg"
        accent={false}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{formError}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Station Name *">
              <input className={inputCls} value={form.name} onChange={setField('name')} placeholder="e.g. MG Road Swap Hub" />
            </Field>
            <Field label="Status">
              <select className={inputCls} value={form.status} onChange={setField('status')}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Location *">
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={locationInputRef}
                className={`${inputCls} pl-9`}
                value={form.address}
                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value, latitude: '', longitude: '' }))}
                placeholder="Search a location..."
                autoComplete="off"
              />
            </div>
            {form.latitude !== '' && form.longitude !== '' ? (
              <p className="text-xs text-emerald-600 flex items-center gap-1 pt-1">
                <LocateFixed size={12} /> Pinned at {Number(form.latitude).toFixed(5)}, {Number(form.longitude).toFixed(5)}
              </p>
            ) : (
              <p className="text-xs text-gray-400 pt-1">
                {mapsReady ? 'Start typing and pick a suggestion to capture the exact point.' : 'Loading location suggestions...'}
              </p>
            )}
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Station Type">
              <input className={inputCls} value={form.chargingType} onChange={setField('chargingType')} placeholder="Battery Swap / DC Fast" />
            </Field>
            <Field label="Connector">
              <input className={inputCls} value={form.connector} onChange={setField('connector')} placeholder="e.g. Battery / CCS2" />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Available Bays">
              <input type="number" min="0" className={inputCls} value={form.availablePorts} onChange={setField('availablePorts')} />
            </Field>
            <Field label="Total Bays">
              <input type="number" min="0" className={inputCls} value={form.totalPorts} onChange={setField('totalPorts')} />
            </Field>
            <Field label="Price / kWh (₹)">
              <input type="number" min="0" step="0.1" className={inputCls} value={form.pricePerKwh} onChange={setField('pricePerKwh')} />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Operating Hours">
              <input className={inputCls} value={form.operatingHours} onChange={setField('operatingHours')} placeholder="e.g. 24x7" />
            </Field>
            <Field label="Open Status Label">
              <input className={inputCls} value={form.openStatus} onChange={setField('openStatus')} placeholder="e.g. Open 24/7" />
            </Field>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={saving} className="bg-[#166534] hover:bg-[#14532d] border-none text-white">
              {editing ? 'Save Changes' : 'Add Station'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-400';

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
