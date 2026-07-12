const orgService = require("../services/orgService");

const handleError = (res, error) => {
  if (error instanceof orgService.ApiError) {
    return res.status(error.status).json({ error: { code: error.code, message: error.message } });
  }

  console.error(error);
  return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Internal Server Error" } });
};

const listDepartments = async (req, res) => {
  try {
    return res.status(200).json({ message: "Success", payload: await orgService.listDepartments(req.query) });
  } catch (error) {
    return handleError(res, error);
  }
};

const createDepartment = async (req, res) => {
  try {
    const department = await orgService.createDepartment(req.user.id, req.body);
    return res.status(201).json({ message: "Department created", payload: department });
  } catch (error) {
    return handleError(res, error);
  }
};

const updateDepartment = async (req, res) => {
  try {
    const department = await orgService.updateDepartment(req.user.id, Number(req.params.id), req.body);
    return res.status(200).json({ message: "Department updated", payload: department });
  } catch (error) {
    return handleError(res, error);
  }
};

const updateDepartmentStatus = async (req, res) => {
  try {
    const department = await orgService.updateDepartmentStatus(req.user.id, Number(req.params.id), req.body.status);
    return res.status(200).json({ message: "Department status updated", payload: department });
  } catch (error) {
    return handleError(res, error);
  }
};

const listCategories = async (req, res) => {
  try {
    return res.status(200).json({ message: "Success", payload: await orgService.listCategories(req.query) });
  } catch (error) {
    return handleError(res, error);
  }
};

const createCategory = async (req, res) => {
  try {
    const category = await orgService.createCategory(req.user.id, req.body);
    return res.status(201).json({ message: "Category created", payload: category });
  } catch (error) {
    return handleError(res, error);
  }
};

const updateCategory = async (req, res) => {
  try {
    const category = await orgService.updateCategory(req.user.id, Number(req.params.id), req.body);
    return res.status(200).json({ message: "Category updated", payload: category });
  } catch (error) {
    return handleError(res, error);
  }
};

const listEmployees = async (req, res) => {
  try {
    return res.status(200).json({ message: "Success", payload: await orgService.listEmployees(req.query) });
  } catch (error) {
    return handleError(res, error);
  }
};

const updateEmployeeRole = async (req, res) => {
  try {
    const employee = await orgService.updateEmployeeRole(req.user.id, Number(req.params.id), req.body.role);
    return res.status(200).json({ message: "Role updated", payload: employee });
  } catch (error) {
    return handleError(res, error);
  }
};

const updateEmployee = async (req, res) => {
  try {
    const employee = await orgService.updateEmployee(req.user.id, Number(req.params.id), req.body);
    return res.status(200).json({ message: "Employee updated", payload: employee });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  listDepartments,
  createDepartment,
  updateDepartment,
  updateDepartmentStatus,
  listCategories,
  createCategory,
  updateCategory,
  listEmployees,
  updateEmployeeRole,
  updateEmployee,
};
