const Input = ({ label, hint, className = "", ...props }) => (
  <label className="block">
    {label ? <span className="mb-2 block text-sm font-medium text-app-text">{label}</span> : null}
    <input
      className={`w-full rounded-xl border border-app-border bg-[#f8faf8] px-4 py-3 text-sm text-app-text outline-none transition placeholder:text-app-subtle focus:border-app-primary focus:bg-white ${className}`}
      {...props}
    />
    {hint ? <span className="mt-2 block text-xs text-app-subtle">{hint}</span> : null}
  </label>
);

export default Input;
