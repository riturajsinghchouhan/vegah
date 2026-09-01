import { LocateFixed } from "lucide-react";

const ChargingMap = ({ stations }) => {
  // A static demo map for preview purposes without using the Google Maps API
  return (
    <div className="px-5 mb-8 relative">
      <div 
        className="w-full h-[160px] rounded-[24px] overflow-hidden shadow-sm border border-gray-200 relative bg-[#E5E3DF]"
        style={{
          backgroundImage: `url('/assets/demomap.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Fake Current Location */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <div className="w-12 h-12 bg-blue-500/30 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-sm"></div>
          </div>
        </div>

        {/* Fake Markers randomly positioned for demo */}
        <div className="absolute top-[30%] left-[20%]">
           <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#F97316" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"></path>
            <circle cx="12" cy="9" r="3" fill="white"></circle>
          </svg>
        </div>

        <div className="absolute top-[45%] right-[25%]">
           <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#16A34A" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"></path>
            <circle cx="12" cy="9" r="3" fill="white"></circle>
          </svg>
        </div>

        <div className="absolute bottom-[25%] left-[45%]">
           <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#F97316" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"></path>
            <circle cx="12" cy="9" r="3" fill="white"></circle>
          </svg>
        </div>

      </div>
      
      {/* Locate Me Floating Button */}
      <button 
        className="absolute bottom-4 right-9 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 text-gray-700 hover:text-[#FF5A1F] active:scale-95 transition-all z-10"
      >
        <LocateFixed size={20} strokeWidth={2} />
      </button>
    </div>
  );
};

export default ChargingMap;
