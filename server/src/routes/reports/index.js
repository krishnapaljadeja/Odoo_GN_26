const express = require("express"),
  router = express.Router(),
  mw = require("../../middleware"),
  reportController = require("../../controllers/reportController");

router.use(mw.auth.authenticate);

router.get("/kpis", reportController.kpis);
router.get("/utilization", reportController.utilization);
router.get("/maintenance-frequency", reportController.maintenanceFrequency);
router.get("/most-used", reportController.mostUsed);
router.get("/idle", reportController.idle);
router.get("/due-soon", reportController.dueSoon);
router.get("/booking-heatmap", reportController.bookingHeatmap);
router.get("/allocation-summary", reportController.allocationSummary);
router.get("/export", reportController.exportReport);

module.exports = router;
