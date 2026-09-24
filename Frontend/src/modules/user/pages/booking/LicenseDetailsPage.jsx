import { FileImage, Upload } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import Button from "../../../../components/common/Button";
import Input from "../../../../components/common/Input";
import PageHeader from "../../../../components/layout/PageHeader";
import { useBooking } from "../../../../hooks/useBooking";
import PriceBreakdown from "../../../../components/booking/PriceBreakdown";
import { compressImageToBase64 } from "../../../../utils/imageUtils";

import { useAuth } from "../../../../hooks/useAuth";

const LicenseDetailsPage = () => {
  const navigate = useNavigate();
  const { booking, pricing, updateBookingField } = useBooking();
  const { user } = useAuth();
  const [error, setError] = useState("");

  if (!booking.vehicle) {
    return <Navigate to="/user/vehicles" replace />;
  }

  const steps = [1, 2, 3, 4, 5, 6];

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const compressed = await compressImageToBase64(file);
        updateBookingField("licenseFile", compressed);
        setError("");
      } catch (err) {
        console.error("Failed to compress image", err);
        setError("Failed to process image. Please try another one.");
      }
    }
  };

  const handleUseSaved = () => {
    updateBookingField("licenseNumber", user.kycDetails.licenseNumber);
    updateBookingField("licenseFile", { dataUrl: user.kycDetails.licenseFrontImage });
    navigate("/user/booking/battery-package");
  };

  const handleSkip = () => {
    // Optional, so just skip
    navigate("/user/booking/battery-package");
  };

  const handleNext = () => {
    const licenseRegex = /^[A-Za-z]{2}[0-9]{2}[A-Za-z0-9\s\-]{11,15}$/;
    
    // License is optional, so if both are empty we can technically allow them to continue using handleSkip.
    // But if they entered something, validate it.
    if (booking.licenseNumber || booking.licenseFile) {
      if (!booking.licenseNumber || booking.licenseNumber.trim() === "") {
        setError("Please enter your driving license number");
        return;
      }
      
      if (!licenseRegex.test(booking.licenseNumber)) {
        setError("Please enter a valid Indian Driving License number (e.g. MH1220110012345)");
        return;
      }
  
      if (!booking.licenseFile) {
        setError("Please upload your driving license image");
        return;
      }
    }

    setError("");
    navigate("/user/booking/battery-package");
  };

  const hasSavedLicense = Boolean(user?.kycDetails?.licenseNumber);

  return (
    <main className="page-padding">
      <PageHeader showBack subtitle="Step 3 of 6" title="License Details" />

      <div className="mb-6 flex w-full items-center justify-center">
        {steps.map((step, index, arr) => (
          <div key={step} className="flex items-center">
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                step === 3 ? "bg-app-primary text-white" : step < 3 ? "bg-app-primary/20 text-app-primary" : "bg-[#f1f4f1] text-app-subtle"
              }`}
            >
              {step}
            </div>
            {index < arr.length - 1 && (
              <div className={`h-[2px] w-6 sm:w-8 mx-1 ${step < 3 ? "bg-app-primary/20" : "bg-[#f1f4f1]"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="space-y-5">
        <section className="surface-card p-4">
          <h2 className="text-base font-semibold text-app-text">Driving License Information</h2>
          <p className="mt-1 text-sm text-app-subtle">Provide your valid driving license details to rent a vehicle.</p>
          
          <div className="mt-4">
            <Input
              label="License Number"
              onChange={(event) => {
                updateBookingField("licenseNumber", event.target.value.toUpperCase());
                setError("");
              }}
              placeholder="Enter your driving license number"
              value={booking.licenseNumber}
              type="text"
              maxLength={20}
            />
          </div>

          <div className="mt-5">
            <p className="text-sm font-medium text-app-text mb-2">Upload License Image</p>
            <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-app-border bg-app-card p-6 text-center overflow-hidden min-h-[160px]">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
              />
              {booking.licenseFile ? (
                <img src={booking.licenseFile.dataUrl} alt="License Preview" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <>
                  <div className="rounded-full bg-[#f1f4f1] p-3 text-app-subtle mb-3">
                    <Upload size={24} />
                  </div>
                  <p className="text-sm font-medium text-app-text">Tap to upload image</p>
                  <p className="text-xs text-app-subtle mt-1">PNG, JPG up to 5MB</p>
                </>
              )}
            </div>
          </div>
          
          {error && <p className="mt-3 text-sm text-red-500 font-medium">{error}</p>}
        </section>

        <PriceBreakdown pricing={pricing} />
        
        {hasSavedLicense ? (
          <div className="space-y-3">
            <Button className="w-full" onClick={handleNext}>
              Save & Continue
            </Button>
            <Button variant="outline" className="w-full border-app-primary text-app-primary" onClick={handleUseSaved}>
              Skip & Use Saved DL
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Button className="w-full" onClick={handleNext}>
              Save & Continue
            </Button>
            <Button variant="outline" className="w-full border-gray-300 text-gray-500" onClick={handleSkip}>
              Skip (Optional)
            </Button>
          </div>
        )}
      </div>
    </main>
  );
};

export default LicenseDetailsPage;
