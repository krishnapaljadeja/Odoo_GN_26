const express = require("express"),
  router = express.Router(),
  mw = require("../../middleware"),
  orgController = require("../../controllers/orgController"),
  {
    validateCreateDepartment,
    validateUpdateDepartment,
    validateUpdateStatus,
    validateCreateCategory,
    validateUpdateCategory,
    validateUpdateEmployeeRole,
    validateUpdateEmployee,
  } = require("../../validators/orgValidator");

const requireAdmin = mw.auth.requireRole("ADMIN");

router.use(mw.auth.authenticate);

// Departments and categories are readable by anyone signed in - every other
// module (Assets, Allocations, Bookings...) needs them for pickers/filters.
// Only Admin can create/edit them (plan section 3: Organization Setup is
// Admin-only).
router.get("/departments", orgController.listDepartments);
router.post("/departments", [requireAdmin, validateCreateDepartment], orgController.createDepartment);
router.patch("/departments/:id", [requireAdmin, validateUpdateDepartment], orgController.updateDepartment);
router.patch("/departments/:id/status", [requireAdmin, validateUpdateStatus], orgController.updateDepartmentStatus);

router.get("/categories", orgController.listCategories);
router.post("/categories", [requireAdmin, validateCreateCategory], orgController.createCategory);
router.patch("/categories/:id", [requireAdmin, validateUpdateCategory], orgController.updateCategory);

router.get("/employees", orgController.listEmployees);
router.patch("/employees/:id/role", [requireAdmin, validateUpdateEmployeeRole], orgController.updateEmployeeRole);
router.patch("/employees/:id", [requireAdmin, validateUpdateEmployee], orgController.updateEmployee);

module.exports = router;
