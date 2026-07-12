import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ArrowUpDown, Undo2 } from "lucide-react";
import { Button, Select, Skeleton } from "@/components/ui";
import { Badge } from "@/components/ui";
import { DataState, EmptyState } from "../../components/data";
import { allocationsApi } from "@/features/allocations/api";
import { useDepartments } from "@/features/org/hooks";
import { getApiMessage } from "@/lib/api";
import ReturnDialog from "./ReturnDialog";

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "—");

const SortableHeader = ({ label, sortKey, sort, onSort }) => {
  const isActive = sort.sortBy === sortKey;
  const Icon = isActive ? (sort.sortOrder === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <th className="px-4 py-3">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-zinc-500 hover:text-zinc-200"
      >
        {label}
        <Icon size={12} />
      </button>
    </th>
  );
};

const ActiveAllocationsTab = () => {
  const { user } = useSelector((state) => state.auth);
  const canManage = user.role === "ADMIN" || user.role === "ASSET_MANAGER";
  const { data: departments } = useDepartments();

  const [status, setStatus] = useState("active");
  const [departmentId, setDepartmentId] = useState("");
  const [sort, setSort] = useState({ sortBy: "allocatedAt", sortOrder: "desc" });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], total: 0, page: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [returning, setReturning] = useState(null);
  const limit = 10;

  const params = useMemo(
    () => ({ status, departmentId: departmentId || undefined, sortBy: sort.sortBy, sortOrder: sort.sortOrder, page, limit }),
    [status, departmentId, sort, page],
  );

  const load = () => {
    setIsLoading(true);
    setError("");
    allocationsApi
      .list(params)
      .then((res) => setResult(res.payload))
      .catch((err) => setError(getApiMessage(err, "Could not load allocations")))
      .finally(() => setIsLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [JSON.stringify(params)]);

  const onSort = (key) => {
    setSort((prev) =>
      prev.sortBy === key ? { sortBy: key, sortOrder: prev.sortOrder === "asc" ? "desc" : "asc" } : { sortBy: key, sortOrder: "asc" },
    );
  };

  const requestReturn = async (allocation) => {
    try {
      await allocationsApi.requestReturn(allocation.id);
      toast.success("Return requested.");
      load();
    } catch (err) {
      toast.error(getApiMessage(err, "Could not request return."));
    }
  };

  const totalPages = Math.max(1, Math.ceil(result.total / limit));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-[10rem]">
          <option value="active">Active</option>
          <option value="overdue">Overdue only</option>
          <option value="returned">Returned</option>
          <option value="">All</option>
        </Select>
        <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="max-w-[10rem]">
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
        <span className="text-xs text-zinc-500">{result.total} allocations</span>
      </div>

      <DataState isLoading={isLoading} error={error} isEmpty={result.data.length === 0} empty={<EmptyState title="No allocations found" />}>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-800 bg-zinc-900/60">
                  <tr>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">Asset</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">Holder</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">Department</th>
                    <SortableHeader label="Allocated" sortKey="allocatedAt" sort={sort} onSort={onSort} />
                    <SortableHeader label="Expected Return" sortKey="expectedReturnDate" sort={sort} onSort={onSort} />
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {result.data.map((allocation) => (
                    <tr key={allocation.id} className="text-zinc-200">
                      <td className="px-4 py-3 font-medium">{allocation.asset.assetTag}</td>
                      <td className="px-4 py-3">{allocation.user?.name || "Department allocation"}</td>
                      <td className="px-4 py-3 text-zinc-400">{allocation.user?.department?.name || "—"}</td>
                      <td className="px-4 py-3 text-zinc-400">{formatDate(allocation.allocatedAt)}</td>
                      <td className="px-4 py-3 text-zinc-400">{formatDate(allocation.expectedReturnDate)}</td>
                      <td className="px-4 py-3">
                        {allocation.isOverdue ? (
                          <Badge variant="red">Overdue</Badge>
                        ) : allocation.status === "RETURN_REQUESTED" ? (
                          <Badge variant="amber">Return requested</Badge>
                        ) : (
                          <Badge variant={allocation.status === "ACTIVE" ? "blue" : "zinc"}>{allocation.status}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {allocation.status !== "RETURNED" && (
                          <div className="flex justify-end gap-2">
                            {allocation.userId === user.id && allocation.status === "ACTIVE" && (
                              <Button variant="outline" size="sm" onClick={() => requestReturn(allocation)}>
                                <Undo2 size={14} />
                                Request Return
                              </Button>
                            )}
                            {canManage && (
                              <Button size="sm" onClick={() => setReturning(allocation)}>
                                Process Return
                              </Button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-zinc-400">
              <span>
                Page {result.page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </DataState>

      <ReturnDialog open={Boolean(returning)} onOpenChange={(next) => !next && setReturning(null)} allocation={returning} onSaved={load} />
    </div>
  );
};

export default ActiveAllocationsTab;
