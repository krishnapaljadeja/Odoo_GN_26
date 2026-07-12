import React, { useEffect, useMemo, useState } from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { AlertTriangle, ClipboardCheck, Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout, PageHeader } from "../../components/layout";
import { Button, Input, Select } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { DataState, EmptyState } from "../../components/data";
import { auditsApi } from "@/features/audits/api";
import { AuditStatusBadge, ResultBadge } from "@/features/audits/badges";
import { orgApi } from "@/features/org/api";
import { useDepartments } from "@/features/org/hooks";
import { getApiMessage } from "@/lib/api";
import CreateAuditDialog from "./CreateAuditDialog";
import CloseAuditDialog from "./CloseAuditDialog";

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "-");
const MANAGER_ROLES = ["ADMIN", "ASSET_MANAGER"];

const toCsv = (items) => {
  const header = ["Asset Tag", "Asset", "Expected Location", "Result", "Notes"];
  const rows = items.map((item) => [item.asset.assetTag, item.asset.name, item.expectedLocation || "", item.result, item.notes || ""]);
  return [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
};

const downloadDiscrepancies = (cycle, discrepancies) => {
  const blob = new Blob([toCsv(discrepancies)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${cycle.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-discrepancies.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const AuditsList = ({ onCreate }) => {
  const { data: departments } = useDepartments();
  const role = useSelector((state) => state.auth.user.role);
  const canManage = MANAGER_ROLES.includes(role);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [department, setDepartment] = useState("");
  const [result, setResult] = useState({ data: [], total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const params = useMemo(() => ({ search, status: status || undefined, scopeDeptId: department || undefined, limit: 50 }), [search, status, department]);

  const load = () => {
    setIsLoading(true);
    setError("");
    auditsApi
      .list(params)
      .then((res) => setResult(res.payload))
      .catch((err) => setError(getApiMessage(err, "Could not load audit cycles")))
      .finally(() => setIsLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [JSON.stringify(params)]);

  return (
    <>
      <PageHeader
        title="Audit"
        description="Create audit cycles, verify assets, and generate discrepancy reports."
        actions={
          canManage && (
            <Button onClick={onCreate}>
              <Plus size={16} />
              Create Audit Cycle
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input placeholder="Search audits..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-[10rem]">
          <option value="">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
        </Select>
        <Select value={department} onChange={(e) => setDepartment(e.target.value)} className="max-w-[12rem]">
          <option value="">All departments</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </Select>
        <span className="text-xs text-zinc-500">{result.total} cycles</span>
      </div>

      <DataState isLoading={isLoading} error={error} isEmpty={result.data.length === 0} empty={<EmptyState title="No audit cycles yet" />}>
        <div className="grid gap-3">
          {result.data.map((cycle) => (
            <Link key={cycle.id} to={`/audits/${cycle.id}`} className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 transition hover:border-zinc-700">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-zinc-100">{cycle.title}</div>
                  <div className="mt-1 text-sm text-zinc-500">
                    {formatDate(cycle.startDate)} - {formatDate(cycle.endDate)} · Auditors:{" "}
                    {cycle.assignments.map((assignment) => assignment.auditor.name || assignment.auditor.email).join(", ")}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{cycle.itemCount} assets</Badge>
                  <AuditStatusBadge status={cycle.status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </DataState>
    </>
  );
};

const AuditDetail = () => {
  const { id } = useParams();
  const history = useHistory();
  const role = useSelector((state) => state.auth.user.role);
  const canManage = MANAGER_ROLES.includes(role);
  const canMarkAsAdmin = role === "ADMIN";

  const [cycle, setCycle] = useState(null);
  const [discrepancies, setDiscrepancies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [closeOpen, setCloseOpen] = useState(false);

  const load = () => {
    setIsLoading(true);
    setError("");
    Promise.all([auditsApi.getById(id), auditsApi.discrepancies(id)])
      .then(([cycleRes, discRes]) => {
        setCycle(cycleRes.payload);
        setDiscrepancies(discRes.payload);
      })
      .catch((err) => setError(getApiMessage(err, "Could not load audit cycle")))
      .finally(() => setIsLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [id]);

  const updateItem = async (item, result, notes = item.notes || "") => {
    try {
      await auditsApi.updateItem(cycle.id, item.id, { result, notes });
      toast.success(`${item.asset.assetTag} marked ${result.toLowerCase()}.`);
      load();
    } catch (err) {
      toast.error(getApiMessage(err, "Could not update audit item."));
    }
  };

  const closeCycle = async () => {
    try {
      await auditsApi.close(cycle.id);
      toast.success("Audit cycle closed. Asset statuses updated.");
      setCloseOpen(false);
      load();
    } catch (err) {
      toast.error(getApiMessage(err, "Could not close audit cycle."));
    }
  };

  return (
    <DataState isLoading={isLoading} error={error} isEmpty={false}>
      {cycle && (
        <>
          <button type="button" onClick={() => history.push("/audits")} className="mb-4 text-sm text-zinc-400 hover:text-zinc-100">
            Back to audits
          </button>
          <PageHeader
            title={cycle.title}
            description={`${formatDate(cycle.startDate)} - ${formatDate(cycle.endDate)} · Auditors: ${cycle.assignments
              .map((assignment) => assignment.auditor.name || assignment.auditor.email)
              .join(", ")}`}
            actions={
              <>
                <AuditStatusBadge status={cycle.status} />
                {canManage && cycle.status === "OPEN" && (
                  <Button variant="destructive" onClick={() => setCloseOpen(true)}>
                    Close audit cycle
                  </Button>
                )}
              </>
            }
          />

          {discrepancies.length > 0 && (
            <div className="mb-4 rounded-lg border border-amber-800 bg-amber-950/30 p-4 text-amber-100">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} />
                  <span className="font-medium">{discrepancies.length} assets flagged - discrepancy report generated automatically</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => downloadDiscrepancies(cycle, discrepancies)}>
                  <Download size={14} />
                  Export report
                </Button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900/60">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">Asset</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">Expected location</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">Verification</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">Notes</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {cycle.items.map((item) => (
                  <tr key={item.id} className="text-zinc-200">
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.asset.assetTag} {item.asset.name}</div>
                      <div className="text-xs text-zinc-500">{item.asset.department?.name || "No department"}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{item.expectedLocation || "-"}</td>
                    <td className="px-4 py-3">
                      <ResultBadge result={item.result} />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        defaultValue={item.notes || ""}
                        disabled={cycle.status === "CLOSED" || (!canMarkAsAdmin && cycle.status !== "OPEN")}
                        onBlur={(event) => {
                          if (event.target.value !== (item.notes || "")) updateItem(item, item.result, event.target.value);
                        }}
                        className="min-w-[12rem]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      {cycle.status === "OPEN" ? (
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => updateItem(item, "VERIFIED")}>Verified</Button>
                          <Button size="sm" variant="destructive" onClick={() => updateItem(item, "MISSING")}>Missing</Button>
                          <Button size="sm" variant="outline" onClick={() => updateItem(item, "DAMAGED")}>Damaged</Button>
                        </div>
                      ) : (
                        <span className="block text-right text-xs text-zinc-500">Locked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <CloseAuditDialog open={closeOpen} onOpenChange={setCloseOpen} cycle={cycle} discrepancies={discrepancies} onConfirm={closeCycle} />
        </>
      )}
    </DataState>
  );
};

const Audits = () => {
  const { id } = useParams();
  const history = useHistory();
  const { data: departments } = useDepartments();
  const [employees, setEmployees] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    orgApi
      .listEmployees({ limit: 100, status: "ACTIVE" })
      .then((res) => setEmployees(res.payload.data))
      .catch(() => setEmployees([]));
  }, []);

  const createAudit = async (values) => {
    try {
      const res = await auditsApi.create({
        ...values,
        scopeDeptId: values.scopeDeptId ? Number(values.scopeDeptId) : undefined,
        scopeLocation: values.scopeLocation || undefined,
        startDate: new Date(`${values.startDate}T00:00:00`).toISOString(),
        endDate: new Date(`${values.endDate}T00:00:00`).toISOString(),
        auditorIds: values.auditorIds.map(Number),
      });
      toast.success("Audit cycle created.");
      setCreateOpen(false);
      history.push(`/audits/${res.payload.id}`);
    } catch (err) {
      toast.error(getApiMessage(err, "Could not create audit cycle."));
    }
  };

  return (
    <DashboardLayout>
      {id ? <AuditDetail /> : <AuditsList onCreate={() => setCreateOpen(true)} />}
      <CreateAuditDialog open={createOpen} onOpenChange={setCreateOpen} departments={departments} employees={employees} onSubmit={createAudit} />
    </DashboardLayout>
  );
};

export default Audits;
