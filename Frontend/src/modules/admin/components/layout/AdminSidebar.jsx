import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { adminSidebarMenu } from "../../utils/adminSidebarMenu";
import { ChevronLeftIcon as ChevronLeft, ChevronRightIcon as ChevronRight } from "lucide-animated";

export default function AdminSidebar({ isOpen, setIsOpen }) {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleMenu = (label) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col bg-[#000000] border-r border-gray-800 transition-all duration-300 ${
        isOpen ? "w-72" : "w-20"
      }`}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-800">
        <h1
          className={`font-bold text-xl text-white transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
          }`}
        >
          Vegah Admin
        </h1>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4" data-lenis-prevent>
        {adminSidebarMenu.map((section, idx) => (
          <div key={idx} className="mb-6">
            {isOpen && (
              <h2 className="px-6 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {section.title}
              </h2>
            )}
            <ul className="space-y-1">
              {section.items.map((item, itemIdx) => {
                if (item.type === "collapse") {
                  // Check if any child is active
                  const isChildActive = item.items.some(sub => location.pathname.startsWith(sub.path.split("?")[0]) && location.search.includes(sub.path.split("?")[1] || ""));
                  const isExpanded = expandedMenus[item.label] || isChildActive;

                  return (
                    <li key={itemIdx}>
                      <button
                        onClick={() => toggleMenu(item.label)}
                        className={`w-full flex items-center justify-between px-6 py-2.5 mx-2 rounded-lg transition-colors ${
                          isChildActive && !isExpanded
                            ? "bg-gray-800 text-white font-medium"
                            : "text-gray-400 hover:bg-gray-900 hover:text-gray-200"
                        }`}
                        title={!isOpen ? item.label : ""}
                      >
                        <div className="flex items-center">
                          <item.icon
                            size={20}
                            className={`shrink-0 ${
                              isChildActive && !isExpanded ? "text-blue-400" : "text-gray-500"
                            }`}
                          />
                          <span
                            className={`ml-3 whitespace-nowrap transition-opacity duration-300 ${
                              isOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                            }`}
                          >
                            {item.label}
                          </span>
                        </div>
                        {isOpen && (
                          <span className={`text-gray-600 transition-transform ${isExpanded ? "rotate-90" : ""}`}>
                            <ChevronRight size={16} />
                          </span>
                        )}
                      </button>
                      
                      {/* Sub-items */}
                      {isOpen && isExpanded && (
                        <ul className="mt-1 space-y-1">
                          {item.items.map((subItem, subIdx) => {
                            // Exact match logic for query params since they share the same base path
                            const isSubActive = 
                              location.pathname === subItem.path.split("?")[0] && 
                              (subItem.path.includes("?") ? location.search.includes(subItem.path.split("?")[1]) : location.search === "");
                              
                            return (
                              <li key={subIdx}>
                                <Link
                                  to={subItem.path}
                                  className={`flex items-center pl-14 pr-6 py-2 mx-2 rounded-lg transition-colors text-sm ${
                                    isSubActive
                                      ? "bg-gray-800 text-white font-medium"
                                      : "text-gray-500 hover:text-gray-300 hover:bg-gray-900"
                                  }`}
                                >
                                  <span className={`mr-2 ${isSubActive ? "text-orange-500" : "text-gray-700"}`}>•</span>
                                  <span className="whitespace-nowrap">{subItem.label}</span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                }

                // Normal Link
                const isActive = location.pathname.startsWith(item.path.split("?")[0]);
                return (
                  <li key={itemIdx}>
                    <Link
                      to={item.path}
                      className={`flex items-center px-6 py-2.5 mx-2 rounded-lg transition-colors ${
                        isActive
                          ? "bg-gray-800 text-white font-medium"
                          : "text-gray-400 hover:bg-gray-900 hover:text-gray-200"
                      }`}
                      title={!isOpen ? item.label : ""}
                    >
                      <item.icon
                        size={20}
                        className={`shrink-0 ${
                          isActive ? "text-blue-400" : "text-gray-500"
                        }`}
                      />
                      <span
                        className={`ml-3 whitespace-nowrap transition-opacity duration-300 ${
                          isOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                        }`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
