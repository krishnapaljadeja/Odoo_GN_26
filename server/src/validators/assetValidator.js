const { z } = require("zod");

const nameSchema = z.string().trim().min(2, "Name must be at least 2 characters").max(100);
const idSchema = z.coerce.number().int().positive();
const conditionSchema = z.enum(["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"]);
const serialNumberSchema = z
  .string()
  .trim()
  .min(3, "Serial number must be at least 3 characters")
  .max(64)
  .regex(/^[a-zA-Z0-9-]+$/, "Serial number can only contain letters, numbers and dashes");

const acquisitionDateSchema = z.coerce.date().refine((date) => date <= new Date(), {
  message: "Acquisition date cannot be in the future",
});

const acquisitionCostSchema = z
  .number()
  .positive("Acquisition cost must be positive")
  .max(1_000_000_000, "Acquisition cost is too large")
  .refine((value) => Math.round(value * 100) === value * 100, {
    message: "Acquisition cost can have at most 2 decimal places",
  });

const createAssetSchema = z.object({
  name: nameSchema,
  categoryId: idSchema,
  serialNumber: serialNumberSchema.optional().nullable(),
  acquisitionDate: acquisitionDateSchema.optional().nullable(),
  acquisitionCost: acquisitionCostSchema.optional().nullable(),
  condition: conditionSchema.optional(),
  location: z.string().trim().max(200).optional().nullable(),
  departmentId: idSchema.optional().nullable(),
  isBookable: z.boolean().optional(),
  photoUrl: z.string().trim().max(500).optional().nullable(),
  documents: z.array(z.string().trim().max(500)).optional().nullable(),
});

const updateAssetSchema = createAssetSchema.partial();

const changeStatusSchema = z.object({
  status: z.enum(["AVAILABLE", "LOST", "RETIRED", "DISPOSED"]),
  reason: z.string().trim().min(10, "Reason must be at least 10 characters").max(500),
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
  validateCreateAsset: buildValidator(createAssetSchema),
  validateUpdateAsset: buildValidator(updateAssetSchema),
  validateChangeStatus: buildValidator(changeStatusSchema),
};
