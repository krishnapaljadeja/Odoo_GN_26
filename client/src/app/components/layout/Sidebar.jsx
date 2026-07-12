import React from "react";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  LayoutDashboard,
  Building2,
  Boxes,
  ArrowLeftRight,
  CalendarClock,
  Wrench,
  ClipboardCheck,
  BarChart3,
  Bell,
} from "lucide-react";

// Exact order from the mockup sidebar (every internal screen).
const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/organization", label: "Organization setup", icon: Building2, roles: ["ADMIN"] },
  { to: "/assets", label: "Assets", icon: Boxes },
  { to: "/allocations", label: "Allocation & Transfer", icon: ArrowLeftRight },
  { to: "/bookings", label: "Resource Booking", icon: CalendarClock },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/audits", label: "Audit", icon: ClipboardCheck },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/notifications", label: "Notifications", icon: Bell },
];

export const SidebarLinks = ({ compact = false }) => {
  const role = useSelector((state) => state.auth.user.role);

  return (
    <>
      {NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role)).map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={`flex items-center gap-2.5 rounded border border-transparent px-3 py-2 text-xs font-semibold uppercase text-zinc-400 transition-colors hover:bg-[#1e293b] hover:text-zinc-100 ${compact ? "shrink-0" : ""}`}
          activeClassName="border-[#1e293b] bg-[#1e293b] text-[#28E99F]"
        >
          <Icon size={14} aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </>
  );
};

const Sidebar = () => {
  const role = useSelector((state) => state.auth.user.role);

  return (
    <nav className="flex h-full flex-col gap-1 p-3 border-r border-[#1e293b] bg-[#0b0f19] font-space-mono">
      <div className="mb-4 px-2 py-2 flex items-center gap-2">
        <div className="w-5 h-5 bg-[#28E99F] rounded flex items-center justify-center font-bold text-[11px] text-zinc-950">
          A
        </div>
        <span className="text-base font-bold tracking-tight text-zinc-50">AssetFlow</span>
      </div>

      <SidebarLinks />
    </nav>
  );
};

export default Sidebar;
