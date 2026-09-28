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
    <div className="h-[100dvh] w-full max-w-[430px] mx-auto relative flex flex-col justify-end p-5 font-sans overflow-hidden bg-[#F8F9FA] shadow-2xl">
      
      {/* Background Image Layer */}
      <img 
        src="/assets/loginpagebg.png" 
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover object-top z-0"
      />
      
      {/* Spacer to push card to bottom */}
      <div className="flex-1" />

      {/* --- Form Container (White Card) --- */}
      <div className="relative z-20 bg-white w-full max-w-md mx-auto rounded-[32px] px-6 py-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] mb-20 transition-all duration-500 ease-out focus-within:-translate-y-12 focus-within:shadow-[0_40px_80px_rgba(0,0,0,0.15)]">
        
        <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
          
          <label className="block text-[13px] font-bold text-gray-900 mb-2 mt-4">
            City
          </label>
          
          {/* Custom Compact Dropdown */}
          <div className="relative mb-4" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className={`flex items-center justify-between w-full h-[52px] border ${
                isDropdownOpen ? "border-[#272664] ring-2 ring-[#272664]/10" : "border-gray-200"
              } rounded-[16px] bg-white px-3.5 transition-all text-left focus:outline-none`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <MapPin size={18} className="text-[#272664] shrink-0" />
                <span className={`text-[15px] font-medium truncate ${city ? "text-gray-900" : "text-gray-400"}`}>
                  {loadingCities ? "Loading cities..." : city || "Select your city"}
                </span>
              </div>
              <ChevronDown
                size={18}
                className={`text-gray-400 transition-transform duration-200 shrink-0 ${
                  isDropdownOpen ? "rotate-180 text-[#272664]" : ""
                }`}
              />
            </button>

            {/* Floating Menu */}
            {isDropdownOpen && (
              <div className="absolute top-[calc(100%+6px)] left-0 w-full z-50 bg-white border border-gray-100 rounded-[20px] shadow-[0_12px_32px_rgba(0,0,0,0.14)] p-1.5 flex flex-col gap-1 max-h-48 overflow-y-auto animate-in fade-in-50 duration-150">
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
                          ? "bg-[#272664]/10 text-[#272664] font-bold"
                          : "text-gray-700 hover:bg-gray-100 font-medium"
                      }`}
                    >
                      <span className="truncate">{cityName}</span>
                      {isSelected && <Check size={16} className="text-[#272664] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <label className="block text-[13px] font-bold text-gray-900 mb-2">
            Mobile Number
          </label>
          
          {/* Custom Input Field */}
          <div className="flex items-center w-full h-[52px] border border-gray-200 rounded-[16px] overflow-hidden bg-white focus-within:border-[#272664] focus-within:ring-2 focus-within:ring-[#272664]/10 transition-all">
            
            {/* Country Code Selector */}
            <div className="flex items-center h-full px-3 bg-white gap-2 cursor-pointer">
              <span className="text-[18px]">🇮🇳</span>
              <span className="text-[14px] font-bold text-gray-900">+91</span>
              <ChevronDown size={16} className="text-gray-400" />
            </div>
            
            {/* Divider */}
            <div className="h-6 w-[1px] bg-gray-200 mx-1"></div>
            
            {/* Input */}
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="Enter your mobile number"
              className="flex-1 h-full bg-transparent px-3 text-[15px] font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal focus:outline-none"
            />
          </div>

          {/* Continue Button */}
          <button 
            type="submit"
            disabled={loading || phone.length < 10}
            className="w-full h-[52px] mt-6 bg-[#272664] hover:bg-[#1e1d4d] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[16px] font-bold rounded-[16px] flex items-center justify-center transition-all shadow-md active:scale-[0.98]"
          >
            {loading ? "Please wait..." : "Continue"}
            {!loading && <ArrowRight size={18} className="ml-2" />}
          </button>

        </form>

        {/* App Links */}
        <div className="flex justify-center items-center gap-4 mt-6 text-xs font-medium text-gray-500">
          <Link to="/user/profile/terms" className="hover:text-[#272664] transition-colors">Terms</Link>
          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
          <Link to="/user/profile/privacy" className="hover:text-[#272664] transition-colors">Privacy</Link>
          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
          <Link to="/user/support" className="hover:text-[#272664] transition-colors">Support</Link>
        </div>
      </div>

    </div>
  );
};

export default LoginPage;
