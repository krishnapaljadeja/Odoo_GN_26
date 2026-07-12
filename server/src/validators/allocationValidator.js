const { z } = require("zod");

const idSchema = z.coerce.number().int().positive();

const futureDateSchema = z.coerce.date().refine((date) => date > new Date(), {
  message: "Expected return date must be in the future",
});

const createAllocationSchema = z
  .object({
    assetId: idSchema,
    userId: idSchema.optional().nullable(),
    departmentId: idSchema.optional().nullable(),
    expectedReturnDate: futureDateSchema.optional().nullable(),
  })
  .refine((data) => Boolean(data.userId) !== Boolean(data.departmentId), {
    message: "Allocate to exactly one of an employee or a department",
    path: ["userId"],
  });

const returnAllocationSchema = z.object({
  returnCondition: z.enum(["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"]),
  checkInNotes: z.string().trim().min(3, "Check-in notes are required").max(500),
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
  validateCreateAllocation: buildValidator(createAllocationSchema),
  validateReturnAllocation: buildValidator(returnAllocationSchema),
};
