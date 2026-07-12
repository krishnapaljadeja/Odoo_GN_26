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

const Sidebar = () => {
  const role = useSelector((state) => state.auth.user.role);

  return (
    <nav className="flex h-full flex-col gap-1 p-3">
      <div className="mb-3 px-2 py-2">
        <span className="text-lg font-bold tracking-tight text-zinc-50">AssetFlow</span>
      </div>

      {NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role)).map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className="flex items-center gap-2.5 rounded-md border border-transparent px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
          activeClassName="border-zinc-700 bg-zinc-900 text-emerald-400"
        >
          <Icon size={16} aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
};

export default Sidebar;
