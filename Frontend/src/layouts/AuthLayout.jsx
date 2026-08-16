import { Outlet } from "react-router-dom";

const AuthLayout = () => (
  <main className="min-h-screen px-4 py-6">
    <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-5xl items-center gap-8 lg:grid-cols-[1.1fr_430px]">
      <section className="hidden lg:block">
        <p className="eyebrow">EV Mobility Platform</p>
        <h1 className="mt-4 max-w-xl text-5xl font-semibold tracking-tight text-app-text">
          EVORA for rental rides and charging discovery in one app.
        </h1>
        <p className="mt-4 max-w-lg text-base leading-7 text-app-subtle">
          The frontend is now shifting into the same visual direction as your reference: tighter cards, stronger mobile hierarchy, and cleaner green CTA styling.
        </p>
        <div className="mt-8 grid max-w-2xl gap-4 sm:grid-cols-3">
          <div className="surface-card overflow-hidden p-0">
            <img
              alt="Electric car"
              className="h-48 w-full object-cover"
              src="https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=900&q=80"
            />
          </div>
          <div className="surface-card overflow-hidden p-0">
            <img
              alt="Charging station"
              className="h-48 w-full object-cover"
              src="https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=80"
            />
          </div>
          <div className="surface-card overflow-hidden p-0">
            <img
              alt="Electric scooter"
              className="h-48 w-full object-cover"
              src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=80"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto min-h-screen w-full max-w-[430px] bg-white px-5 py-8 shadow-[0_24px_80px_rgba(16,24,40,0.12)] lg:min-h-[860px] lg:rounded-[32px]">
        <Outlet />
      </section>
    </div>
  </main>
);

export default AuthLayout;
