const maintenanceService = require("../services/maintenanceService");

const handleError = (res, error) => {
  if (error instanceof maintenanceService.ApiError) {
    return res.status(error.status).json({
      error: { code: error.code, message: error.message, ...(error.extra || {}) },
    });
  }

  console.error(error);
  return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Internal Server Error" } });
};

const list = async (req, res) => {
  try {
    return res.status(200).json({ message: "Success", payload: await maintenanceService.listMaintenance(req.query, req.user) });
  } catch (error) {
    return handleError(res, error);
  }
};

const create = async (req, res) => {
  try {
    return res.status(201).json({ message: "Maintenance request raised", payload: await maintenanceService.createMaintenance(req.user, req.body) });
  } catch (error) {
    return handleError(res, error);
  }
};

const approve = async (req, res) => {
  try {
    return res.status(200).json({ message: "Maintenance request approved", payload: await maintenanceService.approveMaintenance(req.user, Number(req.params.id)) });
  } catch (error) {
    return handleError(res, error);
  }
};

const reject = async (req, res) => {
  try {
    return res
      .status(200)
      .json({ message: "Maintenance request rejected", payload: await maintenanceService.rejectMaintenance(req.user, Number(req.params.id), req.body) });
  } catch (error) {
    return handleError(res, error);
  }
};

const assign = async (req, res) => {
  try {
    return res
      .status(200)
      .json({ message: "Technician assigned", payload: await maintenanceService.assignMaintenance(req.user, Number(req.params.id), req.body) });
  } catch (error) {
    return handleError(res, error);
  }
};

const start = async (req, res) => {
  try {
    return res.status(200).json({ message: "Maintenance started", payload: await maintenanceService.startMaintenance(req.user, Number(req.params.id)) });
  } catch (error) {
    return handleError(res, error);
  }
};

const resolve = async (req, res) => {
  try {
    return res
      .status(200)
      .json({ message: "Maintenance resolved", payload: await maintenanceService.resolveMaintenance(req.user, Number(req.params.id), req.body) });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = { list, create, approve, reject, assign, start, resolve };
