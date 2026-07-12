const { z } = require("zod");

const idSchema = z.coerce.number().int().positive();

const createTransferSchema = z.object({
  assetId: idSchema,
  toUserId: idSchema,
  reason: z.string().trim().min(10, "Reason must be at least 10 characters").max(1000),
});

const rejectTransferSchema = z.object({
  note: z.string().trim().max(500).optional(),
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
  validateCreateTransfer: buildValidator(createTransferSchema),
  validateRejectTransfer: buildValidator(rejectTransferSchema),
};
