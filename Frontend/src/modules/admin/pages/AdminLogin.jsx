import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ShieldCheckIcon as ShieldCheck, 
  MapPinIcon as MapPin, 
  ZapIcon as Zap, 
  LockIcon as Lock, 
  EyeIcon as Eye, 
  EyeOffIcon as EyeOff,
  ArrowRightIcon as ArrowRight
} from "lucide-animated";
import { Shield, Headphones, Award, Bike, Mail } from "lucide-react";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    localStorage.setItem("admin_token", "dummy_admin_token");
    navigate("/admin/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#f9f5ff] relative overflow-hidden flex flex-col font-sans text-gray-800">
      
      {/* Background Graphic Elements */}
      {/* Dotted pattern top-left */}
      <div className="absolute top-10 left-10 opacity-20 hidden md:block">
        <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
          <pattern id="dots" x="0" y="0" width="15" height="15" patternUnits="userSpaceOnUse">
            <circle fill="#6D28D9" cx="2" cy="2" r="2"></circle>
          </pattern>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#dots)"></rect>
        </svg>
      </div>

      {/* Dotted pattern bottom-right */}
      <div className="absolute bottom-20 right-10 opacity-20 hidden md:block">
        <svg width="80" height="80" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
          <pattern id="dots2" x="0" y="0" width="15" height="15" patternUnits="userSpaceOnUse">
            <circle fill="#6D28D9" cx="2" cy="2" r="2"></circle>
          </pattern>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#dots2)"></rect>
        </svg>
      </div>

      {/* Large light purple circles/waves */}
      <div className="absolute -top-[20%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-white/40 blur-3xl mix-blend-overlay pointer-events-none"></div>
      <div className="absolute top-[30%] -left-[10%] w-[40vw] h-[40vw] rounded-full bg-[#f3edfd] blur-2xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-500 to-indigo-400 rounded-tr-[100%] opacity-80 z-0 pointer-events-none"></div>

      {/* Main Content Layout */}
      <div className="flex-1 max-w-[1440px] mx-auto w-full flex flex-col lg:flex-row relative z-10 px-6 sm:px-12 lg:px-20">
        
        {/* Left Panel - Branding & Marketing */}
        <div className="flex-1 flex flex-col justify-between py-10 lg:py-16 pr-0 lg:pr-10">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="text-violet-700">
              <Bike size={42} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Vegah</h1>
              <p className="text-xs text-gray-500 font-medium">Smart Rides. Better Cities.</p>
            </div>
          </div>

          {/* Headlines */}
          <div className="my-16 lg:my-0 mt-20">
            <h2 className="text-5xl lg:text-7xl font-black text-gray-900 leading-[1.15] tracking-tight">
              Ride <span className="text-violet-700">Smart.</span><br />
              Live <span className="text-violet-700">Free.</span>
            </h2>
            <p className="mt-6 text-lg text-gray-600 max-w-sm leading-relaxed">
              Your trusted scooty rental partner for every journey.
            </p>
            <div className="w-12 h-1 bg-violet-700 mt-8 rounded-full"></div>

            {/* Feature Cards */}
            <div className="flex flex-wrap gap-4 mt-16 bg-white/60 backdrop-blur-md p-4 rounded-3xl border border-white/50 shadow-sm max-w-fit">
              <div className="text-center px-4 py-2">
                <div className="w-10 h-10 mx-auto bg-violet-100 text-violet-700 rounded-full flex items-center justify-center mb-3">
                  <ShieldCheck size={20} />
                </div>
                <div className="text-xs font-bold text-gray-900">Safe & Reliable</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Well maintained</div>
              </div>
              <div className="text-center px-4 py-2 border-l border-gray-200/60">
                <div className="w-10 h-10 mx-auto bg-violet-100 text-violet-700 rounded-full flex items-center justify-center mb-3">
                  <MapPin size={20} />
                </div>
                <div className="text-xs font-bold text-gray-900">Wide Coverage</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Across your city</div>
              </div>
              <div className="text-center px-4 py-2 border-l border-gray-200/60">
                <div className="w-10 h-10 mx-auto bg-violet-100 text-violet-700 rounded-full flex items-center justify-center mb-3">
                  <Zap size={20} />
                </div>
                <div className="text-xs font-bold text-gray-900">Easy Booking</div>
                <div className="text-[10px] text-gray-500 mt-0.5">In just a few clicks</div>
              </div>
            </div>
          </div>

          {/* Footer Left */}
          <div className="text-xs text-gray-500 font-medium mt-10 lg:mt-0">
            © 2025 Vegah. All rights reserved.
          </div>
        </div>

        {/* Right Panel - Login Card */}
        <div className="flex-1 flex flex-col justify-center items-center lg:items-end py-10 lg:py-16 relative w-full">
          
          <div className="bg-white p-10 lg:p-14 rounded-[2.5rem] shadow-2xl shadow-purple-900/5 border border-white w-full max-w-[460px] relative z-20">
            
            {/* Form Header */}
            <div className="flex flex-col items-center text-center mb-10">
              <div className="w-20 h-20 bg-[#f9f5ff] rounded-full flex items-center justify-center shadow-inner mb-6 relative">
                <div className="absolute inset-0 bg-violet-100 rounded-full opacity-50 blur-sm"></div>
                <Bike size={36} className="text-violet-700 relative z-10" strokeWidth={2.5} />
              </div>
              <h3 className="text-[28px] font-black text-gray-900">Welcome Back</h3>
              <p className="text-[15px] text-gray-500 mt-2 font-medium">Login to continue your ride</p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 pl-1">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={20} className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 text-[15px] font-medium text-gray-800 transition-all outline-none bg-white"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 pl-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={20} className="text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-12 py-4 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 text-[15px] font-medium text-gray-800 transition-all outline-none bg-white"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full flex justify-between items-center py-4 px-6 rounded-2xl shadow-md shadow-violet-700/20 text-[15px] font-bold text-white bg-violet-700 hover:bg-violet-800 transition-all hover:shadow-lg hover:shadow-violet-700/30 hover:-translate-y-0.5 active:scale-95 group"
                >
                  <span className="mx-auto pl-6">Login</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

            </form>
          </div>

          {/* Footer Right - Mini Features */}
          <div className="flex flex-wrap justify-center lg:justify-end gap-6 mt-12 lg:absolute lg:bottom-12 w-full lg:right-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border border-violet-100 flex items-center justify-center text-violet-700 bg-white shadow-sm">
                <Shield size={14} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-900">Secure Payments</div>
                <div className="text-[9px] text-gray-500">100% safe & secure</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border border-violet-100 flex items-center justify-center text-violet-700 bg-white shadow-sm">
                <Headphones size={14} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-900">24/7 Support</div>
                <div className="text-[9px] text-gray-500">We're here to help</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border border-violet-100 flex items-center justify-center text-violet-700 bg-white shadow-sm">
                <Award size={14} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-900">Best Prices</div>
                <div className="text-[9px] text-gray-500">Affordable rides</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
