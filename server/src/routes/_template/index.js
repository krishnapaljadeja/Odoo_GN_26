const express = require("express"),
  router = express.Router(),
  templateController = require("../../controllers/templateController"),
  { validateTemplateCreate } = require("../../validators/templateValidator");

router.get("/", templateController.list);
router.post("/", [validateTemplateCreate], templateController.create);

module.exports = router;
