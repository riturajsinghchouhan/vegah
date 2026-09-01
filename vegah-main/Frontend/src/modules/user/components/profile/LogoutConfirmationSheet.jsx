const LogoutConfirmationSheet = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[24px] z-50 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 pb-safe">
        
        <div className="px-5 pt-8 pb-6 text-center">
          <h2 className="text-[18px] font-bold text-gray-900 mb-2">Logout from Evora?</h2>
          <p className="text-[13px] text-gray-500 max-w-[260px] mx-auto">
            You will need to sign in again to access your account and bookings.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 flex flex-col gap-3">
          <button 
            onClick={onConfirm}
            className="w-full py-3.5 rounded-xl bg-[#FEF2F2] text-[#DC2626] font-bold text-[14px] active:scale-95 transition-all"
          >
            Yes, Logout
          </button>
          <button 
            onClick={onClose}
            className="w-full py-3.5 rounded-xl bg-[#F8F9FA] text-gray-700 font-bold text-[14px] active:scale-95 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
};

export default LogoutConfirmationSheet;
