const express = require("express"),
  router = express.Router(),
  mw = require("../../middleware"),
  assetController = require("../../controllers/assetController"),
  { validateCreateAsset, validateUpdateAsset, validateChangeStatus } = require("../../validators/assetValidator");

const requireManager = mw.auth.requireRole("ADMIN", "ASSET_MANAGER");

router.use(mw.auth.authenticate);

router.get("/", assetController.list);
router.get("/:id", assetController.getById);
router.get("/:id/qr", assetController.getQrCode);
router.post("/", [requireManager, validateCreateAsset], assetController.create);
router.patch("/:id", [requireManager, validateUpdateAsset], assetController.update);
router.patch("/:id/status", [requireManager, validateChangeStatus], assetController.changeStatus);

module.exports = router;
