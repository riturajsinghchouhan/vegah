import { Suspense } from "react";
import AppRoutes from "./routes/AppRoutes";

const App = () => (
  <Suspense
    fallback={
      <div className="flex min-h-screen items-center justify-center bg-app">
        <div className="rounded-full border border-app-border bg-app-surface px-5 py-2 text-sm text-app-subtle shadow-soft">
          Loading EVORA...
        </div>
      </div>
    }
  >
    <AppRoutes />
  </Suspense>
);

export default App;
