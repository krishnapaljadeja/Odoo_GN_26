const { prisma } = require("../db");
const { parseListQuery, toListResponse } = require("../lib/listQuery");

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// ---- Departments ---------------------------------------------------------

const departmentInclude = {
  head: { select: { id: true, name: true, email: true } },
  parent: { select: { id: true, name: true } },
};

const wouldCreateCycle = async (departmentId, proposedParentId) => {
  if (!proposedParentId) return false;
  if (proposedParentId === departmentId) return true;

  let currentId = proposedParentId;
  const seen = new Set();

  while (currentId) {
    if (currentId === departmentId) return true;
    if (seen.has(currentId)) break; // already-corrupt chain, don't loop forever
    seen.add(currentId);

    const current = await prisma.department.findUnique({ where: { id: currentId }, select: { parentId: true } });
    currentId = current?.parentId || null;
  }

  return false;
};

const listDepartments = async (query) => {
  const { skip, take, page, limit, search, sortBy, sortOrder } = parseListQuery(query, {
    defaultSortBy: "name",
    allowedSortBy: ["name", "status", "createdAt"],
  });

  const where = search ? { name: { contains: search, mode: "insensitive" } } : {};

  const [data, total] = await Promise.all([
    prisma.department.findMany({ where, include: departmentInclude, orderBy: { [sortBy]: sortOrder }, skip, take }),
    prisma.department.count({ where }),
  ]);

  return toListResponse(data, total, { page, limit });
};

const logActivity = (tx, { actorId, action, entity, entityId, details }) =>
  tx.activityLog.create({ data: { actorId, action, entity, entityId, details } });

const createDepartment = async (actorId, { name, headId, parentId, status }) => {
  const existing = await prisma.department.findUnique({ where: { name } });
  if (existing) throw new ApiError(409, "ALREADY_EXISTS", "A department with that name already exists");

  if (headId) {
    const head = await prisma.user.findUnique({ where: { id: headId } });
    if (!head) throw new ApiError(400, "INVALID_HEAD", "Selected head does not exist");
  }

  if (parentId) {
    const parent = await prisma.department.findUnique({ where: { id: parentId } });
    if (!parent) throw new ApiError(400, "INVALID_PARENT", "Selected parent department does not exist");
  }

  return prisma.$transaction(async (tx) => {
    const department = await tx.department.create({
      data: { name, headId: headId || null, parentId: parentId || null, status: status || "ACTIVE" },
      include: departmentInclude,
    });

    await logActivity(tx, { actorId, action: "DEPARTMENT_CREATED", entity: "Department", entityId: department.id, details: { name } });

    return department;
  });
};

const updateDepartment = async (actorId, id, { name, headId, parentId, status }) => {
  const department = await prisma.department.findUnique({ where: { id } });
  if (!department) throw new ApiError(404, "NOT_FOUND", "Department not found");

  if (name && name !== department.name) {
    const existing = await prisma.department.findUnique({ where: { name } });
    if (existing) throw new ApiError(409, "ALREADY_EXISTS", "A department with that name already exists");
  }

  if (headId) {
    const head = await prisma.user.findUnique({ where: { id: headId } });
    if (!head) throw new ApiError(400, "INVALID_HEAD", "Selected head does not exist");
  }

  if (parentId !== undefined && parentId !== null) {
    const parent = await prisma.department.findUnique({ where: { id: parentId } });
    if (!parent) throw new ApiError(400, "INVALID_PARENT", "Selected parent department does not exist");

    if (await wouldCreateCycle(id, parentId)) {
      throw new ApiError(409, "CYCLE_DETECTED", "That parent department would create a cycle");
    }
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.department.update({
      where: { id },
      data: { name, headId, parentId, status },
      include: departmentInclude,
    });

    await logActivity(tx, { actorId, action: "DEPARTMENT_UPDATED", entity: "Department", entityId: id, details: { name, headId, parentId, status } });

    return updated;
  });
};

const updateDepartmentStatus = async (actorId, id, status) => {
  const department = await prisma.department.findUnique({ where: { id } });
  if (!department) throw new ApiError(404, "NOT_FOUND", "Department not found");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.department.update({ where: { id }, data: { status }, include: departmentInclude });
    await logActivity(tx, { actorId, action: "DEPARTMENT_STATUS_CHANGED", entity: "Department", entityId: id, details: { status } });
    return updated;
  });
};

// ---- Categories -----------------------------------------------------------

const categorySelect = {
  id: true,
  name: true,
  description: true,
  customFields: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { assets: true } },
};

