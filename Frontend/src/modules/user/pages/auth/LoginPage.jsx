import { ArrowRight, ChevronDown, MapPin, Check } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../hooks/useAuth";
import { userService } from "../../../../services/userService";

const LoginPage = () => {
  const navigate = useNavigate();
  const { requestOtp } = useAuth();
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchCitiesFromZones = async () => {
      try {
        setLoadingCities(true);
        const zonesData = await userService.getPublicZones();
        if (Array.isArray(zonesData) && zonesData.length > 0) {
          // Extract active zone names created by Admin
          const zoneNames = zonesData.map(z => z.name).filter(Boolean);
          const uniqueCities = [...new Set(zoneNames)];
          setCities(uniqueCities);

          const savedCity = localStorage.getItem("userCity");
          if (savedCity && uniqueCities.includes(savedCity)) {
            setCity(savedCity);
          } else if (uniqueCities.length === 1) {
            setCity(uniqueCities[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch zones for city dropdown:", err);
      } finally {
        setLoadingCities(false);
      }
    };

    fetchCitiesFromZones();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!phone || phone.length < 10 || !city) return;
    
    setLoading(true);
    await requestOtp(`+91${phone}`);
    navigate("/user/otp", { state: { phone: `+91${phone}`, city } });
  };

  const displayCities = cities.length > 0 ? cities : ["Indore", "Bhopal", "Pune", "Bangalore"];

  return (
    <div className="h-[100dvh] w-full max-w-[430px] mx-auto relative flex flex-col justify-end p-5 font-sans overflow-hidden bg-app-muted shadow-2xl">
      
      {/* Background Image Layer */}
      <img 
        src="/assets/loginpagebg.png" 
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover object-top z-0"
      />
      
      {/* Spacer to push card to bottom */}
      <div className="flex-1" />

      {/* --- Form Container (White Card) --- */}
      <div className="relative z-20 bg-app-card w-full max-w-md mx-auto rounded-[32px] px-6 py-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] mb-20 transition-all duration-500 ease-out focus-within:-translate-y-12 focus-within:shadow-[0_40px_80px_rgba(0,0,0,0.15)]">
        
        <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
          
          <label className="block text-[13px] font-bold text-app-text mb-2 mt-4">
            City
          </label>
          
          {/* Custom Compact Dropdown */}
          <div className="relative mb-4" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className={`flex items-center justify-between w-full h-[52px] border ${
                isDropdownOpen ? "border-[#2E7BE0] ring-2 ring-[#2E7BE0]/10" : "border-app-border"
              } rounded-[16px] bg-app-card px-3.5 transition-all text-left focus:outline-none`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <MapPin size={18} className="text-[#D1FF42] shrink-0" />
                <span className={`text-[15px] font-medium truncate ${city ? "text-app-text" : "text-app-subtle"}`}>
                  {loadingCities ? "Loading cities..." : city || "Select your city"}
                </span>
              </div>
              <ChevronDown
                size={18}
                className={`text-app-subtle transition-transform duration-200 shrink-0 ${
                  isDropdownOpen ? "rotate-180 text-[#D1FF42]" : ""
                }`}
              />
            </button>

            {/* Floating Menu */}
            {isDropdownOpen && (
              <div className="absolute top-[calc(100%+6px)] left-0 w-full z-50 bg-app-card border border-app-border rounded-[20px] shadow-[0_12px_32px_rgba(0,0,0,0.14)] p-1.5 flex flex-col gap-1 max-h-48 overflow-y-auto animate-in fade-in-50 duration-150">
                {displayCities.map((cityName) => {
                  const isSelected = city === cityName;
                  return (
                    <button
                      key={cityName}
                      type="button"
                      onClick={() => {
                        setCity(cityName);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[14px] text-[14px] transition-all ${
                        isSelected
                          ? "bg-[#2E7BE0]/10 text-[#D1FF42] font-bold"
                          : "text-app-text hover:bg-app-muted font-medium"
                      }`}
                    >
                      <span className="truncate">{cityName}</span>
                      {isSelected && <Check size={16} className="text-[#D1FF42] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <label className="block text-[13px] font-bold text-app-text mb-2">
            Mobile Number
          </label>
          
          {/* Custom Input Field */}
          <div className="flex items-center w-full h-[52px] border border-app-border rounded-[16px] overflow-hidden bg-app-card focus-within:border-[#2E7BE0] focus-within:ring-2 focus-within:ring-[#2E7BE0]/10 transition-all">
            
            {/* Country Code Selector */}
            <div className="flex items-center h-full px-3 bg-app-card gap-2 cursor-pointer">
              <span className="text-[18px]">🇮🇳</span>
              <span className="text-[14px] font-bold text-app-text">+91</span>
              <ChevronDown size={16} className="text-app-subtle" />
            </div>
            
            {/* Divider */}
            <div className="h-6 w-[1px] bg-gray-200 mx-1"></div>
            
            {/* Input */}
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="Enter your mobile number"
              className="flex-1 h-full bg-transparent px-3 text-[15px] font-medium text-app-text placeholder:text-app-subtle placeholder:font-normal focus:outline-none"
            />
          </div>

          {/* Continue Button */}
          <button 
            type="submit"
            disabled={loading || phone.length < 10 || !city}
            className="w-full h-[52px] mt-6 bg-[#D1FF42] hover:bg-[#A9CF2A] disabled:opacity-50 disabled:cursor-not-allowed text-[#1A2230] text-[16px] font-bold rounded-[16px] flex items-center justify-center transition-all shadow-md active:scale-[0.98]"
          >
            {loading ? "Please wait..." : "Continue"}
            {!loading && <ArrowRight size={18} className="ml-2" />}
          </button>

          {/* Without this the button just sits there inert: handleSubmit bails out
              when no city is picked, so a filled-in number alone looked ready to
              submit but did nothing when tapped. */}
          {phone.length >= 10 && !city && (
            <p className="mt-2 text-center text-[12px] font-medium text-[#D1FF42]">
              Select your city to continue
            </p>
          )}

        </form>

        {/* App Links */}
        <div className="flex justify-center items-center gap-4 mt-6 text-xs font-medium text-app-subtle">
          <Link to="/user/profile/terms" className="hover:text-[#D1FF42] transition-colors">Terms</Link>
          <span className="w-1 h-1 bg-app-subtle rounded-full"></span>
          <Link to="/user/profile/privacy" className="hover:text-[#D1FF42] transition-colors">Privacy</Link>
          <span className="w-1 h-1 bg-app-subtle rounded-full"></span>
          <Link to="/user/support" className="hover:text-[#D1FF42] transition-colors">Support</Link>
        </div>
      </div>

    </div>
  );
};

export default LoginPage;
