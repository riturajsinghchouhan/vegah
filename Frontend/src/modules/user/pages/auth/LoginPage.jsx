import { ArrowRight, ChevronDown, ShieldCheck, Smartphone } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../hooks/useAuth";

const LoginPage = () => {
  const navigate = useNavigate();
  const { requestOtp } = useAuth();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!phone || phone.length < 10) return;
    
    setLoading(true);
    await requestOtp(`+91 ${phone}`);
    navigate("/user/otp", { state: { phone: `+91 ${phone}` } });
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
          
          <label className="block text-[13px] font-bold text-gray-900 mb-2">
            Mobile Number
          </label>
          
          {/* Custom Input Field */}
          <div className="flex items-center w-full h-[52px] border border-gray-200 rounded-[16px] overflow-hidden bg-white focus-within:border-[#FF5A1F] focus-within:ring-2 focus-within:ring-[#FF5A1F]/10 transition-all">
            
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
            className="w-full h-[52px] mt-6 bg-[#FF5A1F] hover:bg-[#E54D15] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[16px] font-bold rounded-[16px] flex items-center justify-center transition-all shadow-md active:scale-[0.98]"
          >
            {loading ? "Please wait..." : "Continue"}
            {!loading && <ArrowRight size={18} className="ml-2" />}
          </button>

          {/* Temporarily commented out as requested
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-[1px] bg-gray-100"></div>
            <span className="text-[12px] font-medium text-gray-400">or continue with</span>
            <div className="flex-1 h-[1px] bg-gray-100"></div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button type="button" className="w-[52px] h-[52px] rounded-full border border-gray-100 bg-white flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors active:scale-95">
              <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </button>
            <button type="button" className="w-[52px] h-[52px] rounded-full border border-gray-100 bg-white flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors active:scale-95">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="black" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.365 14.545C16.337 11.536 18.828 10.063 18.943 9.992C17.525 7.914 15.342 7.596 14.6 7.504C12.752 7.319 10.963 8.601 10.015 8.601C9.07 8.601 7.618 7.525 6.096 7.554C4.103 7.583 2.254 8.718 1.233 10.51C-0.846 14.128 0.7 19.467 2.736 22.428C3.722 23.864 4.887 25.485 6.438 25.426C7.935 25.367 8.497 24.455 10.283 24.455C12.067 24.455 12.574 25.426 14.129 25.397C15.74 25.367 16.745 23.953 17.726 22.518C18.852 20.865 19.314 19.261 19.344 19.18C19.314 19.167 16.395 18.053 16.365 14.545ZM13.882 5.568C14.7 4.582 15.249 3.228 15.1 1.884C13.948 1.931 12.51 2.658 11.666 3.637C10.912 4.5 10.25 5.894 10.428 7.21C11.71 7.309 13.064 6.554 13.882 5.568Z"/>
              </svg>
            </button>
            <button type="button" className="w-[52px] h-[52px] rounded-full border border-gray-100 bg-white flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors active:scale-95">
              <Smartphone className="text-[#FF5A1F]" size={22} strokeWidth={2.5} />
            </button>
          </div>

          <div className="mt-8 bg-[#FFF9F6] rounded-[16px] p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 border border-[#FFE5D6]">
              <ShieldCheck size={20} className="text-[#FF5A1F]" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-gray-900 leading-tight">Your safety is our priority</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Secure login • Encrypted • 24x7 Support</p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-[13px] text-gray-600 font-medium">
              New to Vegah? <Link to="#" className="text-[#FF5A1F] font-bold hover:underline">Create an account</Link>
            </p>
          </div>
          */}

        </form>
      </div>

    </div>
  );
};

export default LoginPage;
