import { z } from "zod";

export const createTransferSchema = z.object({
  toUserId: z.string().min(1, "Select an employee"),
  reason: z.string().trim().min(10, "Reason must be at least 10 characters").max(1000),
});
