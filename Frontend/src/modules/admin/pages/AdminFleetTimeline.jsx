import React from 'react';
import { ChevronLeftIcon as ChevronLeft, ChevronRightIcon as ChevronRight, SettingsIcon as Filter, MapPinIcon as MapPin, WrenchIcon as Wrench, BadgeAlertIcon as AlertTriangle } from 'lucide-animated';
import { Button } from '@/shared/components/ui/Button';

// Mock Data for the Timeline
const daysOfWeek = [
  { day: 'Mon', date: '19 May' },
  { day: 'Tue', date: '20 May' },
  { day: 'Wed', date: '21 May' },
  { day: 'Thu', date: '22 May' },
  { day: 'Fri', date: '23 May' },
  { day: 'Sat', date: '24 May' },
  { day: 'Sun', date: '25 May' },
];

const mockScooties = [
  {
    id: 'S-01',
    name: 'Scooty 01',
    reg: 'MP09AB1234',
    events: [
      { type: 'booked', startDay: 0, endDay: 2, user: 'Rahul Sharma', time: '19 May 10:00 AM - 21 May 6:00 PM' }
    ]
  },
  {
    id: 'S-02',
    name: 'Scooty 02',
    reg: 'MP09AB5678',
    events: [
      { type: 'booked', startDay: 1, endDay: 3, user: 'Priya Verma', time: '20 May 9:00 AM - 22 May 5:00 PM' }
    ]
  },
  {
    id: 'S-03',
    name: 'Scooty 03',
    reg: 'MP09AB9101',
    events: [
      { type: 'booked', startDay: 0, endDay: 0, user: 'Amit Patel', time: '19 May 2:00 PM - 20 May 11:00 AM' }
    ]
  },
  {
    id: 'S-04',
    name: 'Scooty 04',
    reg: 'MP09AC1122',
    events: [
      { type: 'booked', startDay: 3, endDay: 5, user: 'Neha Singh', time: '22 May 10:00 AM - 24 May 6:00 PM' }
    ]
  },
  {
    id: 'S-05',
    name: 'Scooty 05',
    reg: 'MP09AC3344',
    events: [
      { type: 'maintenance', startDay: 0, endDay: 2, text: 'Maintenance', time: '19 May - 21 May' }
    ]
  },
  {
    id: 'S-06',
    name: 'Scooty 06',
    reg: 'MP09AC5566',
    events: [
      { type: 'conflict', startDay: 1, endDay: 3, text: 'Conflict', time: '20 May 1:00 PM - 22 May 12:00 PM' }
    ]
  },
  {
    id: 'S-07',
    name: 'Scooty 07',
    reg: 'MP09AC7788',
    events: [
      { type: 'booked', startDay: 4, endDay: 6, user: 'Vikram Joshi', time: '23 May 9:00 AM - 25 May 5:00 PM' }
    ]
  },
];

