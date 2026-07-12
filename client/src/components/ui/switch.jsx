import React from "react";
import { cn } from "@/lib/utils";

export const Switch = React.forwardRef(({ className, checked, onCheckedChange, ...props }, ref) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    ref={ref}
    onClick={() => onCheckedChange(!checked)}
    className={cn(
      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
      checked ? "bg-amber-500" : "bg-zinc-700",
      className,
    )}
    {...props}
  >
    <span
      className={cn(
        "inline-block h-4 w-4 transform rounded-full bg-zinc-100 transition-transform",
        checked ? "translate-x-6" : "translate-x-1",
      )}
    />
  </button>
));

Switch.displayName = "Switch";

export default Switch;
