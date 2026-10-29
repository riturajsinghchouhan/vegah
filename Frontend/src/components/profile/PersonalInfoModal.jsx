import { useState, useEffect } from "react";
import { X, CheckCircle, User, Mail, Phone, Loader2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";

const PersonalInfoModal = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setEmail(user.email || "");
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await api.patch("/users/profile", {
        fullName: fullName.trim(),
        email: email.trim(),
      });

      if (response.data && response.data.success) {
        updateUser(response.data.data);
        setMessage({ type: "success", text: "Personal information updated successfully!" });
        setTimeout(() => {
          setMessage({ type: "", text: "" });
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error("Failed to update profile", err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update profile. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div 
        className="w-full max-w-lg bg-app-card rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-app-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
              <User size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-app-text">Personal Information</h2>
              <p className="text-xs text-app-subtle">Update your account details</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-app-subtle hover:text-app-subtle rounded-full hover:bg-app-muted transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Message Banner */}
        {message.text && (
          <div className={`mt-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
            message.type === "success" 
              ? "bg-green-500/15 text-green-400 border border-green-200" 
              : "bg-red-500/15 text-red-400 border border-red-200"
          }`}>
            {message.type === "success" && <CheckCircle size={16} />}
            {message.text}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-app-text mb-1.5 pl-1">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-app-subtle">
                <User size={18} />
              </div>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full pl-10 pr-4 py-3 bg-app-muted border border-app-border rounded-2xl text-sm font-medium text-app-text focus:bg-app-card focus:border-violet-600 focus:ring-2 focus:ring-violet-600/20 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-app-text mb-1.5 pl-1">Phone Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-app-subtle">
                <Phone size={18} />
              </div>
              <input
                type="text"
                disabled
                value={user?.phone || ""}
                className="w-full pl-10 pr-24 py-3 bg-app-muted border border-app-border rounded-2xl text-sm font-medium text-app-subtle cursor-not-allowed outline-none"
              />
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full">
                  <CheckCircle size={12} /> Verified
                </span>
              </div>
            </div>
            <p className="text-[11px] text-app-subtle mt-1 pl-1">Phone number is linked to your OTP login</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-app-text mb-1.5 pl-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-app-subtle">
                <Mail size={18} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full pl-10 pr-4 py-3 bg-app-muted border border-app-border rounded-2xl text-sm font-medium text-app-text focus:bg-app-card focus:border-violet-600 focus:ring-2 focus:ring-violet-600/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl border border-app-border text-sm font-bold text-app-text hover:bg-app-muted active:scale-98 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3.5 rounded-2xl bg-violet-700 hover:bg-violet-800 active:scale-98 text-white text-sm font-bold shadow-md shadow-violet-700/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonalInfoModal;

