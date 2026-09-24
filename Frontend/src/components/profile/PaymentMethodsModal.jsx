import { useState } from "react";
import { X, Wallet, CreditCard, QrCode, Plus, CheckCircle2, ChevronRight } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const PaymentMethodsModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState("wallet");

  if (!isOpen) return null;

  const paymentMethods = [
    {
      id: "wallet",
      title: "Vegah Wallet",
      subtitle: `Balance: ₹${user?.walletBalance || 0}`,
      icon: Wallet,
      color: "text-violet-600 bg-violet-50",
      badge: "Primary",
    },
    {
      id: "upi",
      title: "UPI (GPay / PhonePe / Paytm)",
      subtitle: "Instant payment via any UPI app",
      icon: QrCode,
      color: "text-green-600 bg-green-50",
    },
    {
      id: "cards",
      title: "Credit / Debit Cards",
      subtitle: "Visa, Mastercard, RuPay, Maestro",
      icon: CreditCard,
      color: "text-blue-600 bg-blue-50",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div 
        className="w-full max-w-lg bg-white rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
              <Wallet size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Payment Methods</h2>
              <p className="text-xs text-gray-500">Manage your saved options & wallet</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Methods List */}
        <div className="mt-5 space-y-3">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            const isSelected = selectedMethod === method.id;

            return (
              <div
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected 
                    ? "border-violet-600 bg-violet-50/40 shadow-sm" 
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${method.color}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-gray-900">{method.title}</h4>
                      {method.badge && (
                        <span className="text-[10px] font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full">
                          {method.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{method.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isSelected ? (
                    <CheckCircle2 size={20} className="text-violet-600 fill-violet-600 text-white" />
                  ) : (
                    <ChevronRight size={18} className="text-gray-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-violet-700 hover:bg-violet-800 active:scale-98 text-white text-sm font-bold shadow-md shadow-violet-700/20 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Add New Payment Option
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodsModal;
