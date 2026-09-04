import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, ArrowLeft, Save, X, Shapes, Search, MousePointerClick } from 'lucide-react';
import { Loader } from '@googlemaps/js-api-loader';
import { adminService } from '../services/adminService';
import { env } from '../../../config/env';

const MIN_POINTS = 3;
const MAX_POINTS = 10;

// Sort points radially to form a clean, non-self-intersecting polygon
const orderPointsRadially = (pts) => {
  const points = pts
    .map(p => ({
      lat: typeof p.lat === 'function' ? p.lat() : p.lat,
      lng: typeof p.lng === 'function' ? p.lng() : p.lng,
    }))
    .filter(p => typeof p.lat === 'number' && typeof p.lng === 'number');

  if (points.length < 3) return points;

  const cx = points.reduce((s, p) => s + p.lng, 0) / points.length;
  const cy = points.reduce((s, p) => s + p.lat, 0) / points.length;

  return [...points].sort((a, b) =>
    Math.atan2(a.lat - cy, a.lng - cx) - Math.atan2(b.lat - cy, b.lng - cx)
  );
};

export default function AdminZoneForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const title = isEditing ? "Edit Zone" : "Add New Zone";

  // Map DOM and instance refs
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const mapClickListenerRef = useRef(null);
  const drawPointsRef = useRef([]);
  const isDrawingRef = useRef(false);
  const polygonRef = useRef(null);
  const pathMarkersRef = useRef([]);
  const existingZonesPolygonsRef = useRef([]);
  const autocompleteInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  // States
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState(env.mapsKey || "");
  const [mapLoading, setMapLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  const [formData, setFormData] = useState({
    country: "India",
    zoneName: "",
    unit: "kilometer",
  });

  const [coordinates, setCoordinates] = useState([]);
  const [locationSearch, setLocationSearch] = useState("");
  const [existingZones, setExistingZones] = useState([]);

  useEffect(() => {
    fetchExistingZones();
    loadGoogleMaps();
    if (isEditing && id) fetchZone();
  }, [id, isEditing]);

  useEffect(() => {
    if (formData.country === "India" && mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({ lat: 20.5937, lng: 78.9629 });
      mapInstanceRef.current.setZoom(5);
    }
  }, [formData.country]);

  // Google Places Autocomplete setup
  useEffect(() => {
    if (!mapLoading && mapInstanceRef.current && autocompleteInputRef.current && window.google?.maps?.places && !autocompleteRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(autocompleteInputRef.current, {
        componentRestrictions: { country: 'in' }
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry && place.geometry.location && mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(place.geometry.location);
          mapInstanceRef.current.setZoom(15);
          setLocationSearch(place.formatted_address || place.name || "");
        }
      });
      autocompleteRef.current = autocomplete;
    }
  }, [mapLoading]);

  // If editing existing zone with coordinates, render editable polygon on load
  useEffect(() => {
    if (isEditing && coordinates.length >= 3 && mapInstanceRef.current && window.google && !mapLoading) {
      setTimeout(() => {
        if (mapInstanceRef.current && window.google) {
          isDrawingRef.current = false;
          setIsDrawing(false);
          drawEditablePolygon(window.google, mapInstanceRef.current, coordinates);
        }
      }, 500);
    }
  }, [isEditing, coordinates.length, mapLoading]);

  const fetchExistingZones = async () => {
    try {
      const data = await adminService.getZones();
      if (Array.isArray(data)) {
        const zones = isEditing && id 
          ? data.filter(zone => zone._id !== id)
          : data;
        setExistingZones(zones);
      }
    } catch (error) {
      console.error("Failed to load existing zones", error);
      setExistingZones([]);
    }
  };

  const fetchZone = async () => {
    try {
      setLoading(true);
      const zoneData = await adminService.getZoneById(id);
      if (zoneData) {
        setFormData({
          country: zoneData.subtitle || zoneData.country || "India",
          zoneName: zoneData.name || "",
          unit: zoneData.unit || "kilometer",
        });
        
        const coords = zoneData.boundary || zoneData.coordinates || [];
        if (Array.isArray(coords) && coords.length > 0) {
          setCoordinates(coords);
        }
      }
    } catch (error) {
      console.error("Failed to fetch zone", error);
      alert("Failed to load zone details");
      navigate("/admin/zones");
    } finally {
      setLoading(false);
    }
  };

  const loadGoogleMaps = async () => {
    try {
      const apiKey = env.mapsKey || googleMapsApiKey;
      setGoogleMapsApiKey(apiKey);

      let retries = 0;
      while (!window.google && retries < 30) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }

      if (window.google && window.google.maps) {
        initializeMap(window.google);
        return;
      }

      if (apiKey) {
        const loader = new Loader({
          apiKey: apiKey,
          version: "weekly",
          libraries: ["places", "geometry"]
        });
        const google = await loader.load();
        initializeMap(google);
      } else {
        setMapLoading(false);
      }
    } catch (error) {
      console.error("Error loading Google Maps", error);
      setMapLoading(false);
    }
  };

  const renderVertexMarkers = (google, map, latLngs) => {
    pathMarkersRef.current?.forEach(m => m.setMap(null));
    pathMarkersRef.current = latLngs.map((latLng, i) => new google.maps.Marker({
      position: latLng,
      map,
      clickable: false,
      icon: { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#9333ea", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 2 },
      zIndex: 1000,
      title: `Point ${i + 1}`,
    }));
  };

  const renderDrawingPolygon = (google, map) => {
    const points = drawPointsRef.current;
    if (polygonRef.current) { polygonRef.current.setMap(null); polygonRef.current = null; }

    const ordered = points.length >= 3
      ? orderPointsRadially(points)
      : points.map(p => ({ lat: p.lat(), lng: p.lng() }));

    if (ordered.length >= 2) {
      polygonRef.current = new google.maps.Polygon({
        paths: ordered, fillColor: "#9333ea", fillOpacity: 0.35,
        strokeColor: "#9333ea", strokeWeight: 2,
        clickable: false, editable: false, zIndex: 1,
      });
      polygonRef.current.setMap(map);
    }

    renderVertexMarkers(google, map, points);
    setCoordinates(ordered.map(p => ({
      latitude: parseFloat(p.lat.toFixed(6)),
      longitude: parseFloat(p.lng.toFixed(6)),
    })));
  };

  const drawEditablePolygon = (google, map, coords) => {
    const path = coords.map(c => new google.maps.LatLng(
      c.latitude !== undefined ? c.latitude : c.lat,
      c.longitude !== undefined ? c.longitude : c.lng
    ));

    if (polygonRef.current) { polygonRef.current.setMap(null); polygonRef.current = null; }
    pathMarkersRef.current?.forEach(m => m.setMap(null));
    pathMarkersRef.current = [];

    const polygon = new google.maps.Polygon({
      paths: path, strokeColor: "#9333ea", strokeOpacity: 0.8, strokeWeight: 3,
      fillColor: "#9333ea", fillOpacity: 0.35,
      editable: true, draggable: false, clickable: false,
    });
    polygon.setMap(map);
    polygonRef.current = polygon;

    const sync = () => {
      const p = polygon.getPath();
      const out = [];
      p.forEach(ll => out.push({ latitude: parseFloat(ll.lat().toFixed(6)), longitude: parseFloat(ll.lng().toFixed(6)) }));
      setCoordinates(out);
    };

    const pp = polygon.getPath();
    google.maps.event.addListener(pp, 'set_at', sync);
    google.maps.event.addListener(pp, 'insert_at', sync);
    google.maps.event.addListener(pp, 'remove_at', sync);

    const bounds = new google.maps.LatLngBounds();
    path.forEach(latLng => bounds.extend(latLng));
    map.fitBounds(bounds);
  };

  const finishDrawing = () => {
    const google = window.google, map = mapInstanceRef.current;
    if (!google || !map) return false;

    const points = drawPointsRef.current;
    if (points.length < MIN_POINTS) {
      alert(`Please click at least ${MIN_POINTS} points on the map.`);
      return false;
    }

    const ordered = orderPointsRadially(points);
    const coords = ordered.map(p => ({
      latitude: parseFloat(p.lat.toFixed(6)),
      longitude: parseFloat(p.lng.toFixed(6)),
    }));
    setCoordinates(coords);
    drawEditablePolygon(google, map, coords);
    return true;
  };

  const toggleDrawingMode = () => {
    const google = window.google, map = mapInstanceRef.current;
    if (!google || !map) { alert("Map is still loading."); return; }

    if (isDrawing) {
      if (finishDrawing() === false) return;
      isDrawingRef.current = false;
      setIsDrawing(false);
      map.setOptions({ draggableCursor: null });
      existingZonesPolygonsRef.current.forEach(p => p?.setOptions?.({ clickable: true }));
    } else {
      clearDrawing();
      drawPointsRef.current = [];
      isDrawingRef.current = true;
      setIsDrawing(true);
      map.setOptions({ draggableCursor: 'crosshair' });
      existingZonesPolygonsRef.current.forEach(p => p?.setOptions?.({ clickable: false }));
    }
  };

  const clearDrawing = () => {
    drawPointsRef.current = [];
    if (polygonRef.current) { polygonRef.current.setMap(null); polygonRef.current = null; }
    pathMarkersRef.current?.forEach(m => m.setMap(null));
    pathMarkersRef.current = [];
    setCoordinates([]);
  };

  const initializeMap = (google) => {
    if (!mapRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 20.5937, lng: 78.9629 },
      zoom: 5,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_RIGHT,
        mapTypeIds: [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.SATELLITE]
      },
      zoomControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      scrollwheel: true,
      gestureHandling: 'greedy',
      disableDoubleClickZoom: false,
      clickableIcons: false,
    });

    mapInstanceRef.current = map;

    mapClickListenerRef.current = google.maps.event.addListener(map, 'click', (event) => {
      if (!isDrawingRef.current) return;
      if (drawPointsRef.current.length >= MAX_POINTS) {
        alert(`You can add at most ${MAX_POINTS} points. Click "Finish Drawing" to complete.`);
        return;
      }
      drawPointsRef.current.push(event.latLng);
      renderDrawingPolygon(google, map);
    });

    setMapLoading(false);
    if (isEditing && coordinates.length >= 3) {
      setTimeout(() => {
        if (mapInstanceRef.current && window.google) {
          drawEditablePolygon(window.google, mapInstanceRef.current, coordinates);
        }
      }, 500);
    }
  };

  const drawExistingZonesOnMap = (google, map) => {
    if (!existingZones || existingZones.length === 0) return;

    existingZonesPolygonsRef.current.forEach(polygon => {
      if (polygon) polygon.setMap(null);
    });
    existingZonesPolygonsRef.current = [];

    existingZones.forEach((zone) => {
      const coords = zone.boundary || zone.coordinates || [];
      if (!Array.isArray(coords) || coords.length < 3) return;

      const path = coords.map(coord => {
        const lat = typeof coord === 'object' ? (coord.latitude || coord.lat) : null;
        const lng = typeof coord === 'object' ? (coord.longitude || coord.lng) : null;
        if (lat === null || lng === null) return null;
        return new google.maps.LatLng(lat, lng);
      }).filter(Boolean);

      if (path.length < 3) return;

      const polygon = new google.maps.Polygon({
        paths: path,
        strokeColor: "#3b82f6",
        strokeOpacity: 0.6,
        strokeWeight: 2,
        fillColor: "#3b82f6",
        fillOpacity: 0.15,
        editable: false,
        draggable: false,
        clickable: !isDrawingRef.current,
        zIndex: 0
      });

      polygon.setMap(map);
      existingZonesPolygonsRef.current.push(polygon);

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <strong>${zone.name || 'Unnamed Zone'}</strong><br/>
            <small>Region: ${zone.subtitle || 'India'}</small>
          </div>
        `
      });

      polygon.addListener('click', () => {
        infoWindow.setPosition(polygon.getPath().getAt(0));
        infoWindow.open(map);
      });
    });
  };

  useEffect(() => {
    if (!mapLoading && mapInstanceRef.current && existingZones.length > 0 && window.google) {
      drawExistingZonesOnMap(window.google, mapInstanceRef.current);
    }
  }, [existingZones, mapLoading]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.zoneName || !formData.country || coordinates.length < MIN_POINTS) {
      alert(`Please fill in all details and draw at least ${MIN_POINTS} points on the map.`);
      return;
    }

    try {
      setSaving(true);
      const validCoordinates = coordinates.map(coord => ({
        latitude: parseFloat(coord.latitude !== undefined ? coord.latitude : coord.lat),
        longitude: parseFloat(coord.longitude !== undefined ? coord.longitude : coord.lng),
      }));

      const payload = {
        name: formData.zoneName.trim(),
        subtitle: formData.country,
        unit: formData.unit || "kilometer",
        boundary: validCoordinates,
        status: "ACTIVE"
      };

      if (isEditing && id) {
        await adminService.updateZone(id, payload);
      } else {
        await adminService.createZone(payload);
      }

      navigate("/admin/zones");
    } catch (error) {
      console.error("Failed to save zone", error);
      alert(error.response?.data?.message || "Failed to save zone");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading zone details...</div>;
  }

  return (
    <div className="space-y-6 pb-8 max-w-7xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={() => navigate("/admin/zones")}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        
        <div className="bg-red-500 text-white p-2.5 rounded-xl shadow-sm">
          <MapPin size={22} />
        </div>
        
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">{title}</h1>
          <p className="text-sm text-gray-500">{isEditing ? "Update operational zone boundary" : "Create an operational zone boundary on map"}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          
          {/* Left Panel: Form Details */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-fit space-y-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Zone Details</h2>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Country / Region <span className="text-red-500">*</span>
              </label>
              <select 
                value={formData.country} 
                onChange={(e) => handleInputChange("country", e.target.value)} 
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white" 
                required
              >
                <option value="India">India</option>
                <option value="USA">USA</option>
                <option value="UK">UK</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Create Zone name <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={formData.zoneName} 
                onChange={(e) => handleInputChange("zoneName", e.target.value)} 
                placeholder="Enter zone name (e.g. Indiranagar Zone)" 
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                required 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Unit <span className="text-red-500">*</span>
              </label>
              <select 
                value={formData.unit} 
                onChange={(e) => handleInputChange("unit", e.target.value)} 
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white" 
                required
              >
                <option value="kilometer">Kilometers (km)</option>
                <option value="miles">Miles (mi)</option>
              </select>
            </div>

            <button 
              type="submit" 
              disabled={saving || coordinates.length < MIN_POINTS || !formData.zoneName || !formData.country || isDrawing} 
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors mt-8 shadow-md"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Saving Zone...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>{isEditing ? "Save Changes" : "Create Zone"}</span>
                </>
              )}
            </button>
          </div>

          {/* Right Panel: Interactive Google Map Drawing */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col min-h-[550px]">
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Draw Zone on Map</h2>
                <p className="text-xs text-gray-500">Click on map to mark boundary points ({MIN_POINTS}–{MAX_POINTS} points)</p>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={toggleDrawingMode} 
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm ${
                    isDrawing 
                      ? "bg-red-600 text-white hover:bg-red-700 animate-pulse" 
                      : "bg-purple-600 text-white hover:bg-purple-700"
                  }`}
                >
                  <Shapes size={16} />
                  <span>{isDrawing ? "Finish Drawing" : "Start Drawing"}</span>
                </button>

                {coordinates.length > 0 && (
                  <button 
                    type="button" 
                    onClick={clearDrawing} 
                    className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <X size={16} />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            {isDrawing && (
              <div className="mb-4 bg-purple-50 border border-purple-200 text-purple-900 text-xs p-3 rounded-lg flex items-center justify-between">
                <span>📍 Click anywhere on the map to add boundary points ({coordinates.length}/{MAX_POINTS} added). Click <strong>Finish Drawing</strong> when done.</span>
              </div>
            )}

            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  ref={autocompleteInputRef} 
                  type="text" 
                  placeholder="Search location on map..." 
                  value={locationSearch} 
                  onChange={(e) => setLocationSearch(e.target.value)} 
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                />
              </div>
              {coordinates.length > 0 && (
                <div className="flex items-center justify-between text-xs text-gray-600 mt-2 font-medium">
                  <span>Points marked: <strong className="text-purple-700">{coordinates.length}</strong></span>
                  {coordinates.length < MIN_POINTS && (
                    <span className="text-red-600 font-semibold">(Minimum {MIN_POINTS} points required to create polygon)</span>
                  )}
                </div>
              )}
            </div>

            {/* Map Canvas Container */}
            <div className="relative flex-1 rounded-xl border border-gray-300 overflow-hidden min-h-[420px] bg-slate-100 shadow-inner">
              <div ref={mapRef} className="w-full h-full min-h-[420px]" />
              
              {mapLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100/90 backdrop-blur-sm z-20 rounded-xl">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-3 border-purple-600 border-t-transparent mx-auto mb-3"></div>
                    <p className="text-xs font-semibold text-gray-600">Initializing Interactive Google Map...</p>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </form>
    </div>
  );
}
