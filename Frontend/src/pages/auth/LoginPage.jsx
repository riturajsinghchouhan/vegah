import { ArrowRight, Bolt, CarFront, CircleHelp, MapPin } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import { useAuth } from "../../hooks/useAuth";

const LoginPage = () => {
  const navigate = useNavigate();
  const { requestOtp } = useAuth();
  const [phone, setPhone] = useState("98765 43210");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    await requestOtp(`+91 ${phone}`);
    navigate("/otp", { state: { phone: `+91 ${phone}` } });
  };

  return (
    <div>
      <div className="mb-8 flex items-center gap-2">
        <div className="rounded-2xl bg-[#ebfff1] p-2 text-app-primary">
          <Bolt size={18} />
        </div>
        <div>
          <p className="text-2xl font-extrabold tracking-tight text-app-text">EVORA</p>
          <p className="text-xs text-app-subtle">Move Green. Live Smart.</p>
        </div>
      </div>

      <p className="eyebrow">Welcome to EVORA</p>
      <h1 className="mt-2 text-[34px] font-semibold leading-[1.1] tracking-tight text-app-text">Login or sign up to continue</h1>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-[72px_1fr] gap-2">
          <Input label="Code" readOnly value="+91" />
          <Input
            label="Enter mobile number"
            onChange={(event) => setPhone(event.target.value)}
            placeholder="98765 43210"
            value={phone}
          />
        </div>

        <Button className="w-full" disabled={loading} type="submit">
          Continue <ArrowRight className="ml-2" size={16} />
        </Button>

        <div className="rounded-[20px] bg-[#f7f9f7] p-4">
          <div className="grid gap-3 text-sm text-app-subtle">
            <div className="flex items-center gap-3">
              <CarFront size={16} className="text-app-primary" />
              <span>Rent cars, bikes and scooters</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={16} className="text-app-primary" />
              <span>Discover nearby charging stations</span>
            </div>
            <div className="flex items-center gap-3">
              <CircleHelp size={16} className="text-app-primary" />
              <span>OTP flow follows the mobile reference style</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
