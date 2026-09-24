import { useState } from "react";
import { Upload, FileCheck, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../../components/layout/PageHeader";
import Button from "../../../../components/common/Button";
import api from "../../../../services/api";

import { compressImageToBase64 } from "../../../../utils/imageUtils";

const AadharPage = () => {
  const navigate = useNavigate();
  const [aadharNumber, setAadharNumber] = useState("");
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = async (e, setFile) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageToBase64(file);
        // The util returns an object: { file, dataUrl }
        setFile(compressed.dataUrl);
      } catch (err) {
        console.error("Compression failed", err);
        alert("Failed to process image. Try a different one.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!aadharNumber || !frontImage || !backImage) {
      alert("Please fill all details and upload both front and back images.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await api.patch('/users/profile/kyc', {
        aadharNumber,
        aadharFrontImage: frontImage,
        aadharBackImage: backImage
      });
      alert("Aadhar details saved successfully!");
      navigate("/user/profile");
    } catch (err) {
      console.error(err);
      alert("Failed to save details. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-28 font-sans">
      <PageHeader title="Aadhar Verification" showBack={true} />
      
      <div className="px-5 mt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Aadhar Number Input */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <label className="block text-sm font-bold text-gray-900 mb-2">Aadhar Number</label>
            <input 
              type="text" 
              placeholder="Enter 12-digit Aadhar Number" 
              maxLength={12}
              value={aadharNumber}
              onChange={(e) => setAadharNumber(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:border-[#272664] focus:ring-1 focus:ring-[#272664]"
            />
            <p className="text-xs text-gray-500 mt-2">Your data is secure and will only be used for verification.</p>
          </div>

          {/* Front Image Upload */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <label className="block text-sm font-bold text-gray-900 mb-3">Upload Front Side</label>
            <div className="relative h-40 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center overflow-hidden">
              {frontImage ? (
                <div className="w-full h-full relative group">
                  <img src={frontImage} alt="Aadhar Front" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white font-medium text-sm flex items-center gap-2">
                      <Upload size={16} /> Change Photo
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <Upload className="mx-auto mb-2 text-[#272664]" size={28} />
                  <span className="text-sm font-medium">Tap to upload front side</span>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleFileChange(e, setFrontImage)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              />
            </div>
          </div>

          {/* Back Image Upload */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <label className="block text-sm font-bold text-gray-900 mb-3">Upload Back Side</label>
            <div className="relative h-40 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center overflow-hidden">
              {backImage ? (
                <div className="w-full h-full relative group">
                  <img src={backImage} alt="Aadhar Back" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white font-medium text-sm flex items-center gap-2">
                      <Upload size={16} /> Change Photo
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <Upload className="mx-auto mb-2 text-[#272664]" size={28} />
                  <span className="text-sm font-medium">Tap to upload back side</span>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleFileChange(e, setBackImage)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              />
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting || !aadharNumber || !frontImage || !backImage} className="w-full h-12 text-[15px]">
            {isSubmitting ? 'Saving...' : 'Save Details'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AadharPage;
