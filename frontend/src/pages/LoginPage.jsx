import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button.jsx";
import { FormField } from "../components/common/FormField.jsx";
import { useAuth } from "../hooks/useAuth.js";

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm();

  async function submit(values) {
    setFormError("");
    try {
      await auth.login(values);
      navigate(location.state?.from?.pathname ?? "/marketplace", { replace: true });
    } catch (error) {
      setFormError(error.message);
    }
  }

  return (
    <>
      <div className="flex justify-center mb-6">
        <img src="/branding/logo.png" className="h-20 w-auto object-contain" alt="Farm Connect Logo" />
      </div>
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-harvest text-center">
        Welcome back
      </p>
      <h1 className="mt-2 font-display text-4xl font-bold text-center">Log in</h1>
      <p className="mt-3 text-ink/65 text-center">Continue your farm-to-market conversations.</p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit(submit)}>
        <FormField label="Email address" error={errors.email?.message}>
          <input
            className="form-input"
            type="email"
            autoComplete="email"
            {...register("email", { required: "Enter your email address." })}
          />
        </FormField>
        <FormField label="Password" error={errors.password?.message}>
          <input
            className="form-input"
            type="password"
            autoComplete="current-password"
            {...register("password", { required: "Enter your password." })}
          />
        </FormField>
        {formError ? <p className="text-sm text-red-700" role="alert">{formError}</p> : null}
        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Logging in…" : "Log in"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink/65">
        New to Farm Connect?{" "}
        <Link className="font-bold text-leaf underline" to="/register">
          Create an account
        </Link>
      </p>
    </>
  );
}
