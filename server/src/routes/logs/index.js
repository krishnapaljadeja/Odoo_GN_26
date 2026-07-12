const express = require("express"),
  router = express.Router(),
  mw = require("../../middleware"),
  logController = require("../../controllers/logController");

router.use(mw.auth.authenticate);
router.get("/", logController.list);

module.exports = router;
