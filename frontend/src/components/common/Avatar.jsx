export function Avatar({ name, src, className = "size-12" }) {
  if (!src && name) {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.charAt(0) || "";
    const last = parts[1]?.charAt(0) || "";
    const initials = (first + last).toUpperCase();
    
    return (
      <div className={`${className} shrink-0 rounded-full bg-leaf text-white flex items-center justify-center font-bold text-sm border border-ink/5`}>
        {initials}
      </div>
    );
  }

  const avatarSrc = src || "/branding/app-icon.png";
  return (
    <img
      className={`${className} shrink-0 rounded-full object-cover border border-ink/5`}
      src={avatarSrc}
      alt={name ? `${name}'s profile` : ""}
    />
  );
}
