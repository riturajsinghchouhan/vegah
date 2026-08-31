import React from "react";
import { useLocation } from "react-router-dom";

export default function AdminPlaceholderPage() {
  const location = useLocation();
  const title = location.pathname.split("/").pop().replace(/-/g, " ");

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 h-full flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 capitalize mb-2">{title} Page</h2>
      <p className="text-gray-500 max-w-md">
        This is a placeholder for the {title} module. The actual functionality and UI components will be implemented here.
      </p>
    </div>
  );
}
