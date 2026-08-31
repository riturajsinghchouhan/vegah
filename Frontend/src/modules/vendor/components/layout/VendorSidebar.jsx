import React from "react";
import { Link, useLocation } from "react-router-dom";
import { vendorSidebarMenu } from "../../utils/vendorSidebarMenu";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function VendorSidebar({ isOpen, setIsOpen }) {
  const location = useLocation();

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col bg-gray-900 text-white transition-all duration-300 ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-800">
        <h1
          className={`font-bold text-xl text-white transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
          }`}
        >
          Vendor Portal
        </h1>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white"
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-700" data-lenis-prevent>
        {vendorSidebarMenu.map((section, idx) => (
          <div key={idx} className="mb-6">
            {isOpen && (
              <h2 className="px-6 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.title}
              </h2>
            )}
            <ul className="space-y-1">
              {section.items.map((item, itemIdx) => {
                const isActive = location.pathname.startsWith(item.path.split("?")[0]);
                return (
                  <li key={itemIdx}>
                    <Link
                      to={item.path}
                      className={`flex items-center px-6 py-2.5 mx-2 rounded-lg transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white font-medium"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      }`}
                      title={!isOpen ? item.label : ""}
                    >
                      <item.icon
                        size={20}
                        className={`shrink-0 ${
                          isActive ? "text-white" : "text-gray-400"
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
