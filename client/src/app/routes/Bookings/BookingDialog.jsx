import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { bookingFormSchema } from "@/features/bookings/schemas";

const BookingDialog = ({ open, onOpenChange, resource, date, initialValues, title = "Book a slot", onSubmit }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: initialValues || { date, startTime: "10:00", endTime: "11:00", purpose: "" },
  });

  useEffect(() => {
    if (open) reset(initialValues || { date, startTime: "10:00", endTime: "11:00", purpose: "" });
  }, [date, initialValues, open, reset]);

  const close = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={close}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{resource ? `${resource.name} · ${resource.assetTag}` : "Select a resource first"}</DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-2 text-sm font-medium text-zinc-300">
              <span>Date</span>
              <Input type="date" {...register("date")} />
              {errors.date && <span className="text-xs text-red-400">{errors.date.message}</span>}
            </label>
            <label className="grid gap-2 text-sm font-medium text-zinc-300">
              <span>Start</span>
              <Input type="time" step="900" {...register("startTime")} />
              {errors.startTime && <span className="text-xs text-red-400">{errors.startTime.message}</span>}
            </label>
            <label className="grid gap-2 text-sm font-medium text-zinc-300">
              <span>End</span>
              <Input type="time" step="900" {...register("endTime")} />
              {errors.endTime && <span className="text-xs text-red-400">{errors.endTime.message}</span>}
            </label>
          </div>

          <label className="grid gap-2 text-sm font-medium text-zinc-300">
            <span>Purpose</span>
            <Textarea placeholder="Procurement Team sync, interview panel, delivery run..." {...register("purpose")} />
            {errors.purpose && <span className="text-xs text-red-400">{errors.purpose.message}</span>}
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} disabled={!resource}>
              Confirm
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;
