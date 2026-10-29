import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { env } from '../../../../config/env';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPage = () => {
  const [content, setContent] = useState('Loading...');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${env.apiUrl}/admin/settings/public`);
        if (res.data?.data?.privacyContent) {
          setContent(res.data.data.privacyContent);
        } else {
          setContent('Privacy Policy not available.');
        }
      } catch (err) {
        setContent('Failed to load Privacy Policy.');
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className="min-h-[100dvh] bg-app-muted pb-10 font-sans">
      <div className="bg-app-card px-4 py-4 shadow-sm sticky top-0 flex items-center z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-app-text">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-[17px] font-bold text-app-text ml-2">Privacy Policy</h1>
      </div>
      
      <div className="p-5 max-w-2xl mx-auto mt-4 bg-app-card rounded-2xl shadow-sm border border-app-border">
        <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-app-text">
          {content}
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
