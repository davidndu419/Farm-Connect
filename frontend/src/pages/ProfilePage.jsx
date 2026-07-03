import { NIGERIAN_STATES } from "@farm-connect/contracts";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../components/common/Button.jsx";
import { FormField } from "../components/common/FormField.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useNotifications } from "../hooks/useNotifications.js";

function getInitials(name) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) || "";
  const last = parts[1]?.charAt(0) || "";
  return (first + last).toUpperCase();
}

export function ProfilePage() {
  const auth = useAuth();
  const notifications = useNotifications();
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm();

  useEffect(() => {
    reset({
      fullName: auth.profile?.full_name,
      phone: auth.profile?.phone,
      address: auth.profile?.address ?? "",
      state: auth.profile?.state,
      city: auth.profile?.city
    });
  }, [auth.profile, reset]);

  async function save(values) {
    setError("");
    setNotice("");
    try {
      await auth.updateProfile(values);
      setNotice("Profile saved.");
      setIsEditing(false);
    } catch (caught) {
      setError(caught.message);
    }
  }

  async function changeRole() {
    const target = auth.profile.role === "farmer" ? "buyer" : "farmer";
    await auth.switchRole(target);
    setNotice(
      target === "buyer"
        ? "Role changed to Buyer. Your existing listings remain visible, but product management is disabled."
        : "Role changed to Farmer. You can manage your products again."
    );
  }

  async function changeAvatar(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      await auth.updateAvatar(file);
      setNotice("Profile picture updated.");
    } catch (caught) {
      setError(caught.message);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-2 py-4">
      {/* Top Header Toolbar */}
      <div className="mb-8 pb-4 border-b border-ink/5">
        <h1 className="font-display text-2xl font-bold text-ink">Profile</h1>
      </div>

      <div className="flex flex-col gap-6">
        {/* Section 1: PROFILE HEADER */}
        <section className="rounded-3xl bg-white border border-ink/5 p-6 shadow-soft flex flex-col items-center text-center relative overflow-hidden animate-fade-in">
          {/* Subtle background color flourish */}
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-leaf to-mint" />
          
          <div className="relative mt-4">
            {auth.profile?.avatarUrl ? (
              <img className="size-24 rounded-2xl object-cover shadow-md border border-ink/5" src={auth.profile.avatarUrl} alt="" />
            ) : (
              <div className="size-24 rounded-2xl bg-leaf text-white flex items-center justify-center font-display text-2xl font-bold shadow-md border border-ink/5">
                {getInitials(auth.profile?.full_name)}
              </div>
            )}
          </div>
          
          <h2 className="mt-4 font-display text-2xl font-bold text-ink">{auth.profile?.full_name}</h2>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-leaf/10 text-leaf border border-leaf/15 capitalize mt-2">
            {auth.profile?.role === "farmer" ? "👨‍🌾 Farmer" : "🛍️ Buyer"}
          </span>
          <p className="text-xs text-ink/65 mt-2.5 flex items-center gap-1">
            <span>📍</span> {auth.profile?.city}, {auth.profile?.state}
          </p>

          <button
            onClick={() => setIsEditing(true)}
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl border border-ink/10 bg-white hover:bg-ink/5 px-4 py-2 text-xs font-bold text-leaf shadow-soft transition cursor-pointer"
            type="button"
          >
            ✏️ Edit Profile
          </button>
        </section>

        {/* Section 2: QUICK ACTIONS */}
        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-extrabold tracking-wider text-ink/40 uppercase px-1">Quick Actions</h3>
          
          {/* Notifications Card */}
          <div className="rounded-2xl bg-white border border-ink/5 p-4.5 shadow-soft flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🔔</span>
                <span className="text-sm font-bold text-ink">Notifications</span>
              </div>
              <span className="font-bold uppercase tracking-wider text-[9px] px-2 py-0.5 rounded-full bg-cream border border-ink/5 text-ink/60">
                {!notifications.supported
                  ? "Unavailable"
                  : notifications.permission === "denied"
                  ? "Blocked"
                  : notifications.enabled
                  ? "Enabled"
                  : "Disabled"}
              </span>
            </div>
            
            {!notifications.supported ? (
              <p className="text-[11px] text-ink/50 leading-normal">
                Notifications not supported on this browser.
              </p>
            ) : notifications.permission === "denied" ? (
              <p className="text-[11px] text-ink/50 leading-normal">
                Blocked by browser site settings. Reset permission to enable.
              </p>
            ) : notifications.enabled ? (
              <button
                className="w-full text-center py-2 rounded-xl border border-red-500/10 bg-red-50/70 hover:bg-red-50 text-red-700 font-bold text-xs transition cursor-pointer"
                type="button"
                onClick={notifications.disableNotifications}
              >
                Turn off notifications
              </button>
            ) : (
              <button
                className="w-full text-center py-2 rounded-xl bg-leaf hover:bg-leaf/90 text-white font-bold text-xs transition cursor-pointer"
                type="button"
                onClick={notifications.requestPermission}
              >
                Enable notifications
              </button>
            )}
          </div>

          {/* Switch Role Toggle Card */}
          <div className="flex items-center justify-between w-full rounded-2xl bg-white border border-ink/5 p-4.5 shadow-soft">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">👨‍🌾</span>
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold text-ink">Farmer Mode</span>
                <span className="text-[10px] text-ink/50">Toggle to list crops and manage products</span>
              </div>
            </div>
            <button
              onClick={changeRole}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${auth.profile?.role === "farmer" ? "bg-leaf" : "bg-ink/15"}`}
              type="button"
              aria-label="Toggle Farmer Mode"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${auth.profile?.role === "farmer" ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>
        </section>

        {/* Section 3: ACCOUNT INFORMATION */}
        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-extrabold tracking-wider text-ink/40 uppercase px-1">Account Info</h3>
          
          <div className="rounded-3xl bg-white border border-ink/5 p-6 shadow-soft flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-ink/5 pb-3">
              <span className="text-xs font-extrabold text-ink/40 uppercase tracking-wider">Personal Information</span>
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs font-bold text-leaf hover:underline cursor-pointer"
                type="button"
              >
                Edit
              </button>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-ink/40">Full Name</span>
                <p className="text-sm font-bold text-ink mt-0.5">{auth.profile?.full_name}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-ink/40">Email Address</span>
                <p className="text-sm font-bold text-ink/65 mt-0.5 truncate">{auth.profile?.email}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-ink/40">Phone Number</span>
                <p className="text-sm font-bold text-ink mt-0.5">📞 {auth.profile?.phone}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-ink/40">Location</span>
                <p className="text-sm font-bold text-ink mt-0.5">📍 {auth.profile?.city}, {auth.profile?.state}</p>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-ink/40">Street Address</span>
                <p className="text-sm font-bold text-ink mt-0.5">🏠 {auth.profile?.address || "No address provided"}</p>
              </div>
            </div>
          </div>
        </section>
        
        {notice ? <p className="text-sm font-bold text-leaf text-center animate-fade-in" role="status">{notice}</p> : null}

        {/* Section 4: LOG OUT BUTTON AT BOTTOM */}
        <div className="mt-2 mb-4">
          <button
            onClick={auth.logout}
            className="w-full text-center py-3.5 rounded-2xl border border-red-500/10 bg-red-50/70 hover:bg-red-100/70 text-red-700 font-bold text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-soft"
            type="button"
          >
            <span>🚪</span>
            <span>Log out</span>
          </button>
        </div>
      </div>

      {/* Section 4: EDIT MODAL CONTAINER (Always mounted in DOM for tests, toggle visibility with classes) */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isEditing ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        {/* Backdrop */}
        <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setIsEditing(false)} />
        
        {/* Modal Card Box */}
        <div className={`relative w-full max-w-lg rounded-3xl bg-white border border-ink/5 p-6 sm:p-8 shadow-card flex flex-col max-h-[90vh] overflow-y-auto transition-all duration-300 transform ${isEditing ? "translate-y-0 scale-100" : "translate-y-4 scale-95"}`}>
          <div className="flex items-center justify-between border-b border-ink/5 pb-4 mb-5">
            <h2 className="font-display text-xl font-bold text-ink">Edit Profile</h2>
            <button
              onClick={() => setIsEditing(false)}
              className="text-2xl text-ink/40 hover:text-ink/75 font-semibold cursor-pointer"
              type="button"
            >
              ×
            </button>
          </div>
          
          {/* Profile Picture Upload details */}
          <div className="flex items-center gap-4 border-b border-ink/5 pb-5 mb-5">
            {auth.profile?.avatarUrl ? (
              <img className="size-20 rounded-2xl object-cover shadow-sm border border-ink/5" src={auth.profile.avatarUrl} alt="" />
            ) : (
              <div className="size-20 rounded-2xl bg-leaf/10 border border-leaf/15 text-leaf flex items-center justify-center font-display text-xl font-bold shadow-sm">
                {getInitials(auth.profile?.full_name)}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label className="cursor-pointer rounded-xl bg-leaf hover:bg-leaf/90 px-4 py-2 text-center text-xs font-bold text-white shadow-soft transition">
                {auth.profile?.avatarUrl ? "Change picture" : "Add profile picture"}
                <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={changeAvatar} />
              </label>
              {auth.profile?.avatarUrl ? (
                <button className="text-xs font-bold text-red-600 hover:underline cursor-pointer text-left" type="button" onClick={auth.removeAvatar}>
                  Remove picture
                </button>
              ) : null}
            </div>
          </div>

          <form onSubmit={handleSubmit(save)} className="flex flex-col gap-4">
            <FormField label="Full name" error={errors.fullName?.message}>
              <input className="form-input" {...register("fullName", { required: "Enter your name." })} />
            </FormField>
            
            <FormField label="Phone" error={errors.phone?.message}>
              <input className="form-input" {...register("phone", { required: "Enter your phone." })} />
            </FormField>
            
            <FormField label="Address" error={errors.address?.message}>
              <input
                className="form-input"
                autoComplete="street-address"
                placeholder="Street or collection address"
                {...register("address", {
                  validate: (value) =>
                    !value ||
                    value.trim().length >= 5 ||
                    "Enter at least 5 characters or leave it blank."
                })}
              />
            </FormField>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField label="State">
                <select className="form-input" {...register("state")}>
                  {NIGERIAN_STATES.map((state) => <option key={state}>{state}</option>)}
                </select>
              </FormField>
              
              <FormField label="City" error={errors.city?.message}>
                <input className="form-input" {...register("city", { required: "Enter your city." })} />
              </FormField>
            </div>

            {error ? <p className="text-sm text-red-700 font-bold" role="alert">{error}</p> : null}

            <div className="flex items-center justify-end gap-3 mt-5 border-t border-ink/5 pt-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-xl border border-ink/10 bg-white hover:bg-ink/5 px-5 py-2.5 text-xs font-bold text-ink/75 transition cursor-pointer"
              >
                Cancel
              </button>
              <Button disabled={isSubmitting} type="submit">Save changes</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
