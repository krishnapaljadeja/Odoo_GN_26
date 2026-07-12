import React from "react";
import AppShell from "./AppShell";
import { cn } from "@/lib/utils";

const DashboardLayout = ({ children, aside, className }) => (
  <AppShell className={cn("grid gap-6 lg:grid-cols-[16rem_1fr]", className)}>
    {aside && <aside className="rounded-lg border border-slate-200 bg-white p-4">{aside}</aside>}
    <section className="min-w-0">{children}</section>
  </AppShell>
);

export default DashboardLayout;
