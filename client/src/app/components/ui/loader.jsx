import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../../lib/utils";

export const Loader = ({ className, label = "Loading" }) => (
  <div className={cn("ui-loader", className)} role="status" aria-live="polite">
    <Loader2 className="ui-loader__icon" size={24} aria-hidden="true" />
    <span>{label}</span>
  </div>
);
