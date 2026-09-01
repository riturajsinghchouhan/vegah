import {
  BadgeIndianRupee,
  Bell,
  Calendar,
  ChevronDown,
  ChevronRight,
  Headphones,
  MapPin,
  Mic,
  Search,
  ShieldCheck,
  Tag,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import VehicleCard from "../../../../components/vehicle/VehicleCard";
import { vehicles } from "../../../../data/vehicles";

const HomePage = () => {
  return (
    <div className="bg-[#FAFAFA] min-h-screen pb-24 relative overflow-x-hidden font-sans">
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-start gap-2">
          <MapPin size={22} className="text-[#FF5500] mt-0.5" />
          <div>
            <div className="flex items-center gap-1">
              <h2 className="text-sm font-bold text-gray-900">South Tukoganj</h2>
              <ChevronDown size={14} className="text-gray-900" />
            </div>
            <p className="text-[10px] text-gray-500">Madhya Pradesh, 452001</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-1">
            <Bell size={22} className="text-gray-800" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#FF5500] border-2 border-white"></span>
          </button>
          <div className="h-8 w-8 rounded-full bg-[#FF5500] flex items-center justify-center text-white font-bold text-sm">
            S
          </div>
        </div>
      </div>

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
            <p className="text-[8px] text-gray-500">12 New</p>
          </div>
        </div>
      </div>

      <div className="px-4 mb-6 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-3 w-max">
          <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-[#FF5500] w-[80px] py-3 shadow-sm">
            <img src="/assets/category/image.png" alt="Electric" className="h-8 object-contain mb-2" />
            <span className="text-[10px] font-bold text-gray-900">Electric</span>
            <span className="text-[8px] text-gray-500">From ₹799</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 w-[80px] py-3 shadow-sm">
            <img src="/assets/category/dfafa.png" alt="Performance" className="h-8 object-contain mb-2" />
            <span className="text-[10px] font-bold text-gray-900">Performance</span>
            <span className="text-[8px] text-gray-500">From ₹999</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 w-[80px] py-3 shadow-sm">
            <img src="/assets/category/image.png" alt="City" className="h-8 object-contain mb-2" />
            <span className="text-[10px] font-bold text-gray-900">City</span>
            <span className="text-[8px] text-gray-500">From Rs 949</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 w-[80px] py-3 shadow-sm">
            <img src="/assets/category/dfafa.png" alt="Premium" className="h-8 object-contain mb-2" />
            <span className="text-[10px] font-bold text-gray-900">Premium</span>
            <span className="text-[8px] text-gray-500">From Rs 1099</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 w-[80px] py-3 shadow-sm">
            <img src="/assets/category/image.png" alt="More scoots" className="h-8 object-contain mb-2" />
            <span className="text-[10px] font-bold text-gray-900">More</span>
            <span className="text-[8px] text-gray-500">Explore all</span>
          </div>
        </div>
      </div>

      <div className="px-4 mb-6">
        <Link to="/user/vehicles" className="block relative rounded-[20px] overflow-hidden shadow-md bg-white">
          <img
            src="/assets/herobanner.png"
            alt="Drive More, Save Big! Up to 40% OFF"
            className="w-full object-cover"
          />
        </Link>
      </div>

      <div className="px-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 relative">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Rent a Scoot</h2>
          </div>

          <div className="space-y-3">
            <div className="border border-gray-200 rounded-xl p-3">
              <p className="text-[10px] text-gray-500 mb-1 flex items-center gap-1">
                <MapPin size={12} className="text-[#FF5500]" /> City or Location
              </p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800">Select pickup location</p>
                <ChevronDown size={16} className="text-gray-400" />
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 border border-gray-200 rounded-xl p-3">
                <p className="text-[10px] text-gray-500 mb-1 flex items-center gap-1">
                  <Calendar size={12} className="text-gray-400" /> Pick-up
                </p>
                <p className="text-xs font-semibold text-gray-800">14 May, 10:00 AM</p>
              </div>
              <div className="flex-1 border border-gray-200 rounded-xl p-3">
                <p className="text-[10px] text-gray-500 mb-1 flex items-center gap-1">
                  <Calendar size={12} className="text-gray-400" /> Drop-off
                </p>
                <p className="text-xs font-semibold text-gray-800">16 May, 10:00 AM</p>
              </div>
            </div>

            <button className="bg-[#FF5500] text-white rounded-xl py-3.5 px-4 flex items-center justify-center gap-2 text-sm font-bold shadow-md w-full mt-2">
              Search Scoots <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 mb-6">
        <div className="bg-[#F0FDF4] border border-green-200 border-dashed rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 rounded-lg p-2 text-green-600">
              <Tag size={20} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900">Flat 15% OFF on first booking!</h3>
              <p className="text-[10px] text-gray-600 mt-0.5">
                Use code <span className="font-bold text-green-600">VEGAH15</span>
              </p>
            </div>
          </div>
          <button className="border border-green-500 text-green-600 text-[10px] font-bold px-3 py-1.5 rounded-full bg-white">
            Copy Code
          </button>
        </div>
      </div>

      <div className="mb-6 pl-4">
        <div className="flex items-center justify-between pr-4 mb-4">
          <h2 className="text-base font-bold text-gray-900">Popular Scoots</h2>
          <Link to="/user/vehicles" className="text-xs font-bold text-[#FF5500] flex items-center">
            View All <ChevronRight size={14} />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 pr-4">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="min-w-[160px]">
              <VehicleCard vehicle={vehicle} />
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-4">Why Choose Vegah?</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex items-start gap-2">
            <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-gray-900">Safe & Secure</h4>
              <p className="text-[8px] text-gray-500 leading-snug">Verified scoots & riders</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex items-start gap-2">
            <div className="bg-green-50 text-green-600 p-1.5 rounded-lg">
              <BadgeIndianRupee size={18} />
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-gray-900">Best Price</h4>
              <p className="text-[8px] text-gray-500 leading-snug">No hidden charges</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex items-start gap-2">
            <div className="bg-purple-50 text-purple-600 p-1.5 rounded-lg">
              <Headphones size={18} />
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-gray-900">24x7 Support</h4>
              <p className="text-[8px] text-gray-500 leading-snug">We're always here</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex items-start gap-2">
            <div className="bg-red-50 text-red-500 p-1.5 rounded-lg">
              <XCircle size={18} />
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-gray-900">Free Cancellation</h4>
              <p className="text-[8px] text-gray-500 leading-snug">Cancel anytime for free</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
