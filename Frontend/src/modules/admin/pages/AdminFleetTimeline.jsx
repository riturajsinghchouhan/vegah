import React from 'react';
import { ChevronLeft, ChevronRight, Filter, MapPin, Wrench, AlertTriangle } from 'lucide-react';
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
    <div className="space-y-6 pb-8 max-w-[1600px] mx-auto bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      
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
      <div className="flex flex-wrap items-center gap-6 text-sm py-2">
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span> Available</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Booked</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500"></span> Pickup</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500"></span> Return</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span> Maintenance</div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full overflow-hidden flex bg-red-100 border border-red-300">
            <div className="w-full h-full bg-red-500 transform -skew-x-12 scale-150"></div>
          </div>
           Overlap / Conflict
        </div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gray-300"></span> Unavailable</div>
      </div>

      {/* Timeline Grid */}
      <div className="border border-gray-200 rounded-xl overflow-hidden mt-4">
        
        {/* Grid Header */}
        <div className="flex border-b border-gray-200 bg-gray-50/80">
          <div className="w-48 shrink-0 border-r border-gray-200 p-4 font-semibold text-gray-700">Scooty</div>
          <div className="flex-1 flex">
            {daysOfWeek.map((d, i) => (
              <div key={i} className="flex-1 text-center py-3 border-r border-gray-200 last:border-r-0">
                <div className="text-sm font-semibold text-gray-900">{d.day}</div>
                <div className="text-xs text-gray-500">{d.date}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Grid Rows */}
        <div className="divide-y divide-gray-200">
          {mockScooties.map((scooty) => (
            <div key={scooty.id} className="flex bg-white group hover:bg-gray-50/50 transition-colors">
              
              {/* Scooty Info Column */}
              <div className="w-48 shrink-0 border-r border-gray-200 p-4 flex items-center gap-3 bg-white z-10 relative">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-xl">🛵</span>
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-sm">{scooty.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{scooty.reg}</div>
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
                        className="absolute top-2 bottom-2 z-20 px-1"
                        style={{ left: `${leftPercentage}%`, width: `${widthPercentage}%` }}
                      >
                        <div className="w-full h-full bg-blue-100 border border-blue-200 rounded-lg shadow-sm flex items-center justify-between px-3 overflow-hidden">
                          <div className="flex items-center gap-2 truncate">
                            <MapPin size={16} className="text-purple-600 shrink-0" />
                            <div className="truncate">
                              <div className="text-sm font-semibold text-blue-700 truncate">{evt.user}</div>
                              <div className="text-xs text-blue-500 truncate">{evt.time}</div>
                            </div>
                          </div>
                          <MapPin size={16} className="text-orange-500 shrink-0 ml-2" />
                        </div>
                      </div>
                    );
                  }

                  if (evt.type === 'maintenance') {
                    return (
                      <div 
                        key={idx}
                        className="absolute top-2 bottom-2 z-20 px-1"
                        style={{ left: `${leftPercentage}%`, width: `${widthPercentage}%` }}
                      >
                        <div className="w-full h-full bg-red-100 border border-red-200 rounded-lg shadow-sm flex items-center px-3 overflow-hidden">
                          <Wrench size={16} className="text-red-500 shrink-0 mr-2" />
                          <div className="truncate">
                            <div className="text-sm font-semibold text-red-700">{evt.text}</div>
                            <div className="text-xs text-red-500">{evt.time}</div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (evt.type === 'conflict') {
                    return (
                      <div 
                        key={idx}
                        className="absolute top-2 bottom-2 z-20 px-1"
                        style={{ left: `${leftPercentage}%`, width: `${widthPercentage}%` }}
                      >
                        <div className="w-full h-full bg-red-50 border border-red-300 rounded-lg shadow-sm flex items-center px-3 overflow-hidden" 
                             style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fee2e2 0, #fee2e2 2px, transparent 2px, transparent 8px)' }}>
                          <AlertTriangle size={16} className="text-red-600 shrink-0 mr-2 bg-white rounded-full" />
                          <div className="truncate bg-white/80 px-1 rounded">
                            <div className="text-sm font-bold text-red-700">{evt.text}</div>
                            <div className="text-xs text-red-600 font-medium">{evt.time}</div>
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
      <div className="flex flex-wrap items-center justify-between pt-6 border-t border-gray-100 mt-6 text-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold">7</div>
          <div>
            <div className="text-gray-500">Total Scooties</div>
            <div className="font-bold text-gray-900 text-lg">7</div>
          </div>
        </div>
        
        <div className="flex gap-8">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-500">✓</div>
             <div>
               <div className="text-gray-500 text-xs">Available</div>
               <div className="font-bold text-gray-900">4</div>
             </div>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">📅</div>
             <div>
               <div className="text-gray-500 text-xs">Booked</div>
               <div className="font-bold text-gray-900">3</div>
             </div>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500"><Wrench size={14}/></div>
             <div>
               <div className="text-gray-500 text-xs">Maintenance</div>
               <div className="font-bold text-gray-900">1</div>
             </div>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500"><AlertTriangle size={14}/></div>
             <div>
               <div className="text-gray-500 text-xs">Conflict</div>
               <div className="font-bold text-gray-900">1</div>
             </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
