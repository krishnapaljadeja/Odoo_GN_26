const express = require("express"),
  router = express.Router(),
  mw = require("../../middleware"),
  notificationController = require("../../controllers/notificationController");

router.use(mw.auth.authenticate);

router.get("/", notificationController.list);
router.get("/unread-count", notificationController.unreadCount);
router.patch("/read-all", notificationController.markAllRead);
router.patch("/:id/read", notificationController.markRead);

module.exports = router;
