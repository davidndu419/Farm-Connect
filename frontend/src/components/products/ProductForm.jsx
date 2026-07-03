import { NIGERIAN_STATES, PRODUCT_CATEGORIES, PRODUCT_UNITS } from "@farm-connect/contracts";
import { useForm } from "react-hook-form";
import { Button } from "../common/Button.jsx";
import { FormField } from "../common/FormField.jsx";

export function ProductForm({ initialValues, onSubmit, submitLabel = "Save product" }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: initialValues ?? { category: "vegetables", unit: "kg", state: "Lagos" }
  });
  return (
    <form className="grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
      <FormField label="Product title" error={errors.title?.message}><input className="form-input" {...register("title", { required: "Enter a title." })} /></FormField>
      <FormField label="Category"><select className="form-input" {...register("category")}>{PRODUCT_CATEGORIES.map((x) => <option key={x}>{x}</option>)}</select></FormField>
      <div className="sm:col-span-2"><FormField label="Description" error={errors.description?.message}><textarea className="form-input min-h-32" {...register("description", { required: "Describe the product.", minLength: { value: 20, message: "Use at least 20 characters." } })} /></FormField></div>
      <FormField label="Price (NGN)"><input className="form-input" type="number" min="0.01" step="0.01" {...register("price", { required: true, valueAsNumber: true })} /></FormField>
      <FormField label="Unit"><select className="form-input" {...register("unit")}>{PRODUCT_UNITS.map((x) => <option key={x}>{x}</option>)}</select></FormField>
      <FormField label="Available quantity"><input className="form-input" type="number" min="0" step="0.01" {...register("availableQuantity", { required: true, valueAsNumber: true })} /></FormField>
      <FormField label="State"><select className="form-input" {...register("state")}>{NIGERIAN_STATES.map((x) => <option key={x}>{x}</option>)}</select></FormField>
      <FormField label="City" error={errors.city?.message}><input className="form-input" {...register("city", { required: "Enter the pickup city." })} /></FormField>
      <FormField label="Product images" hint="1–5 JPEG, PNG, or WebP files."><input className="form-input" type="file" multiple accept="image/jpeg,image/png,image/webp" {...register("images")} /></FormField>
      <div className="sm:col-span-2"><Button disabled={isSubmitting}>{isSubmitting ? "Saving…" : submitLabel}</Button></div>
    </form>
  );
}
