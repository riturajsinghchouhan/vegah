const baseClasses =
  "inline-flex min-h-12 items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-app-primary/20 disabled:cursor-not-allowed disabled:opacity-60";

const variants = {
  primary: "bg-[#D1FF42] text-[#1A2230] hover:bg-[#A9CF2A]",
  secondary: "bg-app-muted text-app-text hover:bg-green-500/15",
  ghost: "bg-transparent text-app-text hover:bg-app-muted",
};

const Button = ({ className = "", variant = "primary", type = "button", ...props }) => (
  <button className={`${baseClasses} ${variants[variant]} ${className}`.trim()} type={type} {...props} />
);

export default Button;
