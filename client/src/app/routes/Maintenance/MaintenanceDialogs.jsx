import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Select } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  assignMaintenanceSchema,
  raiseMaintenanceSchema,
  rejectMaintenanceSchema,
  resolveMaintenanceSchema,
} from "@/features/maintenance/schemas";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export const RaiseRequestDialog = ({ open, onOpenChange, assets, onSubmit }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(raiseMaintenanceSchema), defaultValues: { assetId: "", description: "", priority: "MEDIUM", photoUrl: "" } });

  useEffect(() => {
    if (open) reset({ assetId: "", description: "", priority: "MEDIUM", photoUrl: "" });
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Raise maintenance request</DialogTitle>
          <DialogDescription>Requests start as pending until an Admin or Asset Manager approves them.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <label className="grid gap-2 text-sm font-medium text-zinc-300">
            <span>Asset</span>
            <Select {...register("assetId")}>
              <option value="">Select asset...</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.assetTag} - {asset.name}
                </option>
              ))}
            </Select>
            {errors.assetId && <span className="text-xs text-red-400">{errors.assetId.message}</span>}
          </label>

          <label className="grid gap-2 text-sm font-medium text-zinc-300">
            <span>Priority</span>
            <Select {...register("priority")}>
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </Select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-zinc-300">
            <span>Description</span>
            <Textarea placeholder="Describe the issue..." {...register("description")} />
            {errors.description && <span className="text-xs text-red-400">{errors.description.message}</span>}
          </label>

          <label className="grid gap-2 text-sm font-medium text-zinc-300">
            <span>Photo URL</span>
            <Input placeholder="/uploads/example.jpg" {...register("photoUrl")} />
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Raise request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const RejectDialog = ({ open, onOpenChange, request, onSubmit }) => {
  const form = useForm({ resolver: zodResolver(rejectMaintenanceSchema), defaultValues: { rejectionReason: "" } });

  useEffect(() => {
    if (open) form.reset({ rejectionReason: "" });
  }, [form, open]);

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Reject request</DialogTitle>
          <DialogDescription>{request.asset.assetTag} - {request.asset.name}</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <label className="grid gap-2 text-sm font-medium text-zinc-300">
            <span>Reason</span>
            <Textarea {...form.register("rejectionReason")} />
            {form.formState.errors.rejectionReason && <span className="text-xs text-red-400">{form.formState.errors.rejectionReason.message}</span>}
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="destructive" isLoading={form.formState.isSubmitting}>Reject</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const AssignDialog = ({ open, onOpenChange, request, employees, onSubmit }) => {
  const form = useForm({ resolver: zodResolver(assignMaintenanceSchema), defaultValues: { technicianId: "", technicianName: "" } });

  useEffect(() => {
    if (open) form.reset({ technicianId: "", technicianName: request?.technicianName || "" });
  }, [form, open, request]);

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Assign technician</DialogTitle>
          <DialogDescription>{request.asset.assetTag} - {request.asset.name}</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <label className="grid gap-2 text-sm font-medium text-zinc-300">
            <span>Employee technician</span>
            <Select {...form.register("technicianId")}>
              <option value="">No employee selected</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name || employee.email}
                </option>
              ))}
            </Select>
            {form.formState.errors.technicianId && <span className="text-xs text-red-400">{form.formState.errors.technicianId.message}</span>}
          </label>
          <label className="grid gap-2 text-sm font-medium text-zinc-300">
            <span>External technician name</span>
            <Input placeholder="R. Varma" {...form.register("technicianName")} />
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" isLoading={form.formState.isSubmitting}>Assign</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const ResolveDialog = ({ open, onOpenChange, request, onSubmit }) => {
  const form = useForm({ resolver: zodResolver(resolveMaintenanceSchema), defaultValues: { resolutionNotes: "" } });

  useEffect(() => {
    if (open) form.reset({ resolutionNotes: "" });
  }, [form, open]);

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Resolve maintenance</DialogTitle>
          <DialogDescription>{request.asset.assetTag} returns to available unless it still has an active allocation.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <label className="grid gap-2 text-sm font-medium text-zinc-300">
            <span>Resolution notes</span>
            <Textarea placeholder="Parts replaced, cleaned, tested..." {...form.register("resolutionNotes")} />
            {form.formState.errors.resolutionNotes && <span className="text-xs text-red-400">{form.formState.errors.resolutionNotes.message}</span>}
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" isLoading={form.formState.isSubmitting}>Resolve</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
