import { ArrowRight, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../hooks/useAuth";
import { userService } from "../../../../services/userService";

const NamePage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 2) return;
    
    setLoading(true);
    try {
      const updatedUser = await userService.updateProfile({ fullName: fullName.trim() });
      updateUser(updatedUser);
      navigate("/user/home", { replace: true });
    } catch (error) {
      console.error("Failed to update name", error);
    } finally {
      setLoading(false);
    }
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
      <div className="relative z-20 bg-white w-full max-w-md mx-auto rounded-[32px] px-6 py-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] mb-20 transition-all duration-500 ease-out focus-within:-translate-y-8 focus-within:shadow-[0_40px_80px_rgba(0,0,0,0.15)]">
        
        <div className="mb-8">
          <h1 className="text-[24px] font-bold text-gray-900 leading-tight">Complete Profile</h1>
          <p className="text-[14px] text-gray-500 mt-2">
            Please enter your full name to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
          
          <div className="mb-6 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <UserIcon size={20} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your Full Name"
              className="w-full h-[56px] pl-11 pr-4 rounded-[16px] border-2 border-gray-100 bg-[#F8F9FA] text-[16px] font-medium text-gray-900 outline-none focus:border-[#FF5A1F] focus:bg-white focus:ring-4 focus:ring-[#FF5A1F]/10 transition-all"
              autoFocus
            />
          </div>

          {/* Continue Button */}
          <button 
            type="submit"
            disabled={loading || fullName.trim().length < 2}
            className="w-full h-[52px] bg-[#FF5A1F] hover:bg-[#E54D15] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[16px] font-bold rounded-[16px] flex items-center justify-center transition-all shadow-md active:scale-[0.98]"
          >
            {loading ? "Saving..." : "Continue"}
            {!loading && <ArrowRight size={18} className="ml-2" />}
          </button>

        </form>
      </div>

    </div>
  );
};

export default NamePage;
