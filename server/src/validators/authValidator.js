const { z } = require("zod");

const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address");
const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be at most 30 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores");
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-zA-Z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one number");
const nameSchema = z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be at most 100 characters");

const signupSchema = z
  .object({
    email: emailSchema,
    username: usernameSchema,
    name: nameSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    // Explicitly rejected below even if present - signup can only ever create an EMPLOYEE.
    role: z.any().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

const resetPasswordSchema = z
  .object({
    email: emailSchema,
    otp: z.string().trim().length(6, "Enter the 6-digit code"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const verifySignupSchema = z.object({
  email: emailSchema,
  otp: z.string().trim().length(6, "Enter the 6-digit code"),
});

const buildValidator = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: details[0]?.message || "Invalid input",
        details,
      },
    });
  }

  if ("role" in result.data) {
    delete result.data.role;
  }

  req.body = result.data;
  return next();
};

module.exports = {
  validateSignup: buildValidator(signupSchema),
  validateVerifySignup: buildValidator(verifySignupSchema),
  validateLogin: buildValidator(loginSchema),
  validateForgotPassword: buildValidator(forgotPasswordSchema),
  validateResetPassword: buildValidator(resetPasswordSchema),
};
