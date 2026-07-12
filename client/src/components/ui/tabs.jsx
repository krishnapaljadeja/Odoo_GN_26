import React, { createContext, useContext } from "react";
import { cn } from "@/lib/utils";

const TabsContext = createContext(null);

export const Tabs = ({ value, onValueChange, children, className }) => (
  <TabsContext.Provider value={{ value, onValueChange }}>
    <div className={className}>{children}</div>
  </TabsContext.Provider>
);

export const TabsList = ({ children, className }) => (
  <div className={cn("inline-flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 p-1", className)}>
    {children}
  </div>
);

export const TabsTrigger = ({ value, children, className }) => {
  const ctx = useContext(TabsContext);
  const isActive = ctx.value === value;

  return (
    <button
      type="button"
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        isActive ? "bg-emerald-600 text-zinc-950" : "text-zinc-400 hover:text-zinc-100",
        className,
      )}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, children, className }) => {
  const ctx = useContext(TabsContext);
  if (ctx.value !== value) return null;
  return <div className={className}>{children}</div>;
};
