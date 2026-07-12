import React from "react";
import { cn } from "@/lib/utils";

const AppShell = ({ children, className }) => (
  <main className={cn("mx-auto min-h-screen w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8", className)}>
    {children}
  </main>
);

export default AppShell;
