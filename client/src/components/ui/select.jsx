import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef(({ className, children, ...props }, ref) => (
  <span className={cn("relative block", className)}>
    <select
      ref={ref}
      className="ui-input w-full appearance-none pr-10"
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      aria-hidden="true"
      size={18}
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
    />
  </span>
));

Select.displayName = "Select";

export default Select;
