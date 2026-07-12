import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { DashboardLayout, PageHeader } from "../../components/layout";
import { Button, Input, Select } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataState, EmptyState } from "../../components/data";
import { logsApi, notificationsApi } from "@/features/notifications/api";
import { getApiMessage } from "@/lib/api";

const relativeTime = (value) => {
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const Notifications = () => {
  const role = useSelector((state) => state.auth.user.role);
  const canSeeLogs = ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"].includes(role);
  const [tab, setTab] = useState("all");
  const [notifs, setNotifs] = useState({ data: [], total: 0 });
  const [logs, setLogs] = useState({ data: [], total: 0 });
  const [logSearch, setLogSearch] = useState("");
  const [entity, setEntity] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const logParams = useMemo(() => ({ search: logSearch || undefined, entity: entity || undefined, limit: 50, sortOrder: "desc" }), [logSearch, entity]);

  const loadNotifications = () => {
    setIsLoading(true);
    setError("");
    notificationsApi
      .list({ group: tab, limit: 50 })
      .then((res) => setNotifs(res.payload))
      .catch((err) => setError(getApiMessage(err, "Could not load notifications")))
      .finally(() => setIsLoading(false));
  };

  const loadLogs = () => {
    if (!canSeeLogs) return;
    logsApi
      .list(logParams)
      .then((res) => setLogs(res.payload))
      .catch(() => setLogs({ data: [], total: 0 }));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(loadNotifications, [tab]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(loadLogs, [JSON.stringify(logParams), canSeeLogs]);

  const markRead = async (id) => {
    try {
      await notificationsApi.markRead(id);
      loadNotifications();
    } catch (err) {
      toast.error(getApiMessage(err, "Could not mark read."));
    }
  };

  const markAll = async () => {
    try {
      await notificationsApi.markAllRead();
      toast.success("Notifications marked read.");
      loadNotifications();
    } catch (err) {
      toast.error(getApiMessage(err, "Could not mark notifications read."));
    }
  };

  return (
    <DashboardLayout>
      <PageHeader title="Notifications" description="Alerts, approvals, bookings, and activity history." actions={<Button variant="outline" onClick={markAll}>Mark all read</Button>} />

      <Tabs value={tab} onValueChange={setTab} className="grid gap-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          {canSeeLogs && <TabsTrigger value="logs">Activity Log</TabsTrigger>}
        </TabsList>

        <TabsContent value="all">
          <NotificationList isLoading={isLoading} error={error} notifs={notifs} markRead={markRead} />
        </TabsContent>
        <TabsContent value="alerts">
          <NotificationList isLoading={isLoading} error={error} notifs={notifs} markRead={markRead} />
        </TabsContent>
        <TabsContent value="approvals">
          <NotificationList isLoading={isLoading} error={error} notifs={notifs} markRead={markRead} />
        </TabsContent>
        <TabsContent value="bookings">
          <NotificationList isLoading={isLoading} error={error} notifs={notifs} markRead={markRead} />
        </TabsContent>
        <TabsContent value="logs">
          <div className="mb-4 flex flex-wrap gap-3">
            <Input placeholder="Search actions..." value={logSearch} onChange={(e) => setLogSearch(e.target.value)} className="max-w-xs" />
            <Select value={entity} onChange={(e) => setEntity(e.target.value)} className="max-w-[12rem]">
              <option value="">All entities</option>
              <option value="Asset">Asset</option>
              <option value="Booking">Booking</option>
              <option value="MaintenanceRequest">Maintenance</option>
              <option value="AuditCycle">Audit</option>
              <option value="AuditItem">Audit Item</option>
            </Select>
          </div>
          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900/60">
                <tr>
                  <th className="px-4 py-3 text-xs uppercase tracking-wide text-zinc-500">When</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wide text-zinc-500">Actor</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wide text-zinc-500">Action</th>
                  <th className="px-4 py-3 text-xs uppercase tracking-wide text-zinc-500">Entity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {logs.data.map((log) => (
                  <tr key={log.id} className="text-zinc-300">
                    <td className="px-4 py-3 text-zinc-500">{relativeTime(log.createdAt)}</td>
                    <td className="px-4 py-3">{log.actor?.name || log.actor?.email || "System"}</td>
                    <td className="px-4 py-3">{log.action.replaceAll("_", " ")}</td>
                    <td className="px-4 py-3">{log.entity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

const NotificationList = ({ isLoading, error, notifs, markRead }) => (
  <DataState isLoading={isLoading} error={error} isEmpty={notifs.data.length === 0} empty={<EmptyState title="No notifications here" />}>
    <div className="divide-y divide-zinc-800 rounded-lg border border-zinc-800 bg-zinc-950">
      {notifs.data.map((item) => (
        <button key={item.id} type="button" onClick={() => markRead(item.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-zinc-900/70">
          <span className={`h-2 w-2 rounded-full ${item.isRead ? "bg-zinc-700" : "bg-emerald-400"}`} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-zinc-100">{item.title}</div>
            {item.body && <div className="truncate text-xs text-zinc-500">{item.body}</div>}
          </div>
          <Badge variant={item.type.includes("OVERDUE") || item.type.includes("DISCREPANCY") ? "red" : "default"}>{relativeTime(item.createdAt)}</Badge>
        </button>
      ))}
    </div>
  </DataState>
);

export default Notifications;
