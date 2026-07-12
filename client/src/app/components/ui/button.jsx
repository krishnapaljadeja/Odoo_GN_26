import React from "react";
import { Loader2 } from "lucide-react";
import { cva } from "class-variance-authority";
import { cn } from "../../../lib/utils";

const buttonVariants = cva("ui-button", {
  variants: {
    variant: {
      default: "ui-button--default",
      outline: "ui-button--outline",
      ghost: "ui-button--ghost",
      destructive: "ui-button--destructive",
    },
    size: {
      default: "ui-button--md",
      sm: "ui-button--sm",
      lg: "ui-button--lg",
      icon: "ui-button--icon",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export const Button = React.forwardRef(
  ({ className, variant, size, type = "button", isLoading = false, children, disabled, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="ui-button__spinner" size={16} aria-hidden="true" />}
      {children}
    </button>
  ),
);

Button.displayName = "Button";

export { buttonVariants };
