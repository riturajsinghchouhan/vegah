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

const AadharDetailsPage = () => {
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
        updateBookingField("aadharFile", compressed);
        setError("");
      } catch (err) {
        console.error("Failed to compress image", err);
        setError("Failed to process image. Please try another one.");
      }
    }
  };

  const handleUseSaved = () => {
    updateBookingField("aadharNumber", user.kycDetails.aadharNumber);
    // In a real scenario, we might also use the saved image URL, 
    // but we can just bypass the image validation if aadharNumber is populated from saved details.
    updateBookingField("aadharFile", { dataUrl: user.kycDetails.aadharFrontImage });
    navigate("/user/booking/license");
  };

  const handleNext = () => {
    const aadharRegex = /^\d{12}$/;
    const sanitizedAadhar = booking.aadharNumber.replace(/\s/g, '');

    if (!sanitizedAadhar) {
      setError("Please enter your Aadhar number");
      return;
    }
    
    if (!aadharRegex.test(sanitizedAadhar)) {
      setError("Please enter a valid 12-digit Aadhar number");
      return;
    }

    if (!booking.aadharFile) {
      setError("Please upload your Aadhar card image");
      return;
    }

    setError("");
    navigate("/user/booking/license");
  };

  const hasSavedAadhar = Boolean(user?.kycDetails?.aadharNumber);

  return (
    <main className="page-padding">
      <PageHeader showBack subtitle="Step 2 of 6" title="Aadhar Details" />

      <div className="mb-6 flex w-full items-center justify-center">
        {steps.map((step, index, arr) => (
          <div key={step} className="flex items-center">
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                step === 2 ? "bg-app-primary text-white" : step < 2 ? "bg-app-primary/20 text-app-primary" : "bg-[#f1f4f1] text-app-subtle"
              }`}
            >
              {step}
            </div>
            {index < arr.length - 1 && (
              <div className={`h-[2px] w-6 sm:w-8 mx-1 ${step < 2 ? "bg-app-primary/20" : "bg-[#f1f4f1]"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="space-y-5">
        <section className="surface-card p-4">
          <h2 className="text-base font-semibold text-app-text">Aadhar Information</h2>
          <p className="mt-1 text-sm text-app-subtle">Provide your Aadhar card details for verification.</p>
          
          <div className="mt-4">
            <Input
              label="Aadhar Number"
              onChange={(event) => {
                updateBookingField("aadharNumber", event.target.value);
                setError("");
              }}
              placeholder="Enter 12-digit Aadhar number"
              value={booking.aadharNumber}
              type="text"
              maxLength={14}
            />
          </div>

          <div className="mt-5">
            <p className="text-sm font-medium text-app-text mb-2">Upload Aadhar Card Image</p>
            <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-app-border bg-app-card p-6 text-center overflow-hidden min-h-[160px]">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
              />
              {booking.aadharFile ? (
                <img src={booking.aadharFile.dataUrl} alt="Aadhar Preview" className="absolute inset-0 w-full h-full object-cover" />
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
        
        {hasSavedAadhar ? (
          <div className="space-y-3">
            <Button className="w-full" onClick={handleNext}>
              Save & Continue
            </Button>
            <Button variant="outline" className="w-full border-app-primary text-app-primary" onClick={handleUseSaved}>
              Skip & Use Saved Aadhar
            </Button>
          </div>
        ) : (
          <Button className="w-full" onClick={handleNext}>
            Next
          </Button>
        )}
      </div>
    </main>
  );
};

export default AadharDetailsPage;
