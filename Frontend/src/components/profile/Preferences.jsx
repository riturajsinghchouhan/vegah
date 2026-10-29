import { useState } from "react";
import { useTheme } from "../../hooks/useTheme";

const Toggle = ({ active, onChange }) => (
  <button
    onClick={onChange}
    className={`w-[34px] h-[20px] rounded-full p-0.5 transition-colors ${
      active ? "bg-[#D1FF42]" : "bg-app-muted"
    }`}
  >
    <div className={`w-[16px] h-[16px] bg-app-card rounded-full shadow-sm transition-transform ${
      active ? "translate-x-[14px]" : "translate-x-0"
    }`} />
  </button>
);

const Preferences = ({ preferences }) => {
  const { isDark, toggleTheme } = useTheme();

  if (!preferences || preferences.length === 0) return null;

  // Simple local state for toggles just for UI demonstration
  const [toggleStates, setToggleStates] = useState(
    preferences.reduce((acc, pref) => {
      if (pref.isToggle && pref.id !== "dark_mode") acc[pref.id] = pref.defaultState;
      return acc;
    }, {})
  );

  const handleToggle = (id) => {
    if (id === "dark_mode") {
      toggleTheme();
      return;
    }
    setToggleStates(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isActive = (id) => (id === "dark_mode" ? isDark : toggleStates[id]);

  return (
    <div className="px-5 mb-8">
      <h2 className="text-[17px] font-bold text-app-text mb-4">Preferences</h2>
      <div className="bg-app-card rounded-[24px] border border-app-border shadow-sm overflow-hidden p-2">
        {preferences.map((pref, index) => (
          <div 
            key={pref.id}
            className={`flex items-center justify-between p-3 ${
              index !== preferences.length - 1 ? "border-b border-app-border" : ""
            }`}
          >
            <span className="text-[14px] font-medium text-app-text">{pref.label}</span>
            {pref.isToggle ? (
              <Toggle
                active={isActive(pref.id)}
                onChange={() => handleToggle(pref.id)}
              />
            ) : (
              <span className="text-[12px] font-bold text-[#D1FF42]">{pref.value}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Preferences;
