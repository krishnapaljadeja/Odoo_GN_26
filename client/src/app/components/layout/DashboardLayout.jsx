import React from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

const DashboardLayout = ({ children }) => (
  <div className="flex min-h-screen bg-zinc-950">
    <aside className="hidden w-60 shrink-0 border-r border-zinc-800 md:block">
      <Sidebar />
    </aside>
    <div className="flex min-w-0 flex-1 flex-col">
      <TopBar />
      <main className="flex-1 overflow-y-auto px-6 py-6">{children}</main>
    </div>
  </div>
);

export default DashboardLayout;
