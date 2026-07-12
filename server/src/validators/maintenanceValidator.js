const { z } = require("zod");

const idSchema = z.coerce.number().int().positive();

const createMaintenanceSchema = z.object({
  assetId: idSchema,
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(1000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  photoUrl: z.string().trim().optional().nullable(),
});

const rejectSchema = z.object({
  rejectionReason: z.string().trim().min(3, "Rejection reason is required").max(500),
});

const assignSchema = z
  .object({
    technicianId: idSchema.optional().nullable(),
    technicianName: z.string().trim().max(120).optional().nullable(),
  })
  .refine((data) => Boolean(data.technicianId) || Boolean(data.technicianName), {
    message: "Select a technician or enter a technician name",
    path: ["technicianId"],
  });

const resolveSchema = z.object({
  resolutionNotes: z.string().trim().max(500).optional().nullable(),
});

const buildValidator = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message }));
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: details[0]?.message || "Invalid input", details },
    });
  }

  req.body = result.data;
  return next();
};

module.exports = {
  validateCreateMaintenance: buildValidator(createMaintenanceSchema),
  validateRejectMaintenance: buildValidator(rejectSchema),
  validateAssignMaintenance: buildValidator(assignSchema),
  validateResolveMaintenance: buildValidator(resolveSchema),
};
