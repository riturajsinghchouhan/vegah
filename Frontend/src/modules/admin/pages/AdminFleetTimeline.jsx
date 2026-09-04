import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon as ChevronLeft, ChevronRightIcon as ChevronRight, SettingsIcon as Filter, MapPinIcon as MapPin, WrenchIcon as Wrench, BadgeAlertIcon as AlertTriangle, RefreshCwIcon as RefreshCw } from 'lucide-animated';
import { Button } from '@/shared/components/ui/Button';
import { adminService } from '../services/adminService';

export default function AdminFleetTimeline() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timelineData, setTimelineData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('Week'); // 'Day', 'Week', 'Month'

  useEffect(() => {
    fetchTimeline();
  }, [currentDate]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const isoDate = currentDate.toISOString().split('T')[0];
      const res = await adminService.getFleetTimeline({ date: isoDate });
      setTimelineData(res);
    } catch (error) {
      console.error("Failed to fetch fleet timeline", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevWeek = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 7);
    setCurrentDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 7);
    setCurrentDate(next);
  };

  const daysOfWeek = timelineData?.daysOfWeek || [
    { day: 'Mon', date: '—' },
    { day: 'Tue', date: '—' },
    { day: 'Wed', date: '—' },
    { day: 'Thu', date: '—' },
    { day: 'Fri', date: '—' },
    { day: 'Sat', date: '—' },
    { day: 'Sun', date: '—' },
  ];

  const scooties = timelineData?.scooties || [];
  const metrics = timelineData?.metrics || {
    totalFleet: 0,
    availableCount: 0,
    bookedCount: 0,
    maintenanceCount: 0,
    conflictCount: 0,
  };

  return (
    <div className="space-y-8 pb-8 max-w-[1600px] mx-auto bg-white/90 backdrop-blur-3xl p-8 rounded-2xl border border-gray-100 shadow-2xl shadow-indigo-100/30">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Timeline</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time vehicle availability, bookings, pickups, returns and maintenance status.</p>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-1">
            <button 
              onClick={handlePrevWeek}
              className="p-1.5 hover:bg-white rounded-md text-gray-600 transition-colors"
              title="Previous Week"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-4 text-sm font-semibold text-gray-800">
              {timelineData?.rangeLabel || 'Loading...'}
            </span>
            <button 
              onClick={handleNextWeek}
              className="p-1.5 hover:bg-white rounded-md text-gray-600 transition-colors"
              title="Next Week"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          
          <div className="flex bg-gray-50 border border-gray-200 rounded-lg p-1">
            {['Day', 'Week', 'Month'].map(mode => (
              <button 
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === mode 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <Button 
            variant="outline" 
            onClick={fetchTimeline} 
            className="flex items-center gap-2 bg-white"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 py-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-transform hover:-translate-y-0.5 cursor-default">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></span> Available
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-transform hover:-translate-y-0.5 cursor-default">
          <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-200"></span> Booked
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-transform hover:-translate-y-0.5 cursor-default">
          <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-200"></span> Maintenance
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-transform hover:-translate-y-0.5 cursor-default">
          <div className="w-2 h-2 rounded-full overflow-hidden flex bg-amber-100 border border-amber-300">
            <div className="w-full h-full bg-amber-500 transform -skew-x-12 scale-150"></div>
          </div>
          Overlap / Conflict
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-600 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-transform hover:-translate-y-0.5 cursor-default">
          <span className="w-2 h-2 rounded-full bg-gray-400 shadow-sm shadow-gray-200"></span> Unavailable
        </div>
      </div>

      {/* Timeline Grid */}
      {loading ? (
        <div className="p-16 text-center text-gray-500 font-medium bg-gray-50/50 rounded-2xl border border-gray-200">
          Loading fleet timeline data...
        </div>
      ) : scooties.length === 0 ? (
        <div className="p-16 text-center text-gray-500 font-medium bg-gray-50/50 rounded-2xl border border-gray-200">
          No active vehicles found in fleet.
        </div>
      ) : (
        <div className="border border-gray-200/80 rounded-2xl overflow-hidden mt-6 shadow-sm">
          
          {/* Grid Header */}
          <div className="flex border-b border-gray-200/80 bg-gray-50/50">
            <div className="w-56 shrink-0 border-r border-gray-200/80 p-5 font-bold text-gray-800 uppercase tracking-wider text-xs flex items-center">Vehicle</div>
            <div className="flex-1 flex">
              {daysOfWeek.map((d, i) => (
                <div key={i} className="flex-1 text-center py-3 border-r border-gray-200/80 last:border-r-0 bg-white/50">
                  <div className="text-sm font-bold text-gray-900">{d.day}</div>
                  <div className="text-xs font-medium text-gray-500">{d.date}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Grid Rows */}
          <div className="divide-y divide-gray-200/80">
            {scooties.map((scooty, index) => (
              <div key={scooty.id} className="flex bg-white group hover:bg-indigo-50/30 transition-colors">
                
                {/* Scooty Info Column */}
                <div className="w-56 shrink-0 border-r border-gray-200/80 p-4 flex items-center gap-4 bg-white group-hover:bg-indigo-50/30 transition-colors z-10 relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-gray-200 shadow-sm p-1.5">
                    <img 
                      src={scooty.image} 
                      alt={scooty.name} 
                      className="w-full h-full object-contain" 
                      onError={(e) => { e.target.src = '/assets/category/dfafa.png'; }}
                    />
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-gray-900 text-[15px] truncate">{scooty.name}</div>
                    <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mt-0.5">{scooty.reg}</div>
                  </div>
                </div>

                {/* Timeline Cells Container */}
                <div className="flex-1 relative flex min-h-[64px]">
                  
                  {/* Background Grid Lines & Empty Cells */}
                  {daysOfWeek.map((_, i) => (
                    <div key={i} className="flex-1 border-r border-gray-200 last:border-r-0 p-2">
                      <div className="w-full h-full bg-green-50/40 rounded-md min-h-[48px]"></div>
                    </div>
                  ))}

                  {/* Positioned Event Bars */}
                  {scooty.events.map((evt, idx) => {
                    const widthPercentage = ((evt.endDay - evt.startDay + 1) / 7) * 100;
                    const leftPercentage = (evt.startDay / 7) * 100;

                    if (evt.type === 'booked') {
                      return (
                        <div 
                          key={evt.id || idx}
                          className="absolute top-2 bottom-2 z-20 px-1.5 group/event cursor-pointer"
                          style={{ left: `${leftPercentage}%`, width: `${widthPercentage}%` }}
                        >
                          <div className="w-full h-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 rounded-xl shadow-sm group-hover/event:shadow-md group-hover/event:-translate-y-0.5 transition-all duration-300 flex items-center justify-between px-3 overflow-hidden">
                            <div className="flex items-center gap-2 truncate">
                              <MapPin size={16} className="text-indigo-600 shrink-0" />
                              <div className="truncate">
                                <div className="text-sm font-bold text-indigo-900 truncate tracking-tight">{evt.user}</div>
                                <div className="text-xs font-medium text-indigo-600/80 truncate">{evt.time}</div>
                              </div>
                            </div>
                            <MapPin size={16} className="text-blue-500 shrink-0 ml-2 opacity-50 group-hover/event:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      );
                    }

                    if (evt.type === 'maintenance') {
                      return (
                        <div 
                          key={evt.id || idx}
                          className="absolute top-2 bottom-2 z-20 px-1.5 group/event cursor-pointer"
                          style={{ left: `${leftPercentage}%`, width: `${widthPercentage}%` }}
                        >
                          <div className="w-full h-full bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200/60 rounded-xl shadow-sm group-hover/event:shadow-md group-hover/event:-translate-y-0.5 transition-all duration-300 flex items-center px-3 overflow-hidden">
                            <Wrench size={16} className="text-rose-600 shrink-0 mr-2" />
                            <div className="truncate">
                              <div className="text-sm font-bold text-rose-900 tracking-tight">{evt.text || 'Maintenance'}</div>
                              <div className="text-xs font-medium text-rose-600/80">{evt.time}</div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (evt.type === 'conflict') {
                      return (
                        <div 
                          key={evt.id || idx}
                          className="absolute top-2 bottom-2 z-20 px-1.5 group/event cursor-pointer"
                          style={{ left: `${leftPercentage}%`, width: `${widthPercentage}%` }}
                        >
                          <div className="w-full h-full bg-orange-50/80 border border-orange-300/60 rounded-xl shadow-sm group-hover/event:shadow-md group-hover/event:-translate-y-0.5 transition-all duration-300 flex items-center px-3 overflow-hidden" 
                               style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(255, 237, 213, 0.5) 0, rgba(255, 237, 213, 0.5) 2px, transparent 2px, transparent 8px)' }}>
                            <AlertTriangle size={16} className="text-orange-600 shrink-0 mr-2 bg-white rounded-full shadow-sm" />
                            <div className="truncate bg-white/90 px-2 py-0.5 rounded-lg shadow-sm">
                              <div className="text-sm font-bold text-orange-900 tracking-tight">{evt.text}</div>
                              <div className="text-[10px] font-bold uppercase tracking-wider text-orange-600">{evt.time}</div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Metrics */}
      <div className="flex flex-wrap items-center justify-between pt-8 mt-8 border-t border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-xl shadow-inner border border-indigo-100/50">
            {metrics.totalFleet}
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Total Fleet</div>
            <div className="font-black text-gray-900 text-xl leading-tight">{metrics.totalFleet} Scooties</div>
          </div>
        </div>
        
        <div className="flex gap-10 flex-wrap">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold shadow-sm">✓</div>
             <div>
               <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Available</div>
               <div className="font-black text-gray-900 text-lg leading-none mt-0.5">{metrics.availableCount}</div>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold shadow-sm">📅</div>
             <div>
               <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Booked</div>
               <div className="font-black text-gray-900 text-lg leading-none mt-0.5">{metrics.bookedCount}</div>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-50 to-red-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-sm"><Wrench size={16}/></div>
             <div>
               <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Maintenance</div>
               <div className="font-black text-gray-900 text-lg leading-none mt-0.5">{metrics.maintenanceCount}</div>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 flex items-center justify-center text-orange-500 shadow-sm"><AlertTriangle size={16}/></div>
             <div>
               <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Conflict</div>
               <div className="font-black text-gray-900 text-lg leading-none mt-0.5">{metrics.conflictCount}</div>
             </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
