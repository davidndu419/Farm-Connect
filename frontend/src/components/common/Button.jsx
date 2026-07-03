export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const variants = {
    primary: "bg-leaf text-white hover:bg-leaf/90",
    secondary: "border border-ink/15 bg-white text-ink hover:bg-cream",
    danger: "bg-red-700 text-white hover:bg-red-800"
  };

  return (
    <button
      className={`rounded-xl px-5 py-3 font-bold transition disabled:cursor-not-allowed disabled:opacity-55 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
