const express = require("express"),
  router = express.Router(),
  mw = require("../../middleware"),
  allocationController = require("../../controllers/allocationController"),
  { validateCreateAllocation, validateReturnAllocation } = require("../../validators/allocationValidator");

const requireManager = mw.auth.requireRole("ADMIN", "ASSET_MANAGER");

router.use(mw.auth.authenticate);

router.get("/", allocationController.list);
router.post("/", [requireManager, validateCreateAllocation], allocationController.allocate);
router.post("/:id/return-request", allocationController.requestReturn);
router.post("/:id/return", [requireManager, validateReturnAllocation], allocationController.returnAllocation);

module.exports = router;
