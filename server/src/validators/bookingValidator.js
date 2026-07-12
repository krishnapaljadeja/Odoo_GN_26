const { z } = require("zod");

const idSchema = z.coerce.number().int().positive();
const isoDateSchema = z.coerce.date();

const ensureQuarterHour = (date) => date.getSeconds() === 0 && date.getMilliseconds() === 0 && date.getMinutes() % 15 === 0;

const baseWindowShape = {
  startTime: isoDateSchema,
  endTime: isoDateSchema,
  purpose: z.string().trim().max(200).optional().nullable(),
};

const withWindowRules = (schema) =>
  schema
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  })
  .refine((data) => data.startTime >= new Date(), {
    message: "Booking start time cannot be in the past",
    path: ["startTime"],
  })
  .refine((data) => data.startTime.toDateString() === data.endTime.toDateString(), {
    message: "Bookings must start and end on the same day",
    path: ["endTime"],
  })
  .refine((data) => ensureQuarterHour(data.startTime) && ensureQuarterHour(data.endTime), {
    message: "Booking times must use 15-minute steps",
    path: ["startTime"],
  });

const bookingWindowSchema = withWindowRules(z.object({ assetId: idSchema, ...baseWindowShape }));
const rescheduleSchema = withWindowRules(z.object(baseWindowShape));

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
  validateCreateBooking: buildValidator(bookingWindowSchema),
  validateRescheduleBooking: buildValidator(rescheduleSchema),
};
