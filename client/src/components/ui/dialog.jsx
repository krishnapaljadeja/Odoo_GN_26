import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = ({ open, onOpenChange, children }) => {
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onOpenChange(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={() => onOpenChange(false)} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-lg">{children}</div>
    </div>
  );
};

export const DialogContent = ({ children, className, onClose }) => (
  <div className={cn("rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-2xl", className)}>
    {onClose && (
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-200"
        aria-label="Close"
      >
        <X size={16} />
      </button>
    )}
    {children}
  </div>
);

export const DialogHeader = ({ children, className }) => <div className={cn("mb-4", className)}>{children}</div>;

export const DialogTitle = ({ children, className }) => (
  <h2 className={cn("text-lg font-semibold text-zinc-50", className)}>{children}</h2>
);

export const DialogDescription = ({ children, className }) => (
  <p className={cn("mt-1 text-sm text-zinc-400", className)}>{children}</p>
);

export const DialogFooter = ({ children, className }) => (
  <div className={cn("mt-6 flex flex-wrap justify-end gap-2", className)}>{children}</div>
);
