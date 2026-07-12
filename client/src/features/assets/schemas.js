import { z } from "zod";

// Mirrors server/src/validators/assetValidator.js - keep these two in sync.
const nameSchema = z.string().trim().min(2, "Name must be at least 2 characters").max(100);
const idSchema = z.coerce.number().int().positive();
const conditionSchema = z.enum(["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"]);

export const assetFormSchema = z.object({
  name: nameSchema,
  categoryId: idSchema,
  serialNumber: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9-]+$/, "Serial number can only contain letters, numbers and dashes")
    .min(3, "Serial number must be at least 3 characters")
    .max(64)
    .optional()
    .or(z.literal("")),
  acquisitionDate: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || new Date(value) <= new Date(), "Acquisition date cannot be in the future"),
  acquisitionCost: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || Number(value) > 0, "Acquisition cost must be positive"),
  condition: conditionSchema,
  location: z.string().trim().max(200).optional().or(z.literal("")),
  departmentId: z.string().optional().or(z.literal("")),
  isBookable: z.boolean().optional(),
  photoUrl: z.string().trim().optional().or(z.literal("")),
});

export const changeStatusSchema = z.object({
  status: z.enum(["AVAILABLE", "LOST", "RETIRED", "DISPOSED"]),
  reason: z.string().trim().min(10, "Reason must be at least 10 characters").max(500),
});
