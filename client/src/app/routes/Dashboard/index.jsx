import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Archive, Boxes, CalendarClock, CheckCircle2, Clock, Send, Wrench } from "lucide-react";
import { DashboardLayout, PageHeader } from "../../components/layout";
import { DataState, StatCard } from "../../components/data";
import { reportsApi } from "@/features/reports/api";
import { getApiMessage } from "@/lib/api";
import { useLiveRefresh } from "@/app/hooks/useLiveRefresh";

const titleCase = (value) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const describeActivity = (row) => {
  const details = row.details || {};

  if (row.entity === "TransferRequest") {
    const asset = details.assetTag ? `${details.assetTag}${details.assetName ? ` (${details.assetName})` : ""}` : "asset";
    const route = details.fromUserName && details.toUserName ? ` from ${details.fromUserName} to ${details.toUserName}` : "";

    if (row.action === "TRANSFER_APPROVED") return `Transfer approved: ${asset}${route}`;
    if (row.action === "TRANSFER_REJECTED") return `Transfer rejected: ${asset}${route}`;
    if (row.action === "TRANSFER_REQUESTED") return `Transfer requested: ${asset}${route}`;
  }

  if (row.entity === "MaintenanceRequest") {
    const asset = details.assetTag ? `${details.assetTag}${details.assetName ? ` (${details.assetName})` : ""}` : "asset";
    const technician = details.technicianName ? ` to ${details.technicianName}` : "";
    const actor = row.actor?.name || row.actor?.email;

    if (row.action === "MAINTENANCE_TECHNICIAN_ASSIGNED") return `Maintenance assigned: ${asset}${technician}`;
    if (row.action === "MAINTENANCE_STARTED") return `Maintenance started: ${asset}${actor ? ` by ${actor}` : ""}`;
    if (row.action === "MAINTENANCE_RESOLVED") return `Maintenance resolved: ${asset}${actor ? ` by ${actor}` : ""}`;
    if (row.action === "MAINTENANCE_APPROVED") return `Maintenance approved: ${asset}`;
    if (row.action === "MAINTENANCE_REJECTED") return `Maintenance rejected: ${asset}`;
    if (row.action === "MAINTENANCE_REQUESTED") return `Maintenance requested: ${asset}`;
  }

  if (row.entity === "Booking") {
    const asset = details.assetTag ? `${details.assetTag}${details.assetName ? ` (${details.assetName})` : ""}` : "resource";
    const slot = details.slot ? `, ${details.slot}` : "";
    if (row.action === "BOOKING_CONFIRMED") return `Booking confirmed: ${asset}${slot}`;
    if (row.action === "BOOKING_CANCELLED") return `Booking cancelled: ${asset}${slot}`;
    if (row.action === "BOOKING_RESCHEDULED") return `Booking rescheduled: ${asset}${slot}`;
  }

  if (row.entity === "AuditCycle") {
    if (row.action === "AUDIT_CREATED") return `Audit created: ${details.title || "cycle"}`;
    if (row.action === "AUDIT_CLOSED") return "Audit closed";
  }

  if (row.entity === "AuditItem") {
    const asset = details.assetTag ? `${details.assetTag}${details.assetName ? ` (${details.assetName})` : ""}` : "asset";
    if (row.action === "AUDIT_DISCREPANCY_FLAGGED") return `Audit discrepancy flagged: ${asset} ${details.result?.toLowerCase() || ""}`.trim();
    if (row.action === "AUDIT_ITEM_UPDATED") return `Audit item updated: ${asset}`;
  }

  if (row.entity === "Allocation") {
    const asset = details.assetTag ? `${details.assetTag}${details.assetName ? ` (${details.assetName})` : ""}` : "asset";
    if (row.action === "RETURN_REQUESTED") return `Return requested: ${asset}`;
  }

  if (row.entity === "User" && row.action === "ROLE_CHANGED") {
    return `Role changed: ${details.from || ""} to ${details.to || ""}`.trim();
  }

  if (details.assetTag) {
    return `${titleCase(row.action)}: ${details.assetTag}${details.assetName ? ` (${details.assetName})` : ""}`;
  }

  return `${titleCase(row.action)} on ${row.entity}`;
};

const Dashboard = () => {
  const auth = useSelector((state) => state.auth);
  const canManageAssets = ["ADMIN", "ASSET_MANAGER"].includes(auth.user.role);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);
    setError("");
    reportsApi
      .kpis()
      .then((res) => setData(res.payload))
      .catch((err) => setError(getApiMessage(err, "Could not load dashboard")))
      .finally(() => {
        if (!silent) setIsLoading(false);
      });
  }, []);

  useEffect(load, [load]);
  useLiveRefresh(load, { intervalMs: 8000 });

  const activity = data?.recentActivity || [];

  return (
    <DashboardLayout>
      <PageHeader
        title="Dashboard"
        description={`Welcome, ${auth.user.name || auth.user.username} (${auth.user.role}).`}
      />
      <DataState isLoading={isLoading} error={error} isEmpty={false}>
        {data && (
          <div className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Available" value={data.available} hint="assets ready now" icon={Boxes} />
              <StatCard label="Allocated" value={data.allocated} hint="currently assigned" icon={Archive} />
              <StatCard label="Bookable free" value={data.bookableFree} hint="shared resources" icon={CheckCircle2} />
              <StatCard label="Active Bookings" value={data.activeBookings} hint="upcoming or live" icon={CalendarClock} />
              <StatCard label="Pending Transfers" value={data.pendingTransfers} hint="awaiting approval" icon={Send} />
              <StatCard label="Upcoming Returns" value={data.upcomingReturns} hint="next 7 days" icon={Clock} />
              <StatCard label="Maintenance Today" value={data.maintenanceToday} hint="active repair flow" icon={Wrench} />
            </div>

            {data.overdueReturns > 0 && (
              <Link to="/allocations" className="rounded-lg border border-red-900/60 bg-red-950/40 p-3 text-sm font-medium text-red-300">
                {data.overdueReturns} assets overdue for return - flagged for follow-up
              </Link>
            )}

            <div className="flex flex-wrap gap-3">
              {canManageAssets && <Link to="/assets" className="ui-button ui-button--default">+ Register Asset</Link>}
              <Link to="/bookings" className="ui-button ui-button--outline">Book Resource</Link>
              <Link to="/maintenance" className="ui-button ui-button--outline">Raise Request</Link>
            </div>

            <section className="rounded-lg border border-zinc-800 bg-zinc-950">
              <div className="border-b border-zinc-800 px-4 py-3">
                <h2 className="text-sm font-semibold text-zinc-100">Recent Activity</h2>
              </div>
              <div className="divide-y divide-zinc-800">
                {activity.length === 0 ? (
                  <div className="p-4 text-sm text-zinc-500">No activity yet.</div>
                ) : (
                  activity.map((row) => (
                    <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-zinc-300">
                      <span className="font-medium text-zinc-100">{describeActivity(row)}</span>
                      <span className="text-xs text-zinc-500">{new Date(row.createdAt).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </DataState>
    </DashboardLayout>
  );
};

export default Dashboard;
