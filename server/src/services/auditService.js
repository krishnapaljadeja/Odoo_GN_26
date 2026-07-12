const { prisma } = require("../db");
const { parseListQuery, toListResponse } = require("../lib/listQuery");

class ApiError extends Error {
  constructor(status, code, message, extra) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

const MANAGER_ROLES = ["ADMIN", "ASSET_MANAGER"];

const cycleInclude = {
  assignments: { include: { auditor: { select: { id: true, name: true, email: true, department: { select: { name: true } } } } } },
  items: {
    include: {
      asset: {
        select: {
          id: true,
          assetTag: true,
          name: true,
          status: true,
          condition: true,
          location: true,
          departmentId: true,
          department: { select: { name: true } },
          category: { select: { name: true } },
        },
      },
    },
    orderBy: { id: "asc" },
  },
};

const itemInclude = {
  asset: {
    select: {
      id: true,
      assetTag: true,
      name: true,
      status: true,
      condition: true,
      location: true,
      departmentId: true,
      department: { select: { name: true } },
      category: { select: { name: true } },
    },
  },
  cycle: { select: { id: true, title: true, status: true } },
};

const logActivity = (tx, { actorId, action, entity, entityId, details }) =>
  tx.activityLog.create({ data: { actorId, action, entity, entityId, details } });

const requireManager = (actor) => {
  if (!MANAGER_ROLES.includes(actor.role)) {
    throw new ApiError(403, "FORBIDDEN", "Only Admins and Asset Managers can manage audit cycles");
  }
};

const isAssignedAuditor = async (cycleId, userId, tx = prisma) =>
  Boolean(await tx.auditAssignment.findUnique({ where: { cycleId_auditorId: { cycleId, auditorId: userId } } }));

const notifyManagers = async (tx, { title, body, meta }) => {
  const managers = await tx.user.findMany({
    where: { role: { in: MANAGER_ROLES }, status: "ACTIVE" },
    select: { id: true },
  });
  if (managers.length === 0) return;
  await tx.notification.createMany({
    data: managers.map((user) => ({ userId: user.id, type: "AUDIT_DISCREPANCY", title, body, meta })),
  });
};

const listAudits = async (query, actor) => {
  const { skip, take, page, limit, search, sortBy, sortOrder } = parseListQuery(query, {
    defaultSortBy: "createdAt",
    allowedSortBy: ["createdAt", "startDate", "endDate", "status", "title"],
  });

  const conditions = [];
  if (search) conditions.push({ title: { contains: search, mode: "insensitive" } });
  if (query.status) conditions.push({ status: String(query.status).toUpperCase() });
  if (query.scopeDeptId) conditions.push({ scopeDeptId: Number(query.scopeDeptId) });

  if (!MANAGER_ROLES.includes(actor.role)) {
    conditions.push({ assignments: { some: { auditorId: actor.id } } });
  }

  const where = conditions.length > 0 ? { AND: conditions } : {};
  const [rows, total] = await Promise.all([
    prisma.auditCycle.findMany({
      where,
      include: {
        assignments: { include: { auditor: { select: { id: true, name: true, email: true } } } },
        _count: { select: { items: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take,
    }),
    prisma.auditCycle.count({ where }),
  ]);

  const data = rows.map(({ _count, ...cycle }) => ({ ...cycle, itemCount: _count.items }));
  return toListResponse(data, total, { page, limit });
};

const getAudit = async (id, actor) => {
  const cycle = await prisma.auditCycle.findUnique({ where: { id }, include: cycleInclude });
  if (!cycle) throw new ApiError(404, "NOT_FOUND", "Audit cycle not found");

  if (!MANAGER_ROLES.includes(actor.role) && !(await isAssignedAuditor(id, actor.id))) {
    throw new ApiError(403, "FORBIDDEN", "Only assigned auditors can view this audit cycle");
  }

  return cycle;
};

const createAudit = async (actor, { title, scopeDeptId, scopeLocation, startDate, endDate, auditorIds }) => {
  requireManager(actor);

  if (scopeDeptId) {
    const department = await prisma.department.findUnique({ where: { id: scopeDeptId } });
    if (!department) throw new ApiError(400, "INVALID_DEPARTMENT", "Selected department does not exist");
  }

  const auditors = await prisma.user.findMany({ where: { id: { in: [...new Set(auditorIds)] }, status: "ACTIVE" } });
  if (auditors.length !== new Set(auditorIds).size) throw new ApiError(400, "INVALID_AUDITOR", "One or more auditors do not exist");

  const assetWhere = {};
  if (scopeDeptId) assetWhere.departmentId = scopeDeptId;
  if (scopeLocation) assetWhere.location = { contains: scopeLocation, mode: "insensitive" };

  const assets = await prisma.asset.findMany({ where: assetWhere, select: { id: true, location: true } });
  if (assets.length === 0) throw new ApiError(400, "EMPTY_SCOPE", "No assets match that audit scope");

  return prisma.$transaction(async (tx) => {
    const cycle = await tx.auditCycle.create({
      data: { title, scopeDeptId: scopeDeptId || null, scopeLocation: scopeLocation || null, startDate, endDate, status: "OPEN" },
    });

    await tx.auditAssignment.createMany({
      data: [...new Set(auditorIds)].map((auditorId) => ({ cycleId: cycle.id, auditorId })),
      skipDuplicates: true,
    });

    await tx.auditItem.createMany({
      data: assets.map((asset) => ({ cycleId: cycle.id, assetId: asset.id, expectedLocation: asset.location })),
      skipDuplicates: true,
    });

    await logActivity(tx, {
      actorId: actor.id,
      action: "AUDIT_CREATED",
      entity: "AuditCycle",
      entityId: cycle.id,
      details: { title, assetCount: assets.length, auditorIds },
    });

    return tx.auditCycle.findUnique({ where: { id: cycle.id }, include: cycleInclude });
  });
};

const updateAuditItem = async (actor, cycleId, itemId, { result, notes }) => {
  const cycle = await prisma.auditCycle.findUnique({ where: { id: cycleId } });
  if (!cycle) throw new ApiError(404, "NOT_FOUND", "Audit cycle not found");
  if (cycle.status === "CLOSED") throw new ApiError(409, "AUDIT_CLOSED", "Closed audit cycles cannot be edited");

  if (actor.role !== "ADMIN" && !(await isAssignedAuditor(cycleId, actor.id))) {
    throw new ApiError(403, "FORBIDDEN", "Only assigned auditors or Admins can mark audit items");
  }

  const item = await prisma.auditItem.findFirst({ where: { id: itemId, cycleId }, include: itemInclude });
  if (!item) throw new ApiError(404, "NOT_FOUND", "Audit item not found");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.auditItem.update({
      where: { id: itemId },
      data: {
        result,
        notes: notes || null,
        verifiedById: result === "PENDING" ? null : actor.id,
        verifiedAt: result === "PENDING" ? null : new Date(),
      },
      include: itemInclude,
    });

    await logActivity(tx, {
      actorId: actor.id,
      action: "AUDIT_ITEM_UPDATED",
      entity: "AuditItem",
      entityId: itemId,
      details: { cycleId, assetId: item.assetId, result, notes },
    });

    if (["MISSING", "DAMAGED"].includes(result)) {
      await notifyManagers(tx, {
        title: `Audit discrepancy flagged: ${item.asset.assetTag} ${result.toLowerCase()}`,
        body: `${cycle.title} flagged ${item.asset.name}.`,
        meta: { cycleId, itemId, assetId: item.assetId, result },
      });
    }

    return updated;
  });
};

const getDiscrepancies = async (cycleId, actor) => {
  await getAudit(cycleId, actor);
  return prisma.auditItem.findMany({
    where: { cycleId, result: { in: ["MISSING", "DAMAGED"] } },
    include: itemInclude,
    orderBy: [{ result: "asc" }, { id: "asc" }],
  });
};

const closeAudit = async (actor, cycleId) => {
  requireManager(actor);
  const cycle = await prisma.auditCycle.findUnique({
    where: { id: cycleId },
    include: { items: { include: { asset: { select: { id: true, assetTag: true } } } } },
  });
  if (!cycle) throw new ApiError(404, "NOT_FOUND", "Audit cycle not found");
  if (cycle.status === "CLOSED") throw new ApiError(409, "AUDIT_CLOSED", "Audit cycle is already closed");

  const missingItems = cycle.items.filter((item) => item.result === "MISSING");
  const damagedItems = cycle.items.filter((item) => item.result === "DAMAGED");

  return prisma.$transaction(async (tx) => {
    await Promise.all([
      ...missingItems.map((item) => tx.asset.update({ where: { id: item.assetId }, data: { status: "LOST" } })),
      ...damagedItems.map((item) => tx.asset.update({ where: { id: item.assetId }, data: { condition: "DAMAGED" } })),
    ]);

    const closed = await tx.auditCycle.update({ where: { id: cycleId }, data: { status: "CLOSED", closedAt: new Date() }, include: cycleInclude });

    await logActivity(tx, {
      actorId: actor.id,
      action: "AUDIT_CLOSED",
      entity: "AuditCycle",
      entityId: cycleId,
      details: {
        missingAssetIds: missingItems.map((item) => item.assetId),
        damagedAssetIds: damagedItems.map((item) => item.assetId),
      },
    });

    return closed;
  });
};

module.exports = {
  ApiError,
  listAudits,
  getAudit,
  createAudit,
  updateAuditItem,
  getDiscrepancies,
  closeAudit,
};
