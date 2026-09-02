import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../hooks/useAuth";

const OtpPage = () => {
  const routerLocation = useLocation();
  const navigate = useNavigate();
  const { verifyOtp } = useAuth();
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, value) => {
    if (value.length > 1) return; // Prevent multiple chars
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const otpString = otp.join("");
    if (otpString.length < 4) return;
    
    setLoading(true);
    await verifyOtp(otpString);
    navigate("/user/home", { replace: true });
  };

  const isOtpComplete = otp.every(digit => digit !== "");
  const phoneNumber = routerLocation.state?.phone ?? "your phone number";

  return (
    <div className="h-[100dvh] w-full max-w-[430px] mx-auto relative flex flex-col justify-end p-5 font-sans overflow-hidden bg-[#F8F9FA] shadow-2xl">
      
      {/* Background Image Layer */}
      <img 
        src="/assets/loginpagebg.png" 
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover object-top z-0"
      />
      
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="absolute top-8 left-6 z-30 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
      >
        <ArrowLeft size={20} className="text-gray-800" />
      </button>
      
      {/* Spacer to push card to bottom */}
      <div className="flex-1" />

      {/* --- Form Container (White Card) --- */}
      <div className="relative z-20 bg-white w-full max-w-md mx-auto rounded-[32px] px-6 py-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] mb-20 transition-all duration-500 ease-out focus-within:-translate-y-8 focus-within:shadow-[0_40px_80px_rgba(0,0,0,0.15)]">
        
        <div className="mb-8">
          <h1 className="text-[24px] font-bold text-gray-900 leading-tight">Verify Mobile</h1>
          <p className="text-[14px] text-gray-500 mt-2">
            Code sent to <span className="font-semibold text-gray-800">{phoneNumber}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
          
          <div className="flex items-center justify-between gap-3 mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="tel"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-[60px] h-[64px] rounded-[16px] border-2 border-gray-100 bg-[#F8F9FA] text-center text-[24px] font-bold text-gray-900 outline-none focus:border-[#FF5A1F] focus:bg-white focus:ring-4 focus:ring-[#FF5A1F]/10 transition-all"
              />
            ))}
          </div>

          <div className="flex items-center justify-between mb-8">
            <p className="text-[13px] text-gray-500 font-medium">Didn't receive code?</p>
            <button type="button" className="text-[13px] font-bold text-[#FF5A1F] hover:underline">
              Resend in 00:30
            </button>
          </div>

          {/* Continue Button */}
          <button 
            type="submit"
            disabled={loading || !isOtpComplete}
            className="w-full h-[52px] bg-[#FF5A1F] hover:bg-[#E54D15] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[16px] font-bold rounded-[16px] flex items-center justify-center transition-all shadow-md active:scale-[0.98]"
          >
            {loading ? "Verifying..." : "Verify and proceed"}
            {!loading && <ArrowRight size={18} className="ml-2" />}
          </button>

          <div className="mt-6 bg-[#FFF9F6] rounded-[16px] p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 border border-[#FFE5D6]">
              <ShieldCheck size={16} className="text-[#FF5A1F]" />
            </div>
            <div>
              <p className="text-[12px] font-bold text-gray-900 leading-tight">Secure verification</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Your session is protected</p>
            </div>
          </div>

        </form>
      </div>

    </div>
  );
};

export default OtpPage;
