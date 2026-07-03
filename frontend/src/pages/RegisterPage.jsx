import { NIGERIAN_STATES } from "@farm-connect/contracts";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button.jsx";
import { FormField } from "../components/common/FormField.jsx";
import { useAuth } from "../hooks/useAuth.js";

export function RegisterPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState("");
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    clearErrors,
    formState: { errors, isSubmitting }
  } = useForm({ defaultValues: { role: "buyer", state: "Lagos" } });

  async function submit(values) {
    setFormError("");
    clearErrors();
    try {
      await auth.register(values);
      navigate("/marketplace", { replace: true });
    } catch (error) {
      const knownFields = new Set([
        "fullName",
        "phone",
        "email",
        "password",
        "state",
        "city",
        "role",
        "avatar"
      ]);
      const unmappedErrors = [];

      for (const detail of error.details ?? []) {
        if (detail.source === "body" && knownFields.has(detail.path)) {
          setFieldError(detail.path, {
            type: "server",
            message: detail.message
          });
        } else {
          unmappedErrors.push(
            detail.path ? `${detail.path}: ${detail.message}` : detail.message
          );
        }
      }

      if (!error.details?.length || unmappedErrors.length > 0) {
        setFormError(unmappedErrors.join(" ") || error.message);
      }
    }
  }

  return (
    <>
      <div className="sm:col-span-2 flex justify-center mb-6">
        <img src="/branding/logo.png" className="h-20 w-auto object-contain" alt="Farm Connect Logo" />
      </div>
      <p className="sm:col-span-2 text-sm font-bold uppercase tracking-[0.18em] text-harvest text-center">
        Join the marketplace
      </p>
      <h1 className="sm:col-span-2 mt-2 font-display text-4xl font-bold text-center">Create your account</h1>
      <form className="mt-8 grid gap-5 sm:grid-cols-2 sm:col-span-2" onSubmit={handleSubmit(submit)}>
        <FormField label="Full name" error={errors.fullName?.message}>
          <input className="form-input" autoComplete="name" {...register("fullName", { required: "Enter your full name." })} />
        </FormField>
        <FormField label="Phone number" hint="Use +234 international format." error={errors.phone?.message}>
          <input className="form-input" autoComplete="tel" placeholder="+2348012345678" {...register("phone", { required: "Enter your phone number." })} />
        </FormField>
        <FormField label="Email address" error={errors.email?.message}>
          <input className="form-input" type="email" autoComplete="email" {...register("email", { required: "Enter your email." })} />
        </FormField>
        <FormField label="Password" hint="At least 8 characters." error={errors.password?.message}>
          <input className="form-input" type="password" autoComplete="new-password" {...register("password", { required: "Create a password.", minLength: { value: 8, message: "Use at least 8 characters." } })} />
        </FormField>
        <FormField label="State" error={errors.state?.message}>
          <select className="form-input" {...register("state", { required: true })}>
            {NIGERIAN_STATES.map((state) => <option key={state}>{state}</option>)}
          </select>
        </FormField>
        <FormField label="City" error={errors.city?.message}>
          <input className="form-input" {...register("city", { required: "Enter your city." })} />
        </FormField>
        <FormField label="I am joining as" error={errors.role?.message}>
          <select className="form-input" {...register("role")}>
            <option value="buyer">Buyer</option>
            <option value="farmer">Farmer</option>
          </select>
        </FormField>
        <FormField
          label="Profile picture"
          hint="Optional. JPEG, PNG, or WebP up to 5 MB."
          error={errors.avatar?.message}
        >
          <input
            className="form-input file:mr-3 file:rounded-lg file:border-0 file:bg-leaf/10 file:px-3 file:py-2 file:font-bold file:text-leaf"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            {...register("avatar")}
          />
        </FormField>
        {formError ? <p className="sm:col-span-2 text-sm text-red-700" role="alert">{formError}</p> : null}
        <Button className="sm:col-span-2" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink/65">
        Already registered?{" "}
        <Link className="font-bold text-leaf underline" to="/login">Log in</Link>
      </p>
    </>
  );
}
