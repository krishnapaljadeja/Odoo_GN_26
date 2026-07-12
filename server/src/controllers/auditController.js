const auditService = require("../services/auditService");

const handleError = (res, error) => {
  if (error instanceof auditService.ApiError) {
    return res.status(error.status).json({
      error: { code: error.code, message: error.message, ...(error.extra || {}) },
    });
  }

  console.error(error);
  return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Internal Server Error" } });
};

const list = async (req, res) => {
  try {
    return res.status(200).json({ message: "Success", payload: await auditService.listAudits(req.query, req.user) });
  } catch (error) {
    return handleError(res, error);
  }
};

const getById = async (req, res) => {
  try {
    return res.status(200).json({ message: "Success", payload: await auditService.getAudit(Number(req.params.id), req.user) });
  } catch (error) {
    return handleError(res, error);
  }
};

const create = async (req, res) => {
  try {
    return res.status(201).json({ message: "Audit cycle created", payload: await auditService.createAudit(req.user, req.body) });
  } catch (error) {
    return handleError(res, error);
  }
};

const updateItem = async (req, res) => {
  try {
    return res.status(200).json({
      message: "Audit item updated",
      payload: await auditService.updateAuditItem(req.user, Number(req.params.id), Number(req.params.itemId), req.body),
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const discrepancies = async (req, res) => {
  try {
    return res.status(200).json({ message: "Success", payload: await auditService.getDiscrepancies(Number(req.params.id), req.user) });
  } catch (error) {
    return handleError(res, error);
  }
};

const close = async (req, res) => {
  try {
    return res.status(200).json({ message: "Audit cycle closed", payload: await auditService.closeAudit(req.user, Number(req.params.id)) });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = { list, getById, create, updateItem, discrepancies, close };
