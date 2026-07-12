import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import { useSelector } from "react-redux";
import { Plus, ArrowDown, ArrowUp, ArrowUpDown, Columns3, List } from "lucide-react";
import { DashboardLayout, PageHeader } from "../../components/layout";
import { Button, Input, Select, Skeleton } from "@/components/ui";
import { DataState, EmptyState } from "../../components/data";
import { assetsApi } from "@/features/assets/api";
import { AssetStatusBadge, CONDITION_LABEL } from "@/features/assets/badges";
import { useDepartments, useCategories } from "@/features/org/hooks";
import { getApiMessage } from "@/lib/api";
import { useLiveRefresh } from "@/app/hooks/useLiveRefresh";
import RegisterAssetDialog from "./RegisterAssetDialog";

const STATUS_OPTIONS = ["AVAILABLE", "ALLOCATED", "RESERVED", "UNDER_MAINTENANCE", "LOST", "RETIRED", "DISPOSED"];

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

const Assets = () => {
  const history = useHistory();
  const role = useSelector((state) => state.auth.user.role);
  const canManage = role === "ADMIN" || role === "ASSET_MANAGER";

  const { data: departments } = useDepartments();
  const { data: categories } = useCategories();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [sort, setSort] = useState({ sortBy: "assetTag", sortOrder: "asc" });
  const [view, setView] = useState("list");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const limit = 10;

  const [result, setResult] = useState({ data: [], total: 0, page: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, categoryId, departmentId]);

  const params = useMemo(
    () => ({
      search: debouncedSearch,
      status: status || undefined,
      categoryId: categoryId || undefined,
      departmentId: departmentId || undefined,
      sortBy: sort.sortBy,
      sortOrder: sort.sortOrder,
      page,
      limit,
    }),
    [debouncedSearch, status, categoryId, departmentId, sort, page],
  );

  const load = useCallback(({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);
    setError("");
    assetsApi
      .list(params)
      .then((res) => setResult(res.payload))
      .catch((err) => setError(getApiMessage(err, "Could not load assets")))
      .finally(() => {
        if (!silent) setIsLoading(false);
      });
  }, [params]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [JSON.stringify(params)]);
  useLiveRefresh(load, { enabled: !dialogOpen, deps: [JSON.stringify(params)] });

  const onSort = (key) => {
    setSort((prev) =>
      prev.sortBy === key ? { sortBy: key, sortOrder: prev.sortOrder === "asc" ? "desc" : "asc" } : { sortBy: key, sortOrder: "asc" },
    );
  };

  const totalPages = Math.max(1, Math.ceil(result.total / limit));
  const kanbanGroups = useMemo(
    () =>
      STATUS_OPTIONS.map((key) => ({
        key,
        label: key.replace("_", " "),
        assets: result.data.filter((asset) => asset.status === key),
      })).filter((group) => group.assets.length > 0),
    [result.data],
  );

  return (
    <DashboardLayout>
      <PageHeader
        title="Assets"
        description="Register assets and track their full lifecycle."
        actions={
          canManage && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus size={16} />
              Register Asset
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by tag, serial, or QR code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="max-w-[12rem]">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-[13rem]">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </Select>
        <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="max-w-[13rem]">
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
        <span className="text-xs text-zinc-500">{result.total} assets</span>
        <div className="ml-auto flex rounded-md border border-zinc-800 p-1">
          <Button
            type="button"
            variant={view === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("list")}
            title="List view"
            aria-label="List view"
          >
            <List size={15} />
          </Button>
          <Button
            type="button"
            variant={view === "kanban" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("kanban")}
            title="Kanban view"
            aria-label="Kanban view"
          >
            <Columns3 size={15} />
          </Button>
        </div>
      </div>

      <DataState
        isLoading={isLoading}
        error={error}
        isEmpty={result.data.length === 0}
        empty={
          <EmptyState
            title="No assets match those filters"
            actionLabel={canManage ? "Register Asset" : undefined}
            onAction={canManage ? () => setDialogOpen(true) : undefined}
          />
        }
      >
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            {view === "list" ? (
              <div className="overflow-x-auto rounded-lg border border-zinc-800">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-zinc-800 bg-zinc-900/60">
                    <tr>
                      <SortableHeader label="Tag" sortKey="assetTag" sort={sort} onSort={onSort} />
                      <SortableHeader label="Name" sortKey="name" sort={sort} onSort={onSort} />
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">Category</th>
                      <SortableHeader label="Status" sortKey="status" sort={sort} onSort={onSort} />
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">Location</th>
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">Department</th>
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">Condition</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {result.data.map((asset) => (
                      <tr
                        key={asset.id}
                        className="cursor-pointer text-zinc-200 hover:bg-zinc-900/60"
                        onClick={() => history.push(`/assets/${asset.id}`)}
                      >
                        <td className="px-4 py-3 font-medium">{asset.assetTag}</td>
                        <td className="px-4 py-3">{asset.name}</td>
                        <td className="px-4 py-3 text-zinc-400">{asset.category?.name || "-"}</td>
                        <td className="px-4 py-3">
                          <AssetStatusBadge status={asset.status} />
                        </td>
                        <td className="px-4 py-3 text-zinc-400">{asset.location || "-"}</td>
                        <td className="px-4 py-3 text-zinc-400">{asset.department?.name || "-"}</td>
                        <td className="px-4 py-3 text-zinc-400">{CONDITION_LABEL[asset.condition]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-3 2xl:grid-cols-4">
                {kanbanGroups.map((group) => (
                  <section key={group.key} className="rounded-lg border border-zinc-800 bg-zinc-950">
                    <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{group.label}</h2>
                      <span className="text-xs text-zinc-500">{group.assets.length}</span>
                    </div>
                    <div className="grid gap-3 p-3">
                      {group.assets.map((asset) => (
                        <button
                          key={asset.id}
                          type="button"
                          onClick={() => history.push(`/assets/${asset.id}`)}
                          className="grid gap-2 rounded-md border border-zinc-800 bg-zinc-900/50 p-3 text-left text-sm transition-colors hover:border-zinc-700 hover:bg-zinc-900"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="font-semibold text-zinc-100">{asset.assetTag}</span>
                            <AssetStatusBadge status={asset.status} />
                          </div>
                          <div className="text-zinc-200">{asset.name}</div>
                          <div className="grid gap-1 text-xs text-zinc-500">
                            <span>{asset.category?.name || "Uncategorized"}</span>
                            <span>
                              {asset.location || "No location"} / {asset.department?.name || "No department"}
                            </span>
                            <span>Condition: {CONDITION_LABEL[asset.condition]}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}

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

      <RegisterAssetDialog open={dialogOpen} onOpenChange={setDialogOpen} categories={categories} departments={departments} onSaved={load} />
    </DashboardLayout>
  );
};

export default Assets;
