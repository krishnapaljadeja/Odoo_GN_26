import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Button, Select, Skeleton } from "@/components/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DataState, EmptyState } from "../../components/data";
import { FormField } from "../../components/forms";
import { orgApi } from "@/features/org/api";
import { useDepartments, useEmployees } from "@/features/org/hooks";
import { StatusBadge } from "@/features/org/badges";
import { getApiMessage } from "@/lib/api";

const departmentSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  headId: z.string().optional(),
  parentId: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

const DepartmentDialog = ({ open, onOpenChange, department, employees, departments, onSaved }) => {
  const isEdit = Boolean(department);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: "", headId: "", parentId: "", status: "ACTIVE" },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: department?.name || "",
        headId: department?.headId ? String(department.headId) : "",
        parentId: department?.parentId ? String(department.parentId) : "",
        status: department?.status || "ACTIVE",
      });
    }
  }, [open, department, reset]);

  const onSubmit = async (values) => {
    const payload = {
      name: values.name,
      headId: values.headId ? Number(values.headId) : null,
      parentId: values.parentId ? Number(values.parentId) : null,
      status: values.status,
    };

    try {
      if (isEdit) {
        await orgApi.updateDepartment(department.id, payload);
        toast.success("Department updated.");
      } else {
        await orgApi.createDepartment(payload);
        toast.success("Department created.");
      }
      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiMessage(error, "Could not save department."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit department" : "Add department"}</DialogTitle>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormField label="Name" placeholder="Engineering" {...register("name")} error={errors.name?.message} />

          <label className="grid gap-2 text-sm font-medium text-zinc-300">
            <span>Head</span>
            <Select {...register("headId")}>
              <option value="">No head assigned</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name || employee.username}
                </option>
              ))}
            </Select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-zinc-300">
            <span>Parent department</span>
            <Select {...register("parentId")}>
              <option value="">No parent</option>
              {departments
                .filter((d) => !department || d.id !== department.id)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
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
              {isEdit ? "Save changes" : "Create department"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const DepartmentsTab = ({ registerAddAction }) => {
  const { data: departments, isLoading, error, refetch } = useDepartments();
  const { data: employees } = useEmployees();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    registerAddAction(() => {
      setEditing(null);
      setDialogOpen(true);
    });
  }, [registerAddAction]);

  const toggleStatus = async (department) => {
    const nextStatus = department.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await orgApi.updateDepartmentStatus(department.id, nextStatus);
      toast.success(`${department.name} marked ${nextStatus.toLowerCase()}.`);
      refetch();
    } catch (err) {
      toast.error(getApiMessage(err, "Could not update status."));
    }
  };

  return (
    <div>
      <DataState
        isLoading={isLoading}
        error={error}
        isEmpty={departments.length === 0}
        empty={
          <EmptyState
            title="No departments yet"
            description="Create your first department to start organizing employees and assets."
            actionLabel="Add department"
            onAction={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          />
        }
      >
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900/60 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Head</th>
                  <th className="px-4 py-3">Parent Dept</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {departments.map((department) => (
                  <tr key={department.id} className="text-zinc-200">
                    <td className="px-4 py-3 font-medium">{department.name}</td>
                    <td className="px-4 py-3 text-zinc-400">{department.head?.name || "—"}</td>
                    <td className="px-4 py-3 text-zinc-400">{department.parent?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={department.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditing(department);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil size={14} />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => toggleStatus(department)}>
                          {department.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataState>

      <DepartmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        department={editing}
        employees={employees}
        departments={departments}
        onSaved={refetch}
      />
    </div>
  );
};

export default DepartmentsTab;
