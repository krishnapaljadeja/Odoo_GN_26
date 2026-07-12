import { z } from "zod";

export const allocateSchema = z
  .object({
    allocateTo: z.enum(["EMPLOYEE", "DEPARTMENT"]),
    userId: z.string().optional(),
    departmentId: z.string().optional(),
    expectedReturnDate: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((value) => !value || new Date(value) > new Date(), "Expected return date must be in the future"),
  })
  .refine((data) => (data.allocateTo === "EMPLOYEE" ? Boolean(data.userId) : Boolean(data.departmentId)), {
    message: "Select an employee or department to allocate to",
    path: ["userId"],
  });

export const returnSchema = z.object({
  returnCondition: z.enum(["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"]),
  checkInNotes: z.string().trim().min(3, "Check-in notes are required").max(500),
});
