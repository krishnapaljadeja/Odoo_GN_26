const express = require("express"),
  router = express.Router(),
  mw = require("../../middleware"),
  auditController = require("../../controllers/auditController"),
  { validateCreateAudit, validateUpdateAuditItem } = require("../../validators/auditValidator");

router.use(mw.auth.authenticate);

router.get("/", auditController.list);
router.post("/", validateCreateAudit, auditController.create);
router.get("/:id", auditController.getById);
router.get("/:id/discrepancies", auditController.discrepancies);
router.patch("/:id/items/:itemId", validateUpdateAuditItem, auditController.updateItem);
router.patch("/:id/close", auditController.close);

module.exports = router;
