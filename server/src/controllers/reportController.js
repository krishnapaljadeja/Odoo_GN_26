const reportService = require("../services/reportService");

const send = (res, payload) => res.status(200).json({ message: "Success", payload });
const handleError = (res, error) => {
  console.error(error);
  return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Internal Server Error" } });
};

const kpis = async (req, res) => {
  try { return send(res, await reportService.getKpis(req.user)); } catch (error) { return handleError(res, error); }
};
const utilization = async (req, res) => {
  try { return send(res, await reportService.getUtilization(req.user, req.query.groupBy)); } catch (error) { return handleError(res, error); }
};
const maintenanceFrequency = async (req, res) => {
  try { return send(res, await reportService.getMaintenanceFrequency(req.user)); } catch (error) { return handleError(res, error); }
};
const mostUsed = async (req, res) => {
  try { return send(res, await reportService.getMostUsed(req.user)); } catch (error) { return handleError(res, error); }
};
const idle = async (req, res) => {
  try { return send(res, await reportService.getIdleAssets(req.user, req.query.days || 45)); } catch (error) { return handleError(res, error); }
};
const dueSoon = async (req, res) => {
  try { return send(res, await reportService.getDueSoon(req.user)); } catch (error) { return handleError(res, error); }
};
const bookingHeatmap = async (req, res) => {
  try { return send(res, await reportService.getBookingHeatmap(req.user)); } catch (error) { return handleError(res, error); }
};
const allocationSummary = async (req, res) => {
  try { return send(res, await reportService.getAllocationSummary(req.user)); } catch (error) { return handleError(res, error); }
};
const exportReport = async (req, res) => {
  try {
    const type = req.query.type || "utilization";
    const payload = type === "idle" ? await reportService.getIdleAssets(req.user) : await reportService.getUtilization(req.user, req.query.groupBy);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${type}.csv"`);
    return res.status(200).send(reportService.toCsv(payload));
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = { kpis, utilization, maintenanceFrequency, mostUsed, idle, dueSoon, bookingHeatmap, allocationSummary, exportReport };
