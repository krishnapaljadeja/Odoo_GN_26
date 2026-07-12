import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button, Select } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { assetsApi } from "@/features/assets/api";
import { changeStatusSchema } from "@/features/assets/schemas";
import { STATUS_LABEL } from "@/features/assets/badges";
import { getApiMessage } from "@/lib/api";

// Mirrors DIRECT_STATUS_TRANSITIONS in server/src/services/assetService.js -
// only the transitions this dialog is allowed to make directly.
const DIRECT_STATUS_TRANSITIONS = {
  AVAILABLE: ["LOST", "RETIRED"],
  RESERVED: ["LOST", "RETIRED"],
  UNDER_MAINTENANCE: ["LOST", "RETIRED"],
  ALLOCATED: ["LOST"],
  LOST: ["AVAILABLE", "RETIRED"],
  RETIRED: ["DISPOSED"],
  DISPOSED: [],
};

const StatusChangeDialog = ({ open, onOpenChange, asset, onSaved }) => {
  const options = DIRECT_STATUS_TRANSITIONS[asset?.status] || [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(changeStatusSchema),
    defaultValues: { status: options[0] || "", reason: "" },
  });

  const close = () => {
    reset({ status: options[0] || "", reason: "" });
    onOpenChange(false);
  };

  const onSubmit = async (values) => {
    try {
      await assetsApi.changeStatus(asset.id, values);
      toast.success(`${asset.assetTag} marked ${values.status.toLowerCase()}.`);
      onSaved();
      close();
    } catch (error) {
      toast.error(getApiMessage(error, "Could not update asset status."));
    }
  };

  if (!asset) return null;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent onClose={close}>
        <DialogHeader>
          <DialogTitle>Change status</DialogTitle>
          <DialogDescription>
            {asset.assetTag} is currently <strong>{STATUS_LABEL[asset.status]}</strong>.
          </DialogDescription>
        </DialogHeader>

        {options.length === 0 ? (
          <p className="text-sm text-zinc-400">This asset has no direct status changes available.</p>
        ) : (
          <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <label className="grid gap-2 text-sm font-medium text-zinc-300">
              <span>New status</span>
              <Select {...register("status")}>
                {options.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABEL[status]}
                  </option>
                ))}
              </Select>
            </label>

            <label className="grid gap-2 text-sm font-medium text-zinc-300">
              <span>Reason</span>
              <Textarea placeholder="Explain why this status change is happening..." {...register("reason")} />
              {errors.reason && <span className="text-xs font-medium text-red-400">{errors.reason.message}</span>}
            </label>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" isLoading={isSubmitting}>
                Confirm change
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StatusChangeDialog;
