const { z } = require("zod");

const idSchema = z.coerce.number().int().positive();

const createAuditSchema = z
  .object({
    title: z.string().trim().min(3, "Title is required").max(160),
    scopeDeptId: idSchema.optional().nullable(),
    scopeLocation: z.string().trim().max(120).optional().nullable(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    auditorIds: z.array(idSchema).min(1, "Assign at least one auditor"),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  })
  .refine((data) => Boolean(data.scopeDeptId) || Boolean(data.scopeLocation), {
    message: "Select a department or location scope",
    path: ["scopeDeptId"],
  });

const updateAuditItemSchema = z.object({
  result: z.enum(["PENDING", "VERIFIED", "MISSING", "DAMAGED"]),
  notes: z.string().trim().max(500).optional().nullable(),
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
  validateCreateAudit: buildValidator(createAuditSchema),
  validateUpdateAuditItem: buildValidator(updateAuditItemSchema),
};
