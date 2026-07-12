const express = require("express"),
  router = express.Router(),
  mw = require("../../middleware"),
  maintenanceController = require("../../controllers/maintenanceController"),
  {
    validateCreateMaintenance,
    validateRejectMaintenance,
    validateAssignMaintenance,
    validateResolveMaintenance,
  } = require("../../validators/maintenanceValidator");

router.use(mw.auth.authenticate);

router.get("/", maintenanceController.list);
router.post("/", validateCreateMaintenance, maintenanceController.create);
router.patch("/:id/approve", maintenanceController.approve);
router.patch("/:id/reject", validateRejectMaintenance, maintenanceController.reject);
router.patch("/:id/assign", validateAssignMaintenance, maintenanceController.assign);
router.patch("/:id/start", maintenanceController.start);
router.patch("/:id/resolve", validateResolveMaintenance, maintenanceController.resolve);

module.exports = router;
