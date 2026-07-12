import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button, Select } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { allocationsApi } from "@/features/allocations/api";
import { returnSchema } from "@/features/allocations/schemas";
import { getApiMessage } from "@/lib/api";

const CONDITION_OPTIONS = ["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"];

const ReturnDialog = ({ open, onOpenChange, allocation, onSaved }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(returnSchema), defaultValues: { returnCondition: "GOOD", checkInNotes: "" } });

  const close = () => {
    reset();
    onOpenChange(false);
  };

  const onSubmit = async (values) => {
    try {
      await allocationsApi.returnAllocation(allocation.id, values);
      toast.success(`${allocation.asset.assetTag} return processed.`);
      onSaved();
      close();
    } catch (error) {
      toast.error(getApiMessage(error, "Could not process return."));
    }
  };

  if (!allocation) return null;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent onClose={close}>
        <DialogHeader>
          <DialogTitle>Process return</DialogTitle>
          <DialogDescription>
            {allocation.asset.assetTag} &middot; held by {allocation.user?.name || "department"}
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <label className="grid gap-2 text-sm font-medium text-zinc-300">
            <span>Return condition</span>
            <Select {...register("returnCondition")}>
              {CONDITION_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-zinc-300">
            <span>Check-in notes</span>
            <Textarea placeholder="Condition on check-in, any observations..." {...register("checkInNotes")} />
            {errors.checkInNotes && <span className="text-xs font-medium text-red-400">{errors.checkInNotes.message}</span>}
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Confirm return
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReturnDialog;
