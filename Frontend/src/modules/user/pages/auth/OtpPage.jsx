import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../../../components/common/Button";
import { useAuth } from "../../../../hooks/useAuth";

const OtpPage = () => {
  const routerLocation = useLocation();
  const navigate = useNavigate();
  const { verifyOtp } = useAuth();
  const [otp, setOtp] = useState("1234");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    await verifyOtp(otp);
    navigate("/home", { replace: true });
  };

  return (
    <div>
      <p className="eyebrow">Enter OTP</p>
      <h1 className="mt-2 text-[32px] font-semibold tracking-tight text-app-text">Verify your session</h1>
      <p className="mt-3 text-sm leading-6 text-app-subtle">
        We sent a 4 digit code to {routerLocation.state?.phone ?? "your phone number"}. Use `1234`.
      </p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <input
              key={index}
              className="h-14 rounded-xl border border-app-border bg-[#f8faf8] text-center text-xl font-semibold outline-none focus:border-app-primary"
              maxLength={1}
              onChange={(event) => {
                const chars = otp.padEnd(4, " ").split("");
                chars[index] = event.target.value || " ";
                setOtp(chars.join("").replace(/\s/g, "").slice(0, 4));
              }}
              value={otp[index] ?? ""}
            />
          ))}
        </div>
        <p className="text-center text-xs text-app-subtle">Resend OTP in 00:30</p>
        <Button className="w-full" disabled={loading || otp.length < 4} type="submit">
          Verify and continue
        </Button>
      </form>
    </div>
  );
};

export default OtpPage;