const listCategories = async (query) => {
  const { skip, take, page, limit, search, sortBy, sortOrder } = parseListQuery(query, {
    defaultSortBy: "name",
    allowedSortBy: ["name", "createdAt"],
  });

  const where = search ? { name: { contains: search, mode: "insensitive" } } : {};

  const [rows, total] = await Promise.all([
    prisma.assetCategory.findMany({ where, select: categorySelect, orderBy: { [sortBy]: sortOrder }, skip, take }),
    prisma.assetCategory.count({ where }),
  ]);

  const data = rows.map(({ _count, ...rest }) => ({ ...rest, assetCount: _count.assets }));

  return toListResponse(data, total, { page, limit });
};

const createCategory = async (actorId, { name, description, customFields }) => {
  const existing = await prisma.assetCategory.findUnique({ where: { name } });
  if (existing) throw new ApiError(409, "ALREADY_EXISTS", "A category with that name already exists");

  return prisma.$transaction(async (tx) => {
    const category = await tx.assetCategory.create({ data: { name, description, customFields } });
    await logActivity(tx, { actorId, action: "CATEGORY_CREATED", entity: "AssetCategory", entityId: category.id, details: { name } });
    return category;
  });
};

const updateCategory = async (actorId, id, { name, description, customFields }) => {
  const category = await prisma.assetCategory.findUnique({ where: { id } });
  if (!category) throw new ApiError(404, "NOT_FOUND", "Category not found");

  if (name && name !== category.name) {
    const existing = await prisma.assetCategory.findUnique({ where: { name } });
    if (existing) throw new ApiError(409, "ALREADY_EXISTS", "A category with that name already exists");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.assetCategory.update({ where: { id }, data: { name, description, customFields } });
    await logActivity(tx, { actorId, action: "CATEGORY_UPDATED", entity: "AssetCategory", entityId: id, details: { name, description } });
    return updated;
  });
};

// ---- Employees --------------------------------------------------------

const employeeSelect = {
  id: true,
  email: true,
  username: true,
  name: true,
  role: true,
  status: true,
  departmentId: true,
  department: { select: { id: true, name: true } },
  createdAt: true,
};

const listEmployees = async (query) => {
  const { skip, take, page, limit, search, sortBy, sortOrder } = parseListQuery(query, {
    defaultSortBy: "name",
    allowedSortBy: ["name", "email", "role", "status", "createdAt"],
  });

  const where = {
    AND: [
      search
        ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }] }
        : {},
      query.department ? { departmentId: Number(query.department) } : {},
      query.role ? { role: query.role } : {},
      query.status ? { status: query.status } : {},
    ],
  };

  const [data, total] = await Promise.all([
    prisma.user.findMany({ where, select: employeeSelect, orderBy: { [sortBy]: sortOrder }, skip, take }),
    prisma.user.count({ where }),
  ]);

  return toListResponse(data, total, { page, limit });
};

const updateEmployeeRole = async (actorId, id, role) => {
  const employee = await prisma.user.findUnique({ where: { id } });
  if (!employee) throw new ApiError(404, "NOT_FOUND", "Employee not found");

  if (employee.role === "ADMIN" && role !== "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      throw new ApiError(409, "LAST_ADMIN", "Cannot demote the only remaining Admin");
    }
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({ where: { id }, data: { role }, select: employeeSelect });

    await logActivity(tx, {
      actorId,
      action: "ROLE_CHANGED",
      entity: "User",
      entityId: id,
      details: { from: employee.role, to: role },
    });

    await tx.notification.create({
      data: {
        userId: id,
        type: "ROLE_CHANGED",
        title: `Your role was changed to ${role.replace("_", " ")}`,
        body: "An administrator updated your role in Organization Setup.",
      },
    });

    return updated;
  });
};

const updateEmployee = async (actorId, id, { departmentId, status }) => {
  const employee = await prisma.user.findUnique({ where: { id } });
  if (!employee) throw new ApiError(404, "NOT_FOUND", "Employee not found");

  if (departmentId) {
    const department = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!department) throw new ApiError(400, "INVALID_DEPARTMENT", "Selected department does not exist");
  }

  if (employee.role === "ADMIN" && status === "INACTIVE") {
    const activeAdminCount = await prisma.user.count({ where: { role: "ADMIN", status: "ACTIVE" } });
    if (activeAdminCount <= 1) {
      throw new ApiError(409, "LAST_ADMIN", "Cannot deactivate the only remaining active Admin");
    }
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({ where: { id }, data: { departmentId, status }, select: employeeSelect });

    await logActivity(tx, {
      actorId,
      action: "EMPLOYEE_UPDATED",
      entity: "User",
      entityId: id,
      details: { departmentId, status },
    });

    if (departmentId && departmentId !== employee.departmentId) {
      await tx.notification.create({
        data: {
          userId: id,
          type: "DEPARTMENT_REASSIGNED",
          title: "You were reassigned to a new department",
          body: "An administrator moved you to a different department.",
        },
      });
    }

    return updated;
  });
};

module.exports = {
  ApiError,
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
