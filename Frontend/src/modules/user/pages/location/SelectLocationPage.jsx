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
    <div className="min-h-screen bg-app pb-12 font-sans relative">
      {/* Header */}
      <div className="bg-app-card border-b border-app-border px-4 py-4 flex items-center gap-3 sticky top-0 z-20 shadow-xs">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-app-muted text-app-text transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-base font-bold text-app-text">Select Location</h1>
      </div>

      <div className="p-4 space-y-6 max-w-lg mx-auto">
        {/* Use Current Location Card */}
        <button
          onClick={handleUseCurrentLocation}
          disabled={status === "loading"}
          className="w-full bg-app-card rounded-2xl border border-app-border p-4 shadow-xs flex items-center justify-between hover:border-[#2E7BE0]/30 hover:bg-app/30 transition-all duration-200 group text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-app-muted flex items-center justify-center text-[#D1FF42] shrink-0">
              <Navigation size={18} className={status === "loading" ? "animate-spin" : ""} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#D1FF42] group-hover:text-[#D1FF42]">
                {status === "loading" ? "Detecting GPS Location..." : "Use Current Location"}
              </h3>
              <p className="text-[11px] text-app-subtle mt-0.5">Enable GPS for accuracy</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-app-subtle group-hover:text-[#D1FF42] transition-colors" />
        </button>

        {/* Saved Addresses Section */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-[12px] font-bold uppercase tracking-wider text-app-subtle">
              Saved Addresses
            </h2>
            <button
              onClick={() => navigate("/user/add-location")}
              className="text-[12px] font-bold text-[#D1FF42] flex items-center gap-1 hover:text-[#D1FF42] transition-colors"
            >
              <Plus size={14} /> Add New
            </button>
          </div>

          {savedAddresses.length === 0 ? (
            <div className="bg-app-card rounded-2xl border border-app-border p-6 text-center shadow-xs">
              <Home size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-xs text-app-subtle mb-3">No saved addresses yet.</p>
              <button
                onClick={() => navigate("/user/add-location")}
                className="px-4 py-2 bg-[#D1FF42] text-[#1A2230] text-xs font-bold rounded-xl shadow-xs hover:bg-[#A9CF2A] transition-colors"
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
                    className={`w-full bg-app-card rounded-2xl border p-4 shadow-xs flex items-start justify-between cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "border-[#2E7BE0] bg-app-muted 20 ring-1 ring-[#2E7BE0]/30"
                        : "border-app-border hover:border-app-border"
                    }`}
                  >
                    <div className="flex items-start gap-3.5 pr-2">
                      <div className="w-10 h-10 rounded-full bg-app-muted flex items-center justify-center text-app-subtle shrink-0 mt-0.5">
                        <Home size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-app-text">{addr.type || "Home"}</h3>
                          {isSelected && (
                            <span className="text-[9px] bg-[#D1FF42] text-[#1A2230] px-2 py-0.5 rounded-full font-bold">
                              Selected
                            </span>
                          )}
                        </div>
                        {addr.phone && (
                          <p className="text-[11px] text-app-subtle font-medium mt-0.5">
                            Phone: {addr.phone}
                          </p>
                        )}
                        <p className="text-[11px] text-app-subtle line-clamp-2 mt-1 leading-relaxed">
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
                        className="w-7 h-7 flex items-center justify-center text-red-500 hover:bg-red-500/15 rounded-full transition-colors"
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
