import { ArrowLeft, MapPin, Navigation, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserLocation } from "../../../../hooks/useLocation";
import { locationStorageService } from "../../../../services/locationStorageService";

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || "";

const AddLocationPage = () => {
  const navigate = useNavigate();
  const { location, addSavedAddress } = useUserLocation();

  const [mapCenter, setMapCenter] = useState({
    lat: location?.latitude || 22.7196,
    lng: location?.longitude || 75.8577,
  });

  const [addressForm, setAddressForm] = useState({
    primaryAddress: location?.primaryAddress || location?.title || "Pawar Villa",
    secondaryAddress: location?.secondaryAddress || "Talawali Chanda",
    city: location?.city || "Indore",
    state: location?.state || "Madhya Pradesh",
    pincode: location?.pincode || "452007",
    formattedAddress: location?.formattedAddress || "Pawar Villa, N-430, Singapore Green View, Risi Nagar, Talawali Chanda, Indore, Madhya Pradesh - 452007",
    phone: "9755633147",
    type: "Home",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);

  // Update address form when map pin drops on a new location
  const handleLocationChange = useCallback(async (lat, lng) => {
    setMapCenter({ lat, lng });
    setIsGeocodingLoading(true);
    try {
      const geo = await locationStorageService.reverseGeocode(lat, lng);
      setAddressForm((prev) => ({
        ...prev,
        primaryAddress: geo.primaryAddress || geo.title || "Selected Location",
        secondaryAddress: geo.secondaryAddress || prev.secondaryAddress,
        city: geo.city || "Indore",
        state: geo.state || "Madhya Pradesh",
        pincode: geo.pincode || "452001",
        formattedAddress: geo.formattedAddress || `${geo.title}, ${geo.subtitle}`,
      }));
    } catch (err) {
      console.error("Geocode error on pin move:", err);
    } finally {
      setIsGeocodingLoading(false);
    }
  }, []);

  // Use current GPS location
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        handleLocationChange(latitude, longitude);
        if (mapRef.current) {
          mapRef.current.panTo({ lat: latitude, lng: longitude });
        }
      },
      (err) => console.warn("GPS error:", err),
      { enableHighAccuracy: true }
    );
  };

  // Load Google Maps JS SDK dynamically if not loaded
  useEffect(() => {
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }
    if (!GOOGLE_MAPS_KEY) {
      setMapLoaded(false);
      return;
    }

    const existingScript = document.getElementById("google-maps-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "google-maps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places`;
      script.async = true;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    } else {
      existingScript.addEventListener("load", () => setMapLoaded(true));
    }
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapLoaded || !window.google || !window.google.maps) return;
    const mapElement = document.getElementById("add-location-map");
    if (!mapElement) return;

    const map = new window.google.maps.Map(mapElement, {
      center: mapCenter,
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: true,
    });
    mapRef.current = map;

    // Handle map drag end -> update center pin location
    map.addListener("idle", () => {
      const center = map.getCenter();
      if (center) {
        const newLat = center.lat();
        const newLng = center.lng();
        // threshold check to avoid infinite loops
        if (Math.abs(newLat - mapCenter.lat) > 0.0001 || Math.abs(newLng - mapCenter.lng) > 0.0001) {
          handleLocationChange(newLat, newLng);
        }
      }
    });

    // Autocomplete input setup
    const searchInput = document.getElementById("location-search-input");
    if (searchInput && window.google.maps.places) {
      const autocomplete = new window.google.maps.places.Autocomplete(searchInput);
      autocompleteRef.current = autocomplete;
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          map.panTo({ lat, lng });
          map.setZoom(16);
          handleLocationChange(lat, lng);
        }
      });
    }
  }, [mapLoaded]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalLocationObj = {
      ...addressForm,
      id: `addr-${Date.now()}`,
      title: addressForm.primaryAddress || "Home",
      subtitle: `${addressForm.city}, ${addressForm.state}`,
      latitude: mapCenter.lat,
      longitude: mapCenter.lng,
    };

    addSavedAddress(finalLocationObj);
    navigate("/user/home");
  };

  return (
    <div className="min-h-screen bg-white pb-12 font-sans relative flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-30 shadow-xs">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-700 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-base font-bold text-gray-900">Add delivery location</h1>
      </div>

      {/* Map Container & Search Overlay */}
      <div className="relative w-full h-[280px] bg-gray-100 border-b border-gray-200">
        {/* Search Input Bar */}
        <div className="absolute top-4 left-4 right-4 z-20">
          <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-md border border-gray-100">
            <Search size={18} className="text-[#FF5A1F]" />
            <input
              id="location-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search area, street, landmark..."
              className="flex-1 bg-transparent text-xs text-gray-900 placeholder-gray-400 outline-none"
            />
          </div>
        </div>

        {/* Map View Element */}
        <div id="add-location-map" className="w-full h-full">
          {!mapLoaded && (
            <div className="w-full h-full flex items-center justify-center bg-[#E5E3DF] text-xs font-semibold text-gray-600">
              Initializing Google Map...
            </div>
          )}
        </div>

        {/* Center Pin Marker Icon */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-10">
          <div className="relative flex flex-col items-center">
            <div className="w-8 h-8 bg-emerald-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white animate-bounce">
              <MapPin size={18} />
            </div>
            <div className="w-2.5 h-2.5 bg-black/40 rounded-full blur-[1px] mt-0.5" />
          </div>
        </div>

        {/* Floating "Use My Location" Button */}
        <button
          onClick={handleUseMyLocation}
          className="absolute bottom-4 right-4 z-20 bg-white px-4 py-2.5 rounded-full shadow-lg border border-gray-100 text-xs font-bold text-[#FF5A1F] flex items-center gap-2 hover:bg-[#FFF0EB] transition-all active:scale-95"
        >
          <Navigation size={14} className="fill-[#FF5A1F]" />
          Use My Location
        </button>
      </div>

      {/* Address Form Section */}
      <div className="flex-1 p-4 max-w-lg mx-auto w-full space-y-4">
        {/* Pinned Location Card */}
        <div className="bg-[#FFF5F2] border border-[#FFE0D6] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#C5221F] mb-1">
            <MapPin size={14} />
            <span className="uppercase tracking-wider">PINNED LOCATION</span>
          </div>
          <p className="text-xs text-gray-800 leading-relaxed font-medium">
            {isGeocodingLoading ? "Updating pinned address..." : addressForm.formattedAddress}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Primary Address */}
          <div>
            <label className="block text-[11px] font-bold text-gray-800 mb-1.5">
              Primary Address (Street / Area / Landmark)
            </label>
            <input
              type="text"
              required
              value={addressForm.primaryAddress}
              onChange={(e) => setAddressForm({ ...addressForm, primaryAddress: e.target.value })}
              className="w-full bg-white rounded-xl border border-gray-200 px-4 py-3 text-xs text-gray-900 focus:border-[#FF5A1F] focus:ring-1 focus:ring-[#FF5A1F] outline-none transition-all"
              placeholder="e.g. Pawar Villa"
            />
          </div>

          {/* Secondary Address */}
          <div>
            <label className="block text-[11px] font-bold text-gray-800 mb-1.5">
              Secondary Address (House No. / Flat / Floor)
            </label>
            <input
              type="text"
              value={addressForm.secondaryAddress}
              onChange={(e) => setAddressForm({ ...addressForm, secondaryAddress: e.target.value })}
              className="w-full bg-white rounded-xl border border-gray-200 px-4 py-3 text-xs text-gray-900 focus:border-[#FF5A1F] focus:ring-1 focus:ring-[#FF5A1F] outline-none transition-all"
              placeholder="e.g. Talawali Chanda"
            />
          </div>

          {/* City & State Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-800 mb-1.5">City</label>
              <input
                type="text"
                required
                value={addressForm.city}
                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                className="w-full bg-white rounded-xl border border-gray-200 px-4 py-3 text-xs text-gray-900 focus:border-[#FF5A1F] focus:ring-1 focus:ring-[#FF5A1F] outline-none transition-all"
                placeholder="Indore"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-800 mb-1.5">State</label>
              <input
                type="text"
                required
                value={addressForm.state}
                onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                className="w-full bg-white rounded-xl border border-gray-200 px-4 py-3 text-xs text-gray-900 focus:border-[#FF5A1F] focus:ring-1 focus:ring-[#FF5A1F] outline-none transition-all"
                placeholder="Madhya Pradesh"
              />
            </div>
          </div>

          {/* Pincode / ZIP */}
          <div>
            <label className="block text-[11px] font-bold text-gray-800 mb-1.5">Pincode / ZIP</label>
            <input
              type="text"
              required
              value={addressForm.pincode}
              onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
              className="w-full bg-white rounded-xl border border-gray-200 px-4 py-3 text-xs text-gray-900 focus:border-[#FF5A1F] focus:ring-1 focus:ring-[#FF5A1F] outline-none transition-all"
              placeholder="452007"
            />
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="w-full py-3.5 bg-[#FF5A1F] text-white font-bold text-xs rounded-xl shadow-md hover:bg-[#E64D00] active:scale-95 transition-all mt-4"
          >
            Save Address & Set Location
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddLocationPage;
