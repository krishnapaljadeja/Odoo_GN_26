import { z } from "zod";

export const createAuditSchema = z
  .object({
    title: z.string().trim().min(3, "Title is required").max(160),
    scopeDeptId: z.string().optional(),
    scopeLocation: z.string().trim().max(120).optional(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    auditorIds: z.array(z.string()).min(1, "Assign at least one auditor"),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "End date must be on or after start date",
    path: ["endDate"],
  })
  .refine((data) => Boolean(data.scopeDeptId) || Boolean(data.scopeLocation), {
    message: "Select a department or location scope",
    path: ["scopeDeptId"],
  });

export const auditItemSchema = z.object({
  result: z.enum(["PENDING", "VERIFIED", "MISSING", "DAMAGED"]),
  notes: z.string().trim().max(500).optional(),
});
