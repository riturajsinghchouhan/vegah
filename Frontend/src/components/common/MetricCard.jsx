const MetricCard = ({ label, value, caption }) => (
  <div className="rounded-3xl border border-app-border bg-app-card p-4">
    <p className="text-xs font-medium uppercase tracking-[0.2em] text-app-subtle">{label}</p>
    <p className="mt-2 text-2xl font-semibold tracking-tight text-app-text">{value}</p>
    {caption ? <p className="mt-1 text-sm text-app-subtle">{caption}</p> : null}
  </div>
);

export default MetricCard;
