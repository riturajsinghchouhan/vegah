import { Battery, BatteryFull } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import Button from "../../../../components/common/Button";
import PageHeader from "../../../../components/layout/PageHeader";
import { useBooking } from "../../../../hooks/useBooking";
import PriceBreakdown from "../../../../components/booking/PriceBreakdown";

const BatteryPackagePage = () => {
  const navigate = useNavigate();
  const { booking, pricing, updateBookingField } = useBooking();

  if (!booking.vehicle) {
    return <Navigate to="/user/vehicles" replace />;
  }

  const steps = [1, 2, 3, 4, 5, 6];

  const packages = [
    {
      id: "single",
      title: "Single Charge",
      description: "One battery charge/swap per day.",
      icon: Battery,
    },
    {
      id: "unlimited",
      title: "Unlimited Package",
      description: "Unlimited battery charges/swaps.",
      icon: BatteryFull,
    },
  ];

  return (
    <main className="page-padding">
      <PageHeader showBack subtitle="Step 4 of 6" title="Battery Package" />

      <div className="mb-6 flex w-full items-center justify-center">
        {steps.map((step, index, arr) => (
          <div key={step} className="flex items-center">
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                step === 4 ? "bg-app-primary text-white" : step < 4 ? "bg-app-primary/20 text-app-primary" : "bg-[#f1f4f1] text-app-subtle"
              }`}
            >
              {step}
            </div>
            {index < arr.length - 1 && (
              <div className={`h-[2px] w-6 sm:w-8 mx-1 ${step < 4 ? "bg-app-primary/20" : "bg-[#f1f4f1]"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="space-y-5">
        <section className="surface-card p-4">
          <h2 className="text-base font-semibold text-app-text">Select Package</h2>
          <p className="mt-1 text-sm text-app-subtle">Choose a battery swapping or charging plan.</p>
          
          <div className="mt-4 grid gap-3">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                className={`flex w-full items-center justify-between rounded-[18px] border p-4 text-left transition ${
                  booking.batteryPackage === pkg.id ? "border-app-primary bg-[#eff9f1]" : "border-app-border bg-white"
                }`}
                onClick={() => updateBookingField("batteryPackage", pkg.id)}
                type="button"
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-xl p-3 ${booking.batteryPackage === pkg.id ? "bg-white text-app-primary" : "bg-[#f1f4f1] text-app-subtle"}`}>
                    <pkg.icon size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-app-text">{pkg.title}</p>
                    <p className="mt-1 text-xs text-app-subtle">{pkg.description}</p>
                  </div>
                </div>
                <div className={`h-4 w-4 rounded-full border ${booking.batteryPackage === pkg.id ? "border-app-primary bg-app-primary" : "border-app-border bg-white"}`} />
              </button>
            ))}
          </div>
        </section>

        <PriceBreakdown pricing={pricing} />
        <Button className="w-full" onClick={() => navigate("/user/booking/photo")}>
          Next
        </Button>
      </div>
    </main>
  );
};

export default BatteryPackagePage;
