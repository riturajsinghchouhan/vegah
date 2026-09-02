const statusClasses = {
  success: "bg-emerald-50 text-app-success",
  warning: "bg-amber-50 text-app-warning",
  danger: "bg-rose-50 text-app-danger",
  neutral: "bg-app-muted text-app-subtle",
};

const StatusPill = ({ tone = "neutral", children }) => (
  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[tone]}`}>{children}</span>
);

export default StatusPill;