export default function AdminFleetTimeline() {
  return (
    <div className="space-y-8 pb-8 max-w-[1600px] mx-auto bg-white/90 backdrop-blur-3xl p-8 rounded-2xl border border-gray-100 shadow-2xl shadow-indigo-100/30">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Timeline</h1>
          <p className="text-sm text-gray-500 mt-1">View scooter availability, bookings, pickups, returns and maintenance.</p>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-1">
            <button className="p-1.5 hover:bg-white rounded-md text-gray-600"><ChevronLeft size={18} /></button>
            <span className="px-4 text-sm font-semibold text-gray-800">19 May — 25 May 2025</span>
            <button className="p-1.5 hover:bg-white rounded-md text-gray-600"><ChevronRight size={18} /></button>
          </div>
          
          <div className="flex bg-gray-50 border border-gray-200 rounded-lg p-1">
            <button className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-md">Day</button>
            <button className="px-4 py-1.5 text-sm font-medium bg-blue-600 text-white shadow-sm rounded-md">Week</button>
            <button className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-md">Month</button>
          </div>
          
          <Button variant="outline" className="flex items-center gap-2 bg-white">
            <Filter size={16} /> Filters
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
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-purple-700 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-transform hover:-translate-y-0.5 cursor-default">
          <span className="w-2 h-2 rounded-full bg-purple-500 shadow-sm shadow-purple-200"></span> Pickup
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-orange-700 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-transform hover:-translate-y-0.5 cursor-default">
          <span className="w-2 h-2 rounded-full bg-orange-500 shadow-sm shadow-orange-200"></span> Return
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
          {mockScooties.map((scooty, index) => (
            <div key={scooty.id} className="flex bg-white group hover:bg-indigo-50/30 transition-colors">
              
              {/* Scooty Info Column */}
              <div className="w-56 shrink-0 border-r border-gray-200/80 p-4 flex items-center gap-4 bg-white group-hover:bg-indigo-50/30 transition-colors z-10 relative">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-gray-200 shadow-sm p-1.5">
                  <img 
                    src={index % 2 === 0 ? '/assets/category/dfafa.png' : '/assets/category/image.png'} 
                    alt={scooty.name} 
                    className="w-full h-full object-contain" 
                  />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-[15px]">{scooty.name}</div>
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mt-1">{scooty.reg}</div>
                </div>
              </div>

              {/* Timeline Cells Container */}
              <div className="flex-1 relative flex">
                
                {/* Background Grid Lines & Empty Cells */}
                {daysOfWeek.map((_, i) => (
                  <div key={i} className="flex-1 border-r border-gray-200 last:border-r-0 p-2">
                    {/* Visual indicator for available days (empty space) */}
                    <div className="w-full h-full bg-green-50/40 rounded-md min-h-[48px]"></div>
                  </div>
                ))}

                {/* Absolutely Positioned Event Bars */}
                {scooty.events.map((evt, idx) => {
                  const widthPercentage = ((evt.endDay - evt.startDay + 1) / 7) * 100;
                  const leftPercentage = (evt.startDay / 7) * 100;

                  if (evt.type === 'booked') {
                    return (
                      <div 
                        key={idx}
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
                        key={idx}
                        className="absolute top-2 bottom-2 z-20 px-1.5 group/event cursor-pointer"
                        style={{ left: `${leftPercentage}%`, width: `${widthPercentage}%` }}
                      >
                        <div className="w-full h-full bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200/60 rounded-xl shadow-sm group-hover/event:shadow-md group-hover/event:-translate-y-0.5 transition-all duration-300 flex items-center px-3 overflow-hidden">
                          <Wrench size={16} className="text-rose-600 shrink-0 mr-2" />
                          <div className="truncate">
                            <div className="text-sm font-bold text-rose-900 tracking-tight">{evt.text}</div>
                            <div className="text-xs font-medium text-rose-600/80">{evt.time}</div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (evt.type === 'conflict') {
                    return (
                      <div 
                        key={idx}
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

      {/* Footer Metrics */}
      <div className="flex flex-wrap items-center justify-between pt-8 mt-8 border-t border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-xl shadow-inner border border-indigo-100/50">7</div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Total Fleet</div>
            <div className="font-black text-gray-900 text-xl leading-tight">7 Scooties</div>
          </div>
        </div>
        
        <div className="flex gap-10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold shadow-sm">✓</div>
             <div>
               <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Available</div>
               <div className="font-black text-gray-900 text-lg leading-none mt-0.5">4</div>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold shadow-sm">📅</div>
             <div>
               <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Booked</div>
               <div className="font-black text-gray-900 text-lg leading-none mt-0.5">3</div>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-50 to-red-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-sm"><Wrench size={16}/></div>
             <div>
               <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Maintenance</div>
               <div className="font-black text-gray-900 text-lg leading-none mt-0.5">1</div>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 flex items-center justify-center text-orange-500 shadow-sm"><AlertTriangle size={16}/></div>
             <div>
               <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Conflict</div>
               <div className="font-black text-gray-900 text-lg leading-none mt-0.5">1</div>
             </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
