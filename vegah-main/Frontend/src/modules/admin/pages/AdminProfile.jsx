import React, { useState } from "react";
import { User, Mail, Phone, Shield, Camera, Key, Smartphone, Clock, MapPin, Monitor, CheckCircle, Edit2, Save, X } from "lucide-react";

export default function AdminProfile() {
  const [isEditing, setIsEditing] = useState(false);
  
  // Mock Data
  const [profile, setProfile] = useState({
    name: "Vishal Sharma",
    email: "admin@evora.com",
    phone: "+91 98765 43210",
    role: "Super Admin",
    adminId: "ADM-8472",
    status: "Active",
    address: "123, Tech Park, Koramangala, Bangalore",
  });

  const loginActivity = [
    { id: 1, device: "MacBook Pro (macOS)", browser: "Chrome 120.0", location: "Bangalore, India", ip: "192.168.1.45", date: "Today, 10:45 AM", current: true },
    { id: 2, device: "iPhone 13 (iOS)", browser: "Safari Mobile", location: "Bangalore, India", ip: "106.51.23.11", date: "Yesterday, 08:30 PM", current: false },
    { id: 3, device: "Windows PC (Win 11)", browser: "Edge 119.0", location: "Mumbai, India", ip: "203.45.12.89", date: "28 May 2025, 11:20 AM", current: false },
  ];

  const handleSave = () => {
    setIsEditing(false);
    // In a real app, API call goes here
    alert("Profile updated successfully!");
  };

  return (
    <div className="space-y-6 pb-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Admin Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account settings and preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-400"></div>
            <div className="px-6 pb-6 relative">
              {/* Profile Photo */}
              <div className="flex justify-between items-end -mt-12 mb-4">
                <div className="relative group">
                  <div className="w-24 h-24 bg-white rounded-full p-1 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
                     {/* Placeholder for actual image */}
                     <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <User className="w-10 h-10" />
                     </div>
                  </div>
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full shadow-sm hover:bg-blue-700 transition-colors">
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-50 text-green-700 border border-green-200 mb-2 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {profile.status}
                </span>
              </div>

              {/* Basic Info */}
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
                <p className="text-sm text-gray-500 font-medium">{profile.role}</p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <span>Admin ID: <span className="font-medium text-gray-900">{profile.adminId}</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{profile.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{profile.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Settings & Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Personal Information */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </div>
              )}
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    defaultValue={profile.name} 
                    disabled={!isEditing}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    defaultValue={profile.email} 
                    disabled={!isEditing}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    defaultValue={profile.phone} 
                    disabled={!isEditing}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input 
                    type="text" 
                    defaultValue={profile.address} 
                    disabled={!isEditing}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Security & Password */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Change Password */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Key className="w-4 h-4 text-gray-500" />
                  Change Password
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Current Password</label>
                    <input type="password" placeholder="••••••••" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div></div> {/* Empty column for spacing */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
                    <input type="password" placeholder="••••••••" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <input type="password" placeholder="••••••••" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                </div>
                <div className="mt-4">
                  <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                    Update Password
                  </button>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* 2FA */}
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600 mt-0.5">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication (2FA)</h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm">Enhance your account security by requiring an extra step to log in.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Login Activity */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Login Activity</h3>
              <p className="text-sm text-gray-500 mt-1">Recent devices that have logged into your account.</p>
            </div>
            
            <div className="divide-y divide-gray-100">
              {loginActivity.map((activity) => (
                <div key={activity.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg text-gray-500 mt-0.5">
                      {activity.device.includes("MacBook") || activity.device.includes("PC") ? (
                        <Monitor className="w-5 h-5" />
                      ) : (
                        <Smartphone className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-gray-900">{activity.device}</h4>
                        {activity.current && (
                          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-green-50 text-green-700 border border-green-200">Current</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                        <span>{activity.browser}</span> • 
                        <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{activity.location}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto">
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {activity.date}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{activity.ip}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
