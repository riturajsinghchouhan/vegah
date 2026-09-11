import {
  BadgeIndianRupee,
  Bell,
  Calendar,
  ChevronDown,
  ChevronRight,
  Copy,
  Headphones,
  Loader2,
  MapPin,
  Mic,
  Search,
  ShieldCheck,
  Tag,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import VehicleCard from "../../../../components/vehicle/VehicleCard";
import { useAuth } from "../../../../hooks/useAuth";
import { useUserLocation } from "../../../../hooks/useLocation";
import { userService } from "../../../../services/userService";
import { vehicleService } from "../../../../services/vehicleService";

// Category fallback icons
const CATEGORY_IMAGES = {
  default1: "/assets/category/image.png",
  default2: "/assets/category/dfafa.png",
};

const VehicleSkeleton = () => (
  <div className="min-w-[160px] bg-white rounded-[16px] border border-gray-100 p-3 animate-pulse">
    <div className="h-[90px] bg-gray-100 rounded-lg mb-3" />
    <div className="h-3 bg-gray-100 rounded w-3/4 mb-2" />
    <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
    <div className="h-4 bg-gray-100 rounded w-2/3" />
  </div>
);

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { location } = useUserLocation();

  const [vehicles, setVehicles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [zones, setZones] = useState([]);
  const [activeCouponIndex, setActiveCouponIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState(null);
  const [loading, setLoading] = useState(true);

  // Booking form state
  const [selectedZone, setSelectedZone] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const [vehiclesData, categoriesData, couponsData, zonesData] = await Promise.allSettled([
          vehicleService.listVehicles({ limit: 8, city: location?.city }),
          vehicleService.getCategories(),
          userService.getActiveCoupons(),
          userService.getPublicZones(),
        ]);

        if (vehiclesData.status === "fulfilled") setVehicles(vehiclesData.value);
        if (categoriesData.status === "fulfilled") setCategories(categoriesData.value.slice(0, 5));
        if (couponsData.status === "fulfilled") setCoupons(couponsData.value);
        if (zonesData.status === "fulfilled") setZones(zonesData.value);
      } catch (err) {
        console.error("Failed to load home data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, [location?.city]);

  // Auto-rotate coupons
  useEffect(() => {
    if (coupons.length <= 1) return;
    const timer = setInterval(() => {
      setActiveCouponIndex((i) => (i + 1) % coupons.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [coupons]);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  const handleSearchScoots = () => {
    const params = new URLSearchParams();
    if (selectedZone) params.set("zone", selectedZone);
    if (startDate) params.set("start", startDate);
    if (endDate) params.set("end", endDate);
    navigate(`/user/vehicles?${params.toString()}`);
  };

  const userInitial = user?.fullName?.charAt(0)?.toUpperCase() || "U";
  const activeCoupon = coupons[activeCouponIndex];

  return (
    <div className="bg-[#FAFAFA] min-h-screen pb-24 relative overflow-x-hidden font-sans">
      
      {/* Header (Image 3) */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <div 
          onClick={() => navigate("/user/select-location")}
          className="flex items-start gap-2.5 cursor-pointer group p-1 -ml-1 rounded-xl hover:bg-gray-100/60 transition-colors"
        >
          <MapPin size={22} className="text-[#FF5500] mt-0.5 shrink-0" />
          <div>
            <div className="flex items-center gap-1">
              <h2 className="text-sm font-bold text-gray-900 group-hover:text-[#FF5500] transition-colors truncate max-w-[180px]">
                {location?.title || location?.primaryAddress || "Select Location"}
              </h2>
              <ChevronDown size={14} className="text-gray-900 group-hover:text-[#FF5500] transition-colors shrink-0" />
            </div>
            <p className="text-[10px] text-gray-500 truncate max-w-[200px]">
              {location?.subtitle || (location?.city ? `${location.city}, ${location.state || "India"}` : "Madhya Pradesh, India")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-1 hover:bg-gray-100 rounded-full transition-colors">
            <Bell size={22} className="text-gray-800" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#FF5500] border-2 border-white" />
          </button>
          <Link to="/user/profile">
            <div className="h-8 w-8 rounded-full bg-[#FF5500] flex items-center justify-center text-white font-bold text-sm shadow-sm hover:scale-105 transition-transform">
              {userInitial}
            </div>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 mb-5 flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white rounded-full border border-gray-200 px-4 py-3 shadow-sm">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search destination, scoot or offer"
            className="flex-1 bg-transparent text-xs text-gray-800 placeholder-gray-400 outline-none"
          />
          <Mic size={18} className="text-gray-800" />
        </div>
        <div className="flex items-center gap-1.5 bg-white rounded-full border border-gray-200 px-3 py-2 shadow-sm whitespace-nowrap">
          <Tag size={18} className="text-pink-500" />
          <div className="leading-tight">
            <p className="text-[10px] font-bold text-gray-900">Offers</p>
            <p className="text-[8px] text-gray-500">
              {coupons.length > 0 ? `${coupons.length} Active` : "Loading..."}
            </p>
          </div>
        </div>
      </div>

      {/* Categories from API */}
      <div className="px-4 mb-6 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-3 w-max">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 w-[80px] py-3 shadow-sm animate-pulse">
                  <div className="h-8 w-14 bg-gray-100 rounded mb-2" />
                  <div className="h-2 w-12 bg-gray-100 rounded mb-1" />
                  <div className="h-2 w-10 bg-gray-100 rounded" />
                </div>
              ))
            : categories.length > 0
              ? categories.map((cat, i) => (
                  <Link
                    key={cat._id}
                    to={`/user/vehicles?category=${cat._id}`}
                    className={`flex flex-col items-center justify-center bg-white rounded-2xl border w-[80px] py-3 shadow-sm transition-colors ${
                      i === 0 ? "border-[#FF5500]" : "border-gray-100"
                    }`}
                  >
                    <img
                      src={cat.imageUrl || (i % 2 === 0 ? CATEGORY_IMAGES.default1 : CATEGORY_IMAGES.default2)}
                      alt={cat.name}
                      className="h-8 object-contain mb-2"
                      onError={(e) => { e.target.src = CATEGORY_IMAGES.default1; }}
                    />
                    <span className="text-[10px] font-bold text-gray-900 text-center leading-tight px-1">{cat.name}</span>
                    <span className="text-[8px] text-gray-500">From ₹{cat.basePrice || 799}</span>
                  </Link>
                ))
              : (
                  <div className="flex items-center justify-center w-full py-4 text-gray-400">
                    <p className="text-xs">No categories found</p>
                  </div>
                )}
        </div>
      </div>

      {/* Hero Banner */}
      <div className="px-4 mb-6">
        <Link to="/user/vehicles" className="block relative rounded-[20px] overflow-hidden shadow-md bg-white">
          <img
            src="/assets/herobanner.png"
            alt="Drive More, Save Big! Up to 40% OFF"
            className="w-full object-cover"
          />
        </Link>
      </div>

      {/* Rent a Scoot — Booking Form with real Zones */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-3.5 sm:p-4 relative">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Rent a Scoot</h2>
            <span className="text-[10px] font-semibold text-[#FF5500] bg-[#FFF0EB] px-2.5 py-0.5 rounded-full">
              Flexible Rentals
            </span>
          </div>
          
          <div className="space-y-2.5">
            {/* Zone Selector */}
            <div className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50/50 focus-within:bg-white focus-within:border-[#FF5500] transition-colors relative">
              <label className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-0.5 flex items-center gap-1">
                <MapPin size={11} className="text-[#FF5500]" /> Pickup Location
              </label>
              <div className="flex items-center justify-between relative">
                <select
                  className="w-full appearance-none bg-transparent text-xs sm:text-sm font-semibold text-gray-800 outline-none pr-6 cursor-pointer"
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                >
                  <option value="" disabled>Select pickup location</option>
                  {zones.length > 0 &&
                    zones.map((z) => (
                      <option key={z._id} value={z._id}>
                        {z.name}{z.address ? ` — ${z.address}` : ""}
                      </option>
                    ))}
                </select>
                <ChevronDown size={14} className="text-gray-400 absolute right-0 pointer-events-none" />
              </div>
            </div>

            {/* Date Selectors — Compact & Auto-Adjusting Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Pick-up */}
              <div className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50/50 focus-within:bg-white focus-within:border-[#FF5500] transition-colors">
                <label className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-0.5 flex items-center gap-1">
                  <Calendar size={11} className="text-[#FF5500]" /> Pick-up Date & Time
                </label>
                <input
                  type="datetime-local"
                  className="w-full bg-transparent text-xs font-semibold text-gray-800 outline-none cursor-pointer"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              {/* Drop-off */}
              <div className="border border-gray-200 rounded-xl px-3 py-2 bg-gray-50/50 focus-within:bg-white focus-within:border-[#FF5500] transition-colors">
                <label className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-0.5 flex items-center gap-1">
                  <Calendar size={11} className="text-gray-400" /> Drop-off Date & Time
                </label>
                <input
                  type="datetime-local"
                  className="w-full bg-transparent text-xs font-semibold text-gray-800 outline-none cursor-pointer"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <button
              onClick={handleSearchScoots}
              className="bg-[#FF5500] text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold shadow-md w-full mt-1.5 hover:bg-[#E64D00] transition active:scale-[0.98]"
            >
              Search Available Scoots <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Active Coupon from API */}
      {(loading || coupons.length > 0) && (
        <div className="px-4 mb-6">
          {loading ? (
            <div className="bg-[#F0FDF4] border border-green-200 border-dashed rounded-xl p-3 animate-pulse h-16" />
          ) : activeCoupon ? (
            <div className="bg-[#F0FDF4] border border-green-200 border-dashed rounded-xl p-3 flex items-center justify-between transition-all">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 rounded-lg p-2 text-green-600">
                  <Tag size={20} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-900">
                    {activeCoupon.type === "PERCENTAGE"
                      ? `Flat ${activeCoupon.value}% OFF!`
                      : `₹${activeCoupon.value} OFF!`}
                    {activeCoupon.description && ` — ${activeCoupon.description}`}
                  </h3>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    Use code{" "}
                    <span className="font-bold text-green-600">{activeCoupon.code}</span>
                    {activeCoupon.minBookingAmount > 0 && (
                      <span className="text-gray-400"> · Min ₹{activeCoupon.minBookingAmount}</span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleCopyCode(activeCoupon.code)}
                className="flex items-center gap-1 border border-green-500 text-green-600 text-[10px] font-bold px-3 py-1.5 rounded-full bg-white transition-colors hover:bg-green-50"
              >
                <Copy size={10} />
                {copiedCode === activeCoupon.code ? "Copied!" : "Copy"}
              </button>
            </div>
          ) : null}

          {/* Coupon dots */}
          {coupons.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-2">
              {coupons.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveCouponIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeCouponIndex ? "w-4 bg-green-500" : "w-1.5 bg-gray-300"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Popular Scoots from API */}
      <div className="mb-6 pl-4">
        <div className="flex items-center justify-between pr-4 mb-4">
          <h2 className="text-base font-bold text-gray-900">Popular Scoots</h2>
          <Link to="/user/vehicles" className="text-xs font-bold text-[#FF5500] flex items-center">
            View All <ChevronRight size={14} />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 pr-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <VehicleSkeleton key={i} />)
            : vehicles.length > 0
              ? vehicles.map((vehicle) => (
                  <div key={vehicle.id} className="min-w-[160px]">
                    <VehicleCard vehicle={vehicle} />
                  </div>
                ))
              : (
                  <div className="flex items-center justify-center w-full py-8 text-gray-400">
                    <div className="text-center">
                      <Loader2 className="mx-auto mb-2 animate-spin" size={24} />
                      <p className="text-xs">No vehicles found nearby</p>
                    </div>
                  </div>
                )}
        </div>
      </div>


    </div>
  );
};

export default HomePage;
