import React from "react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "ui-input appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-8",
      className,
    )}
    style={{
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")",
    }}
    {...props}
  >
    {children}
  </select>
));

Select.displayName = "Select";

export default Select;
