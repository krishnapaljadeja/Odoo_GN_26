import { z } from "zod";

export const raiseMaintenanceSchema = z.object({
  assetId: z.string().min(1, "Select an asset"),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(1000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  photoUrl: z.string().optional(),
});

export const rejectMaintenanceSchema = z.object({
  rejectionReason: z.string().trim().min(3, "Rejection reason is required").max(500),
});

export const assignMaintenanceSchema = z
  .object({
    technicianId: z.string().optional(),
    technicianName: z.string().trim().max(120).optional(),
  })
  .refine((data) => Boolean(data.technicianId) || Boolean(data.technicianName), {
    message: "Select a technician or enter a name",
    path: ["technicianId"],
  });

export const resolveMaintenanceSchema = z.object({
  resolutionNotes: z.string().trim().max(500, "Resolution notes must be 500 characters or less").optional(),
});
