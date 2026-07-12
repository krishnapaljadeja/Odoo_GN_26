import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Archive, Boxes, CalendarClock, CheckCircle2, Clock, Send, Wrench } from "lucide-react";
import { DashboardLayout, PageHeader } from "../../components/layout";
import { DataState, StatCard } from "../../components/data";
import { reportsApi } from "@/features/reports/api";
import { getApiMessage } from "@/lib/api";

const Dashboard = () => {
  const auth = useSelector((state) => state.auth);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    reportsApi
      .kpis()
      .then((res) => setData(res.payload))
      .catch((err) => setError(getApiMessage(err, "Could not load dashboard")))
      .finally(() => setIsLoading(false));
  }, []);

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
              <Link to="/assets" className="ui-button ui-button--default">+ Register Asset</Link>
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
                    <div key={row.id} className="px-4 py-3 text-sm text-zinc-300">
                      <span className="font-medium text-zinc-100">{row.action.replaceAll("_", " ")}</span>{" "}
                      <span className="text-zinc-500">on {row.entity}</span>
                      <span className="float-right text-xs text-zinc-500">{new Date(row.createdAt).toLocaleString()}</span>
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
