import { ArrowLeft, ChevronRight, Home, Navigation, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserLocation } from "../../../../hooks/useLocation";

const SelectLocationPage = () => {
  const navigate = useNavigate();
  const { location, savedAddresses, setLocation, requestCurrentLocation, deleteSavedAddress, status } = useUserLocation();

  const handleUseCurrentLocation = async () => {
    await requestCurrentLocation();
    navigate("/user/home");
  };

  const handleSelectAddress = (addr) => {
    setLocation(addr);
    navigate("/user/home");
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-12 font-sans relative">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-20 shadow-xs">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-700 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-base font-bold text-gray-900">Select Location</h1>
      </div>

      <div className="p-4 space-y-6 max-w-lg mx-auto">
        {/* Use Current Location Card */}
        <button
          onClick={handleUseCurrentLocation}
          disabled={status === "loading"}
          className="w-full bg-white rounded-2xl border border-gray-100 p-4 shadow-xs flex items-center justify-between hover:border-[#FF5A1F]/30 hover:bg-[#FFF0EB]/30 transition-all duration-200 group text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#FFF0EB] flex items-center justify-center text-[#FF5A1F] shrink-0">
              <Navigation size={18} className={status === "loading" ? "animate-spin" : ""} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#FF5A1F] group-hover:text-[#E64D00]">
                {status === "loading" ? "Detecting GPS Location..." : "Use Current Location"}
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Enable GPS for accuracy</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-gray-400 group-hover:text-[#FF5A1F] transition-colors" />
        </button>

        {/* Saved Addresses Section */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-[12px] font-bold uppercase tracking-wider text-gray-500">
              Saved Addresses
            </h2>
            <button
              onClick={() => navigate("/user/add-location")}
              className="text-[12px] font-bold text-[#FF5A1F] flex items-center gap-1 hover:text-[#E64D00] transition-colors"
            >
              <Plus size={14} /> Add New
            </button>
          </div>

          {savedAddresses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-xs">
              <Home size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-xs text-gray-500 mb-3">No saved addresses yet.</p>
              <button
                onClick={() => navigate("/user/add-location")}
                className="px-4 py-2 bg-[#FF5A1F] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#E64D00] transition-colors"
              >
                + Add Delivery Location
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {savedAddresses.map((addr) => {
                const isSelected = location?.id === addr.id || location?.title === addr.type || location?.title === addr.primaryAddress;
                return (
                  <div
                    key={addr.id}
                    onClick={() => handleSelectAddress(addr)}
                    className={`w-full bg-white rounded-2xl border p-4 shadow-xs flex items-start justify-between cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "border-[#FF5A1F] bg-[#FFF0EB]/20 ring-1 ring-[#FF5A1F]/30"
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div className="flex items-start gap-3.5 pr-2">
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 shrink-0 mt-0.5">
                        <Home size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-gray-900">{addr.type || "Home"}</h3>
                          {isSelected && (
                            <span className="text-[9px] bg-[#FF5A1F] text-white px-2 py-0.5 rounded-full font-bold">
                              Selected
                            </span>
                          )}
                        </div>
                        {addr.phone && (
                          <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                            Phone: {addr.phone}
                          </p>
                        )}
                        <p className="text-[11px] text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                          {addr.formattedAddress || `${addr.primaryAddress}, ${addr.secondaryAddress || ""}, ${addr.city}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSavedAddress(addr.id);
                        }}
                        className="w-7 h-7 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete Address"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectLocationPage;
