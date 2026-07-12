import React, { useEffect, useMemo, useState } from "react";
import { Check, ClipboardList, Play, Plus, UserCog, X } from "lucide-react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { DashboardLayout, PageHeader } from "../../components/layout";
import { Button, Input, Select } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { DataState, EmptyState } from "../../components/data";
import { assetsApi } from "@/features/assets/api";
import { orgApi } from "@/features/org/api";
import { maintenanceApi } from "@/features/maintenance/api";
import { PriorityBadge, STATUS_LABEL } from "@/features/maintenance/badges";
import { getApiMessage } from "@/lib/api";
import { AssignDialog, RaiseRequestDialog, RejectDialog, ResolveDialog } from "./MaintenanceDialogs";

const COLUMNS = [
  { key: "PENDING", title: "Pending" },
  { key: "APPROVED", title: "Approved" },
  { key: "TECHNICIAN_ASSIGNED", title: "Technician assigned" },
  { key: "IN_PROGRESS", title: "In progress" },
  { key: "RESOLVED", title: "Resolved" },
];

const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

const relativeDate = (value) => {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
};

const MaintenanceCard = ({ request, canManage, onApprove, onReject, onAssign, onStart, onResolve }) => {
  const technician = request.technician?.name || request.technicianName;

  return (
    <article className={`rounded-md border p-3 ${request.status === "RESOLVED" ? "border-emerald-800 bg-emerald-950/20" : "border-zinc-800 bg-zinc-900/70"}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-zinc-100">
            {request.asset.assetTag} {request.asset.name}
          </div>
          <div className="mt-1 line-clamp-2 text-xs text-zinc-400">{request.description}</div>
        </div>
        <PriorityBadge priority={request.priority} />
      </div>

      <div className="mt-3 grid gap-1 text-xs text-zinc-500">
        <span>Requester: {request.requester?.name || request.requester?.email || "Unknown"}</span>
        {technician && <span>Tech: {technician}</span>}
        <span>{relativeDate(request.updatedAt || request.createdAt)}</span>
      </div>

      {canManage && (
        <div className="mt-3 flex flex-wrap gap-2">
          {request.status === "PENDING" && (
            <>
              <Button size="sm" onClick={() => onApprove(request)}>
                <Check size={14} />
                Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onReject(request)}>
                <X size={14} />
                Reject
              </Button>
            </>
          )}
          {request.status === "APPROVED" && (
            <Button size="sm" onClick={() => onAssign(request)}>
              <UserCog size={14} />
              Assign
            </Button>
          )}
          {request.status === "TECHNICIAN_ASSIGNED" && (
            <Button size="sm" onClick={() => onStart(request)}>
              <Play size={14} />
              Start
            </Button>
          )}
          {request.status === "IN_PROGRESS" && (
            <Button size="sm" onClick={() => onResolve(request)}>
              <Check size={14} />
              Resolve
            </Button>
          )}
        </div>
      )}
    </article>
  );
};

const Maintenance = () => {
  const role = useSelector((state) => state.auth.user.role);
  const canManage = role === "ADMIN" || role === "ASSET_MANAGER";

  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("");
  const [showRejected, setShowRejected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [raiseOpen, setRaiseOpen] = useState(false);
  const [rejecting, setRejecting] = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [resolving, setResolving] = useState(null);

  const params = useMemo(() => ({ search: search || undefined, priority: priority || undefined, limit: 100 }), [search, priority]);

  const load = () => {
    setIsLoading(true);
    setError("");
    Promise.all([
      maintenanceApi.list(params),
      assetsApi.list({ limit: 100, sortBy: "assetTag", sortOrder: "asc" }),
      orgApi.listEmployees({ limit: 100, status: "ACTIVE" }),
    ])
      .then(([maintenanceRes, assetsRes, employeesRes]) => {
        setRequests(maintenanceRes.payload.data);
        setAssets(assetsRes.payload.data);
        setEmployees(employeesRes.payload.data);
      })
      .catch((err) => setError(getApiMessage(err, "Could not load maintenance board")))
      .finally(() => setIsLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [JSON.stringify(params)]);

  const mutate = async (action, success) => {
    try {
      await action();
      toast.success(success);
      await load();
    } catch (err) {
      toast.error(getApiMessage(err, "Could not update maintenance request."));
    }
  };

  const grouped = useMemo(() => {
    const base = Object.fromEntries(COLUMNS.map((column) => [column.key, []]));
    requests
      .filter((request) => showRejected || request.status !== "REJECTED")
      .forEach((request) => {
        if (!base[request.status]) base[request.status] = [];
        base[request.status].push(request);
      });
    Object.values(base).forEach((rows) => rows.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || new Date(b.updatedAt) - new Date(a.updatedAt)));
    return base;
  }, [requests, showRejected]);

  const rejected = requests.filter((request) => request.status === "REJECTED");

  return (
    <DashboardLayout>
      <PageHeader
        title="Maintenance"
        description="Approve repair work, assign technicians, and return assets to service."
        actions={
          <Button onClick={() => setRaiseOpen(true)}>
            <Plus size={16} />
            Raise Request
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input placeholder="Search asset or issue..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs min-w-[14rem]" />
        <Select value={priority} onChange={(e) => setPriority(e.target.value)} className="max-w-[10rem] min-w-[10rem]">
          <option value="">All priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </Select>
        <Button variant={showRejected ? "default" : "outline"} size="sm" onClick={() => setShowRejected((value) => !value)}>
          Rejected
          {rejected.length > 0 && <Badge variant="red">{rejected.length}</Badge>}
        </Button>
        <span className="text-xs text-zinc-500">{requests.length} requests</span>
      </div>

      <DataState
        isLoading={isLoading}
        error={error}
        isEmpty={requests.length === 0}
        empty={<EmptyState title="No maintenance requests yet" actionLabel="Raise Request" onAction={() => setRaiseOpen(true)} />}
      >
        {showRejected ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-100">Rejected requests</h2>
              <Badge variant="red">{rejected.length}</Badge>
            </div>
            <div className="grid gap-3">
              {rejected.length === 0 ? (
                <div className="rounded-md border border-dashed border-zinc-800 p-3 text-xs text-zinc-600">No rejected requests</div>
              ) : (
                rejected.map((request) => (
                  <MaintenanceCard
                    key={request.id}
                    request={request}
                    canManage={canManage}
                    onApprove={(row) => mutate(() => maintenanceApi.approve(row.id), `${row.asset.assetTag} approved. Asset moved under maintenance.`)}
                    onReject={setRejecting}
                    onAssign={setAssigning}
                    onStart={(row) => mutate(() => maintenanceApi.start(row.id), `${row.asset.assetTag} moved in progress.`)}
                    onResolve={setResolving}
                  />
                ))
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 overflow-x-auto pb-2 lg:grid-cols-5">
              {COLUMNS.map((column) => (
                <section key={column.key} className="min-h-[28rem] min-w-[16rem] rounded-lg border border-zinc-800 bg-zinc-950">
                  <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-3">
                    <h2 className="text-sm font-semibold text-zinc-100">{column.title}</h2>
                    <Badge>{grouped[column.key]?.length || 0}</Badge>
                  </div>
                  <div className="grid gap-3 p-3">
                    {(grouped[column.key] || []).length === 0 ? (
                      <div className="rounded-md border border-dashed border-zinc-800 p-3 text-xs text-zinc-600">No {STATUS_LABEL[column.key].toLowerCase()} cards</div>
                    ) : (
                      grouped[column.key].map((request) => (
                        <MaintenanceCard
                          key={request.id}
                          request={request}
                          canManage={canManage}
                          onApprove={(row) => mutate(() => maintenanceApi.approve(row.id), `${row.asset.assetTag} approved. Asset moved under maintenance.`)}
                          onReject={setRejecting}
                          onAssign={setAssigning}
                          onStart={(row) => mutate(() => maintenanceApi.start(row.id), `${row.asset.assetTag} moved in progress.`)}
                          onResolve={setResolving}
                        />
                      ))
                    )}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
              Approving a card moves the asset to under maintenance; resolving returns it to available.
            </div>
          </>
        )}
      </DataState>

      <RaiseRequestDialog
        open={raiseOpen}
        onOpenChange={setRaiseOpen}
        assets={assets}
        onSubmit={(values) =>
          mutate(
            () => maintenanceApi.create({ ...values, assetId: Number(values.assetId), photoUrl: values.photoUrl || undefined }),
            "Maintenance request raised.",
          ).then(() => setRaiseOpen(false))
        }
      />

      <RejectDialog
        open={Boolean(rejecting)}
        onOpenChange={(open) => !open && setRejecting(null)}
        request={rejecting}
        onSubmit={(values) =>
          mutate(() => maintenanceApi.reject(rejecting.id, values), "Maintenance request rejected.").then(() => setRejecting(null))
        }
      />

      <AssignDialog
        open={Boolean(assigning)}
        onOpenChange={(open) => !open && setAssigning(null)}
        request={assigning}
        employees={employees}
        onSubmit={(values) =>
          mutate(
            () => maintenanceApi.assign(assigning.id, { technicianId: values.technicianId ? Number(values.technicianId) : undefined, technicianName: values.technicianName || undefined }),
            "Technician assigned.",
          ).then(() => setAssigning(null))
        }
      />

      <ResolveDialog
        open={Boolean(resolving)}
        onOpenChange={(open) => !open && setResolving(null)}
        request={resolving}
        onSubmit={(values) =>
          mutate(() => maintenanceApi.resolve(resolving.id, values), "Maintenance resolved. Asset status updated.").then(() => setResolving(null))
        }
      />
    </DashboardLayout>
  );
};

export default Maintenance;
