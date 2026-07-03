export function FormField({ label, error, children, hint }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-ink">{label}</span>
      {children}
      {hint && !error ? (
        <span className="mt-1.5 block text-xs text-ink/55">{hint}</span>
      ) : null}
      {error ? (
        <span className="mt-1.5 block text-sm text-red-700" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}
