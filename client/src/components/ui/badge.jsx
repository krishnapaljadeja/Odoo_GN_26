import React from "react";
import { cn } from "@/lib/utils";

const VARIANT_CLASSES = {
  default: "border-zinc-700 bg-zinc-800 text-zinc-200",
  green: "border-amber-800 bg-amber-950/60 text-amber-400",
  blue: "border-zinc-700 bg-zinc-900/70 text-zinc-300",
  purple: "border-zinc-700 bg-zinc-900/70 text-zinc-300",
  amber: "border-amber-800 bg-amber-950/60 text-amber-400",
  red: "border-zinc-700 bg-zinc-900/70 text-zinc-300",
  zinc: "border-zinc-700 bg-zinc-900 text-zinc-400",
};

export const Badge = ({ variant = "default", className, ...props }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
      VARIANT_CLASSES[variant] || VARIANT_CLASSES.default,
      className,
    )}
    {...props}
  />
);

export default Badge;
