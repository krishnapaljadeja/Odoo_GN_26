import React from "react";
import { cn } from "../../../lib/utils";

export const Input = React.forwardRef(({ className, ...props }, ref) => (
  <input className={cn("ui-input", className)} ref={ref} {...props} />
));

Input.displayName = "Input";
