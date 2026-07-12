import { z } from "zod";

const toDate = (date, time) => new Date(`${date}T${time}:00`);

export const bookingFormSchema = z
  .object({
    date: z.string().min(1, "Select a date"),
    startTime: z.string().min(1, "Select a start time"),
    endTime: z.string().min(1, "Select an end time"),
    purpose: z.string().trim().max(200, "Purpose must be 200 characters or less").optional(),
  })
  .refine((data) => toDate(data.date, data.endTime) > toDate(data.date, data.startTime), {
    message: "End time must be after start time",
    path: ["endTime"],
  })
  .refine((data) => toDate(data.date, data.startTime) >= new Date(), {
    message: "Booking start time cannot be in the past",
    path: ["startTime"],
  });

export const buildBookingPayload = (assetId, values) => ({
  assetId: Number(assetId),
  startTime: toDate(values.date, values.startTime).toISOString(),
  endTime: toDate(values.date, values.endTime).toISOString(),
  purpose: values.purpose || undefined,
});
