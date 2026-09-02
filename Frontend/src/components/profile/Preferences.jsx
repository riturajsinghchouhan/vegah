import { useState } from "react";

const Toggle = ({ active, onChange }) => (
  <button 
    onClick={onChange}
    className={`w-[34px] h-[20px] rounded-full p-0.5 transition-colors ${
      active ? "bg-[#FF5A1F]" : "bg-gray-200"
    }`}
  >
    <div className={`w-[16px] h-[16px] bg-white rounded-full shadow-sm transition-transform ${
      active ? "translate-x-[14px]" : "translate-x-0"
    }`} />
  </button>
);

const Preferences = ({ preferences }) => {
  if (!preferences || preferences.length === 0) return null;

  // Simple local state for toggles just for UI demonstration
  const [toggleStates, setToggleStates] = useState(
    preferences.reduce((acc, pref) => {
      if (pref.isToggle) acc[pref.id] = pref.defaultState;
      return acc;
    }, {})
  );

  const handleToggle = (id) => {
    setToggleStates(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="px-5 mb-8">
      <h2 className="text-[17px] font-bold text-gray-900 mb-4">Preferences</h2>
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden p-2">
        {preferences.map((pref, index) => (
          <div 
            key={pref.id}
            className={`flex items-center justify-between p-3 ${
              index !== preferences.length - 1 ? "border-b border-gray-50" : ""
            }`}
          >
            <span className="text-[14px] font-medium text-gray-800">{pref.label}</span>
            {pref.isToggle ? (
              <Toggle 
                active={toggleStates[pref.id]} 
                onChange={() => handleToggle(pref.id)} 
              />
            ) : (
              <span className="text-[12px] font-bold text-[#FF5A1F]">{pref.value}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Preferences;
