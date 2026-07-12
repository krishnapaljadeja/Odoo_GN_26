const express = require("express"),
  router = express.Router(),
  mw = require("../../middleware"),
  transferController = require("../../controllers/transferController"),
  { validateCreateTransfer, validateRejectTransfer } = require("../../validators/transferValidator");

const requireDecisionMaker = mw.auth.requireRole("ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD");

router.use(mw.auth.authenticate);

router.get("/", transferController.list);
router.post("/", [validateCreateTransfer], transferController.create);
router.patch("/:id/approve", [requireDecisionMaker], transferController.approve);
router.patch("/:id/reject", [requireDecisionMaker, validateRejectTransfer], transferController.reject);

module.exports = router;
