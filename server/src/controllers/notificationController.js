const notificationService = require("../services/notificationService");

const handleError = (res, error) => {
  console.error(error);
  return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Internal Server Error" } });
};

const list = async (req, res) => {
  try { return res.status(200).json({ message: "Success", payload: await notificationService.listNotifications(req.user, req.query) }); } catch (error) { return handleError(res, error); }
};
const unreadCount = async (req, res) => {
  try { return res.status(200).json({ message: "Success", payload: { count: await notificationService.unreadCount(req.user) } }); } catch (error) { return handleError(res, error); }
};
const markRead = async (req, res) => {
  try { return res.status(200).json({ message: "Notification marked read", payload: await notificationService.markRead(req.user, Number(req.params.id)) }); } catch (error) { return handleError(res, error); }
};
const markAllRead = async (req, res) => {
  try { return res.status(200).json({ message: "Notifications marked read", payload: await notificationService.markAllRead(req.user) }); } catch (error) { return handleError(res, error); }
};

module.exports = { list, unreadCount, markRead, markAllRead };
