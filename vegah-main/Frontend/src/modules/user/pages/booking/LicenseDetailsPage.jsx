import { FileImage, Upload } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import Button from "../../../../components/common/Button";
import Input from "../../../../components/common/Input";
import PageHeader from "../../../../components/layout/PageHeader";
import { useBooking } from "../../../../hooks/useBooking";
import PriceBreakdown from "../../../../components/booking/PriceBreakdown";

const LicenseDetailsPage = () => {
  const navigate = useNavigate();
  const { booking, pricing, updateBookingField } = useBooking();

  if (!booking.vehicle) {
    return <Navigate to="/user/vehicles" replace />;
  }

  const steps = [1, 2, 3, 4, 5, 6];

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      updateBookingField("licenseFile", e.target.files[0]);
    }
  };

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
              onChange={(event) => updateBookingField("licenseNumber", event.target.value)}
              placeholder="Enter your driving license number"
              value={booking.licenseNumber}
              type="text"
            />
          </div>

          <div className="mt-5">
            <p className="text-sm font-medium text-app-text mb-2">Upload License Image</p>
            <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-app-border bg-app-card p-6 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
              />
              {booking.licenseFile ? (
                <>
                  <div className="rounded-full bg-emerald-50 p-3 text-app-primary mb-3">
                    <FileImage size={24} />
                  </div>
                  <p className="text-sm font-medium text-app-text">{booking.licenseFile.name}</p>
                  <p className="text-xs text-app-subtle mt-1">Tap to change image</p>
                </>
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
        </section>

        <PriceBreakdown pricing={pricing} />
        <Button className="w-full" onClick={() => navigate("/user/booking/battery-package")}>
          Next
        </Button>
      </div>
    </main>
  );
};

export default LicenseDetailsPage;
