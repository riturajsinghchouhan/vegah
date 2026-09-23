import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { env } from '../../../../config/env';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SupportPage = () => {
  const [content, setContent] = useState('Loading...');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${env.apiUrl}/admin/settings/public`);
        if (res.data?.data?.supportContent) {
          setContent(res.data.data.supportContent);
        } else {
          setContent('Support information not available.');
        }
      } catch (err) {
        setContent('Failed to load Support information.');
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className="min-h-[100dvh] bg-gray-50 pb-10 font-sans">
      <div className="bg-white px-4 py-4 shadow-sm sticky top-0 flex items-center z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-700">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-[17px] font-bold text-gray-900 ml-2">Support</h1>
      </div>
      
      <div className="p-5 max-w-2xl mx-auto mt-4 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-gray-700">
          {content}
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
