import { Camera, FileImage } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import Button from "../../../../components/common/Button";
import PageHeader from "../../../../components/layout/PageHeader";
import { useBooking } from "../../../../hooks/useBooking";
import PriceBreakdown from "../../../../components/booking/PriceBreakdown";

const UserPhotoPage = () => {
  const navigate = useNavigate();
  const { booking, pricing, updateBookingField } = useBooking();

  if (!booking.vehicle) {
    return <Navigate to="/user/vehicles" replace />;
  }

  const steps = [1, 2, 3, 4, 5, 6];

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      updateBookingField("userPhotoFile", e.target.files[0]);
    }
  };

  return (
    <main className="page-padding">
      <PageHeader showBack subtitle="Step 5 of 6" title="Take a Selfie" />

      <div className="mb-6 flex w-full items-center justify-center">
        {steps.map((step, index, arr) => (
          <div key={step} className="flex items-center">
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                step === 5 ? "bg-app-primary text-white" : step < 5 ? "bg-app-primary/20 text-app-primary" : "bg-[#f1f4f1] text-app-subtle"
              }`}
            >
              {step}
            </div>
            {index < arr.length - 1 && (
              <div className={`h-[2px] w-6 sm:w-8 mx-1 ${step < 5 ? "bg-app-primary/20" : "bg-[#f1f4f1]"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="space-y-5">
        <section className="surface-card p-4">
          <h2 className="text-base font-semibold text-app-text">User Verification</h2>
          <p className="mt-1 text-sm text-app-subtle">Upload a clear selfie or photo to verify your identity.</p>
          
          <div className="mt-5">
            <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-app-border bg-app-card p-8 text-center min-h-[200px]">
              <input
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleFileChange}
                className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
              />
              {booking.userPhotoFile ? (
                <>
                  <div className="rounded-full bg-emerald-50 p-4 text-app-primary mb-3">
                    <FileImage size={32} />
                  </div>
                  <p className="text-sm font-medium text-app-text">{booking.userPhotoFile.name}</p>
                  <p className="text-xs text-app-subtle mt-2">Tap to retake photo</p>
                </>
              ) : (
                <>
                  <div className="rounded-full bg-[#f1f4f1] p-4 text-app-subtle mb-3">
                    <Camera size={32} />
                  </div>
                  <p className="text-sm font-medium text-app-text">Take a selfie or upload</p>
                  <p className="text-xs text-app-subtle mt-2">Make sure your face is clearly visible</p>
                </>
              )}
            </div>
          </div>
        </section>

        <PriceBreakdown pricing={pricing} />
        <Button className="w-full" onClick={() => navigate("/user/booking/payment")}>
          Next
        </Button>
      </div>
    </main>
  );
};

export default UserPhotoPage;
