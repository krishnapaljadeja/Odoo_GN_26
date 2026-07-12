import React from "react";
import { Input } from "../ui";

const FormField = React.forwardRef(({ label, error, id, ...props }, ref) => (
  <label className="grid gap-2 text-sm font-medium text-slate-800" htmlFor={id || props.name}>
    <span>{label}</span>
    <Input ref={ref} id={id || props.name} aria-invalid={Boolean(error)} {...props} />
    {error && <span className="text-xs font-medium text-red-600">{error}</span>}
  </label>
));

FormField.displayName = "FormField";

export default FormField;
