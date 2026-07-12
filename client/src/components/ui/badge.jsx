import React from "react";
import { cn } from "@/lib/utils";

const VARIANT_CLASSES = {
  default: "border-zinc-700 bg-zinc-800 text-zinc-200",
  green: "border-emerald-800 bg-emerald-950/60 text-emerald-400",
  blue: "border-blue-800 bg-blue-950/60 text-blue-400",
  purple: "border-purple-800 bg-purple-950/60 text-purple-400",
  amber: "border-amber-800 bg-amber-950/60 text-amber-400",
  red: "border-red-800 bg-red-950/60 text-red-400",
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
