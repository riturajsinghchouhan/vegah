import { useState, useEffect } from "react";
import { X, Bell, CheckCheck, Loader2, Info, AlertTriangle, ShieldCheck } from "lucide-react";
import api from "../../services/api";

const NotificationsModal = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get("/users/notifications");
      if (response.data && response.data.success) {
        setNotifications(response.data.data.notifications || []);
        setUnreadCount(response.data.data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/users/notifications/read");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark notifications read", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div 
        className="w-full max-w-lg bg-white rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold relative">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
              <p className="text-xs text-gray-500">Your latest alerts & trip updates</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-xs font-bold text-violet-700 hover:text-violet-900 flex items-center gap-1 bg-violet-50 px-2.5 py-1.5 rounded-full transition-colors"
              >
                <CheckCheck size={14} /> Mark Read
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-3">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400">
              <Loader2 size={24} className="animate-spin text-violet-600 mb-2" />
              <p className="text-xs font-medium">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-gray-400">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 text-gray-400">
                <Bell size={22} />
              </div>
              <h4 className="text-sm font-bold text-gray-700">No Notifications Yet</h4>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">You're all caught up! Trip updates and security alerts will appear here.</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div 
                key={item._id || item.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  item.isRead 
                    ? "bg-white border-gray-100 text-gray-600" 
                    : "bg-violet-50/50 border-violet-100 text-gray-900"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {item.type === "WARNING" ? <AlertTriangle size={16} /> : item.type === "SECURITY" ? <ShieldCheck size={16} /> : <Info size={16} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-gray-900">{item.title || "Alert"}</h4>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{item.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;

