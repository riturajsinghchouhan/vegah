import { ArrowRight, ChevronDown, ShieldCheck, Smartphone } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../hooks/useAuth";

const LoginPage = () => {
  const navigate = useNavigate();
  const { requestOtp } = useAuth();
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!phone || phone.length < 10 || !city) return;
    
    setLoading(true);
    await requestOtp(`+91${phone}`);
    navigate("/user/otp", { state: { phone: `+91${phone}`, city } });
  };

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
          <div className="flex items-center w-full h-[52px] border border-gray-200 rounded-[16px] overflow-hidden bg-white focus-within:border-[#272664] focus-within:ring-2 focus-within:ring-[#272664]/10 transition-all mb-4 px-3">
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="flex-1 h-full bg-transparent text-[15px] font-medium text-gray-900 focus:outline-none"
            >
              <option value="" disabled>Select your city</option>
              <option value="Indore">Indore</option>
              <option value="Bhopal">Bhopal</option>
              <option value="Pune">Pune</option>
              <option value="Bangalore">Bangalore</option>
            </select>
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
      </div>

    </div>
  );
};

export default LoginPage;
