import { ArrowLeft, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PageHeader = ({ title, subtitle, showBack = false }) => {
  const navigate = useNavigate();

  return (
    <header className="mb-5 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {showBack ? (
          <button
            className="rounded-xl border border-app-border bg-white p-2.5 text-app-text transition hover:border-app-primary hover:text-app-primary"
            onClick={() => navigate(-1)}
            type="button"
          >
            <ArrowLeft size={18} />
          </button>
        ) : null}
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight text-app-text">{title}</h1>
          {subtitle ? <p className="mt-0.5 text-sm text-app-subtle">{subtitle}</p> : null}
        </div>
      </div>

      <button className="rounded-xl border border-app-border bg-white p-3 text-app-subtle transition hover:text-app-primary" type="button">
        <Bell size={18} />
      </button>
    </header>
  );
};

export default PageHeader;
