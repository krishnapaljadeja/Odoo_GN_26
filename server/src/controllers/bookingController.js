const bookingService = require("../services/bookingService");

const handleError = (res, error) => {
  if (error instanceof bookingService.ApiError) {
    return res.status(error.status).json({
      error: { code: error.code, message: error.message, ...(error.extra || {}) },
    });
  }

  console.error(error);
  return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Internal Server Error" } });
};

const resources = async (req, res) => {
  try {
    return res.status(200).json({ message: "Success", payload: await bookingService.listResources(req.query) });
  } catch (error) {
    return handleError(res, error);
  }
};

const list = async (req, res) => {
  try {
    return res.status(200).json({ message: "Success", payload: await bookingService.listBookings(req.query, req.user) });
  } catch (error) {
    return handleError(res, error);
  }
};

const create = async (req, res) => {
  try {
    return res.status(201).json({ message: "Booking confirmed", payload: await bookingService.createBooking(req.user, req.body) });
  } catch (error) {
    return handleError(res, error);
  }
};

const cancel = async (req, res) => {
  try {
    return res.status(200).json({ message: "Booking cancelled", payload: await bookingService.cancelBooking(req.user, Number(req.params.id)) });
  } catch (error) {
    return handleError(res, error);
  }
};

const reschedule = async (req, res) => {
  try {
    return res
      .status(200)
      .json({ message: "Booking rescheduled", payload: await bookingService.rescheduleBooking(req.user, Number(req.params.id), req.body) });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = { resources, list, create, cancel, reschedule };
