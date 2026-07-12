import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil } from "lucide-react";
import { Button, Input, Select, Skeleton } from "@/components/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DataState, EmptyState } from "../../components/data";
import { orgApi } from "@/features/org/api";
import { useDepartments } from "@/features/org/hooks";
import { StatusBadge, RoleBadge, ROLE_LABEL } from "@/features/org/badges";
import { getApiMessage } from "@/lib/api";
import { useLiveRefresh } from "@/app/hooks/useLiveRefresh";

const ROLE_OPTIONS = ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"];

const editEmployeeSchema = z.object({
  role: z.enum(ROLE_OPTIONS),
  departmentId: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

const EditEmployeeDialog = ({ open, onOpenChange, employee, departments, onSaved }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({ resolver: zodResolver(editEmployeeSchema) });

  useEffect(() => {
    if (open && employee) {
      reset({
        role: employee.role,
        departmentId: employee.departmentId ? String(employee.departmentId) : "",
        status: employee.status,
      });
    }
  }, [open, employee, reset]);

  if (!employee) return null;

  const onSubmit = async (values) => {
    try {
      const nextDepartmentId = values.departmentId ? Number(values.departmentId) : null;

      if (values.role !== employee.role) {
        await orgApi.updateEmployeeRole(employee.id, values.role);
      }

      if (nextDepartmentId !== employee.departmentId || values.status !== employee.status) {
        await orgApi.updateEmployee(employee.id, { departmentId: nextDepartmentId, status: values.status });
      }

      toast.success(`${employee.name || employee.username} updated.`);
      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiMessage(error, "Could not update employee."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Change role &amp; department</DialogTitle>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <p className="text-sm text-zinc-400">
            {employee.name || employee.username} &middot; {employee.email}
          </p>

          <label className="grid gap-2 text-sm font-medium text-zinc-300">
            <span>Role</span>
            <Select {...register("role")}>
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABEL[role]}
                </option>
              ))}
            </Select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-zinc-300">
            <span>Department</span>
            <Select {...register("departmentId")}>
              <option value="">No department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </Select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-zinc-300">
            <span>Status</span>
            <Select {...register("status")}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

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

const EmployeesTab = () => {
  const { data: departments } = useDepartments();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState({ sortBy: "name", sortOrder: "asc" });
  const [page, setPage] = useState(1);
  const limit = 10;

  const [result, setResult] = useState({ data: [], total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, department, role, status]);

  const params = useMemo(
    () => ({
      search: debouncedSearch,
      department: department || undefined,
      role: role || undefined,
      status: status || undefined,
      sortBy: sort.sortBy,
      sortOrder: sort.sortOrder,
      page,
      limit,
    }),
    [debouncedSearch, department, role, status, sort, page],
  );

  const load = useCallback(({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);
    setError("");

    orgApi
      .listEmployees(params)
      .then((res) => setResult(res.payload))
      .catch((err) => setError(getApiMessage(err, "Could not load employees")))
      .finally(() => {
        if (!silent) setIsLoading(false);
      });
  }, [params]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [JSON.stringify(params)]);
  useLiveRefresh(load, { enabled: !editing, deps: [JSON.stringify(params)], intervalMs: 10000 });

  const onSort = (key) => {
    setSort((prev) => (prev.sortBy === key ? { sortBy: key, sortOrder: prev.sortOrder === "asc" ? "desc" : "asc" } : { sortBy: key, sortOrder: "asc" }));
  };

  const totalPages = Math.max(1, Math.ceil(result.total / limit));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={department} onChange={(e) => setDepartment(e.target.value)} className="max-w-[10rem]">
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
        <Select value={role} onChange={(e) => setRole(e.target.value)} className="max-w-[10rem]">
          <option value="">All roles</option>
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-[10rem]">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </Select>
        <span className="text-xs text-zinc-500">{result.total} employees</span>
      </div>

      <DataState
        isLoading={isLoading}
        error={error}
        isEmpty={result.data.length === 0}
        empty={<EmptyState title="No employees match those filters" />}
      >
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-800 bg-zinc-900/60">
                  <tr>
                    <SortableHeader label="Name" sortKey="name" sort={sort} onSort={onSort} />
                    <SortableHeader label="Email" sortKey="email" sort={sort} onSort={onSort} />
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-zinc-500">Department</th>
                    <SortableHeader label="Role" sortKey="role" sort={sort} onSort={onSort} />
                    <SortableHeader label="Status" sortKey="status" sort={sort} onSort={onSort} />
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {result.data.map((employee) => (
                    <tr key={employee.id} className="text-zinc-200">
                      <td className="px-4 py-3 font-medium">{employee.name || employee.username}</td>
                      <td className="px-4 py-3 text-zinc-400">{employee.email}</td>
                      <td className="px-4 py-3 text-zinc-400">{employee.department?.name || "—"}</td>
                      <td className="px-4 py-3">
                        <RoleBadge role={employee.role} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={employee.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => setEditing(employee)}>
                          <Pencil size={14} />
                          Promote / Change role
                        </Button>
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

      <EditEmployeeDialog
        open={Boolean(editing)}
        onOpenChange={(next) => !next && setEditing(null)}
        employee={editing}
        departments={departments}
        onSaved={load}
      />
    </div>
  );
};

export default EmployeesTab;
