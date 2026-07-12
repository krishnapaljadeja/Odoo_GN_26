import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Select } from "@/components/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createAuditSchema } from "@/features/audits/schemas";

const todayInput = () => new Date().toISOString().slice(0, 10);

const CreateAuditDialog = ({ open, onOpenChange, departments, employees, onSubmit }) => {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createAuditSchema),
    defaultValues: { title: "", scopeDeptId: "", scopeLocation: "", startDate: todayInput(), endDate: todayInput(), auditorIds: [] },
  });

  useEffect(() => {
    if (open) reset({ title: "", scopeDeptId: "", scopeLocation: "", startDate: todayInput(), endDate: todayInput(), auditorIds: [] });
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Create audit cycle</DialogTitle>
          <DialogDescription>Matching assets are snapshotted into the checklist when the cycle is created.</DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <label className="grid gap-2 text-sm font-medium text-zinc-300">
            <span>Title</span>
            <Input placeholder="Q3 audit: Engineering dept" {...register("title")} />
            {errors.title && <span className="text-xs text-red-400">{errors.title.message}</span>}
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-zinc-300">
              <span>Scope department</span>
              <Select {...register("scopeDeptId")}>
                <option value="">Any department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </Select>
              {errors.scopeDeptId && <span className="text-xs text-red-400">{errors.scopeDeptId.message}</span>}
            </label>

            <label className="grid gap-2 text-sm font-medium text-zinc-300">
              <span>Scope location</span>
              <Input placeholder="Desk E, Warehouse..." {...register("scopeLocation")} />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-zinc-300">
              <span>Start date</span>
              <Input type="date" {...register("startDate")} />
            </label>
            <label className="grid gap-2 text-sm font-medium text-zinc-300">
              <span>End date</span>
              <Input type="date" {...register("endDate")} />
              {errors.endDate && <span className="text-xs text-red-400">{errors.endDate.message}</span>}
            </label>
          </div>

          <label className="grid gap-2 text-sm font-medium text-zinc-300">
            <span>Auditors</span>
            <Controller
              control={control}
              name="auditorIds"
              render={({ field }) => (
                <select
                  multiple
                  className="ui-input min-h-28"
                  value={field.value}
                  onChange={(event) => field.onChange(Array.from(event.target.selectedOptions).map((option) => option.value))}
                >
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name || employee.email}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.auditorIds && <span className="text-xs text-red-400">{errors.auditorIds.message}</span>}
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create cycle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAuditDialog;
