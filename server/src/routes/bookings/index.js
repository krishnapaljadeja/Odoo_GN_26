const express = require("express"),
  router = express.Router(),
  mw = require("../../middleware"),
  bookingController = require("../../controllers/bookingController"),
  { validateCreateBooking, validateRescheduleBooking } = require("../../validators/bookingValidator");

router.use(mw.auth.authenticate);

router.get("/resources", bookingController.resources);
router.get("/", bookingController.list);
router.post("/", validateCreateBooking, bookingController.create);
router.patch("/:id/cancel", bookingController.cancel);
router.patch("/:id/reschedule", validateRescheduleBooking, bookingController.reschedule);

module.exports = router;
