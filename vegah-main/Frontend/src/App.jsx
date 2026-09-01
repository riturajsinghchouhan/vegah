import { Suspense, useEffect } from "react";
import AppRoutes from "./routes/AppRoutes";
import Lenis from "lenis";

const App = () => {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: "vertical", // vertical, horizontal
      gestureDirection: "vertical", // vertical, horizontal, both
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-app">
          <div className="rounded-full border border-app-border bg-app-surface px-5 py-2 text-sm text-app-subtle shadow-soft">
            Loading Vegah...
          </div>
        </div>
      }
    >
      <AppRoutes />
    </Suspense>
  );
};

export default App;
