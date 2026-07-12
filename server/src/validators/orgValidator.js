const { z } = require("zod");

const nameSchema = z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be at most 100 characters");
const idSchema = z.coerce.number().int().positive();
const statusSchema = z.enum(["ACTIVE", "INACTIVE"]);
const roleSchema = z.enum(["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"]);

const createDepartmentSchema = z.object({
  name: nameSchema,
  headId: idSchema.nullable().optional(),
  parentId: idSchema.nullable().optional(),
  status: statusSchema.optional(),
});

const updateDepartmentSchema = z.object({
  name: nameSchema.optional(),
  headId: idSchema.nullable().optional(),
  parentId: idSchema.nullable().optional(),
  status: statusSchema.optional(),
});

const updateStatusSchema = z.object({
  status: statusSchema,
});

const createCategorySchema = z.object({
  name: nameSchema,
  description: z.string().trim().max(500).optional().nullable(),
  customFields: z.record(z.string(), z.any()).optional().nullable(),
});

const updateCategorySchema = z.object({
  name: nameSchema.optional(),
  description: z.string().trim().max(500).optional().nullable(),
  customFields: z.record(z.string(), z.any()).optional().nullable(),
});

const updateEmployeeRoleSchema = z.object({
  role: roleSchema,
});

const updateEmployeeSchema = z.object({
  departmentId: idSchema.nullable().optional(),
  status: statusSchema.optional(),
});

const buildValidator = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: details[0]?.message || "Invalid input", details },
    });
  }

  req.body = result.data;
  return next();
};

module.exports = {
  validateCreateDepartment: buildValidator(createDepartmentSchema),
  validateUpdateDepartment: buildValidator(updateDepartmentSchema),
  validateUpdateStatus: buildValidator(updateStatusSchema),
  validateCreateCategory: buildValidator(createCategorySchema),
  validateUpdateCategory: buildValidator(updateCategorySchema),
  validateUpdateEmployeeRole: buildValidator(updateEmployeeRoleSchema),
  validateUpdateEmployee: buildValidator(updateEmployeeSchema),
};
