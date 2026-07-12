import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, Link } from "react-router-dom";
import { Bell, ChevronDown, LogOut } from "lucide-react";
import { toast } from "sonner";
import { signout } from "../../state/authSlice";
import { authApi } from "@/features/auth/api";
import { getApiMessage } from "@/lib/api";

const ROLE_LABEL = {
  ADMIN: "Admin",
  ASSET_MANAGER: "Asset Manager",
  DEPARTMENT_HEAD: "Department Head",
  EMPLOYEE: "Employee",
};

const TopBar = () => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const history = useHistory();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      dispatch(signout());
      toast.success("Signed out.");
      history.replace("/login");
    } catch (error) {
      toast.error(getApiMessage(error, "Could not sign out."));
    }
  };

  return (
    <header className="flex items-center justify-end gap-4 border-b border-zinc-800 bg-zinc-950 px-6 py-3">
      <Link
        to="/notifications"
        className="relative rounded-md p-2 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
        aria-label="Notifications"
      >
        <Bell size={18} />
      </Link>

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex items-center gap-2 rounded-md border border-zinc-800 px-2.5 py-1.5 text-sm text-zinc-200 hover:bg-zinc-900"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-200">
            {(user.name || user.username || "?").slice(0, 1).toUpperCase()}
          </span>
          <span className="max-w-[10rem] truncate">{user.name || user.username}</span>
          <span className="rounded-full border border-emerald-800 bg-emerald-950/60 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
            {ROLE_LABEL[user.role] || user.role}
          </span>
          <ChevronDown size={14} className="text-zinc-500" />
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-md border border-zinc-800 bg-zinc-900 shadow-lg"
            onMouseLeave={() => setMenuOpen(false)}
          >
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800"
            >
              <LogOut size={14} />
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;
