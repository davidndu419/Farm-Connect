export function PublicProfileCard({ profile, listingsCount }) {
  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric"
      })
    : "Recent";

  return (
    <section className="rounded-3xl bg-leaf p-7 text-white shadow-soft sm:p-9">
      <div className="flex flex-col gap-7 sm:flex-row sm:items-center">
        {profile.avatarUrl ? (
          <img
            className="size-32 rounded-3xl border-4 border-white/15 object-cover"
            src={profile.avatarUrl}
            alt={`${profile.full_name}'s profile`}
          />
        ) : (
          <div className="size-32 rounded-3xl border-4 border-white/15 bg-white/10 text-white flex items-center justify-center font-display text-4xl font-bold">
            {((profile.full_name?.charAt(0) || "") + (profile.full_name?.split(/\s+/)[1]?.charAt(0) || "")).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-mint flex items-center gap-1.5">
            <span>{profile.role === "farmer" ? "👨‍🌾" : "🛍️"}</span>
            <span>{profile.role} profile</span>
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold">
            {profile.full_name}
          </h1>
          <p className="mt-1 text-xs text-mint/80">
            🗓️ Member since {memberSince}
          </p>
          {profile.role === "farmer" && listingsCount !== undefined ? (
            <p className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/15">
              🌾 {listingsCount} active {listingsCount === 1 ? "listing" : "listings"}
            </p>
          ) : null}
        </div>
      </div>

      <dl className="mt-8 grid gap-4 rounded-2xl bg-white/10 p-5 sm:grid-cols-3">
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-mint">
            📞 Phone
          </dt>
          <dd className="mt-1 font-bold">
            {profile.phone ? (
              <a className="underline hover:text-mint transition" href={`tel:${profile.phone}`}>
                {profile.phone}
              </a>
            ) : (
              "Phone not provided"
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-mint">
            📍 Address
          </dt>
          <dd className="mt-1">
            {profile.address || "Address not provided"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-mint">
            Location
          </dt>
          <dd className="mt-1">
            {profile.city}, {profile.state}
          </dd>
        </div>
      </dl>
    </section>
  );
}
