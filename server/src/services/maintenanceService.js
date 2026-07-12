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

const include = {
  asset: {
    select: {
      id: true,
      assetTag: true,
      name: true,
      status: true,
      condition: true,
      departmentId: true,
      location: true,
      category: { select: { name: true } },
    },
  },
  requester: { select: { id: true, name: true, email: true, departmentId: true, department: { select: { name: true } } } },
  technician: { select: { id: true, name: true, email: true } },
};

const MANAGER_ROLES = ["ADMIN", "ASSET_MANAGER"];
const TERMINAL_ASSET_STATUSES = ["LOST", "RETIRED", "DISPOSED"];

const logActivity = (tx, { actorId, action, entityId, details }) =>
  tx.activityLog.create({ data: { actorId, action, entity: "MaintenanceRequest", entityId, details } });

const requireManager = (actor) => {
  if (!MANAGER_ROLES.includes(actor.role)) {
    throw new ApiError(403, "FORBIDDEN", "Only Admins and Asset Managers can advance maintenance workflow");
  }
};

const ensureTransition = (request, fromStatuses, message) => {
  if (!fromStatuses.includes(request.status)) {
    throw new ApiError(409, "ILLEGAL_TRANSITION", message);
  }
};

const notifyRequester = (tx, request, { type, title, body }) =>
  tx.notification.create({
    data: {
      userId: request.requesterId,
      type,
      title,
      body,
      meta: { maintenanceId: request.id, assetId: request.assetId },
    },
  });

const listMaintenance = async (query, actor) => {
  const { skip, take, page, limit, search, sortBy, sortOrder } = parseListQuery(query, {
    defaultSortBy: "createdAt",
    allowedSortBy: ["createdAt", "updatedAt", "priority", "status"],
  });

  const conditions = [];
  if (query.status) conditions.push({ status: String(query.status).toUpperCase() });
  if (query.priority) conditions.push({ priority: String(query.priority).toUpperCase() });
  if (query.assetId) conditions.push({ assetId: Number(query.assetId) });
  if (query.requesterId) conditions.push({ requesterId: Number(query.requesterId) });
  if (search) {
    conditions.push({
      OR: [
        { description: { contains: search, mode: "insensitive" } },
        { asset: { assetTag: { contains: search, mode: "insensitive" } } },
        { asset: { name: { contains: search, mode: "insensitive" } } },
      ],
    });
  }

  if (actor.role === "EMPLOYEE") {
    conditions.push({ requesterId: actor.id });
  } else if (actor.role === "DEPARTMENT_HEAD") {
    conditions.push({ asset: { departmentId: actor.departmentId } });
  }

  const where = conditions.length > 0 ? { AND: conditions } : {};
  const [rows, total] = await Promise.all([
    prisma.maintenanceRequest.findMany({ where, include, orderBy: { [sortBy]: sortOrder }, skip, take }),
    prisma.maintenanceRequest.count({ where }),
  ]);

  return toListResponse(rows, total, { page, limit });
};

const createMaintenance = async (actor, { assetId, description, priority, photoUrl }) => {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) throw new ApiError(404, "NOT_FOUND", "Asset not found");
  if (TERMINAL_ASSET_STATUSES.includes(asset.status)) {
    throw new ApiError(409, "ASSET_UNAVAILABLE", "Terminal assets cannot receive maintenance requests");
  }

  return prisma.$transaction(async (tx) => {
    const request = await tx.maintenanceRequest.create({
      data: { assetId, requesterId: actor.id, description, priority, photoUrl: photoUrl || null, status: "PENDING" },
      include,
    });

    await logActivity(tx, {
      actorId: actor.id,
      action: "MAINTENANCE_REQUESTED",
      entityId: request.id,
      details: { assetId, assetTag: asset.assetTag, priority },
    });

    return request;
  });
};

const approveMaintenance = async (actor, id) => {
  requireManager(actor);
  const request = await prisma.maintenanceRequest.findUnique({ where: { id }, include });
  if (!request) throw new ApiError(404, "NOT_FOUND", "Maintenance request not found");
  ensureTransition(request, ["PENDING"], "Only pending requests can be approved");

  return prisma.$transaction(async (tx) => {
    await tx.asset.update({ where: { id: request.assetId }, data: { status: "UNDER_MAINTENANCE" } });
    const updated = await tx.maintenanceRequest.update({ where: { id }, data: { status: "APPROVED" }, include });
    await notifyRequester(tx, request, {
      type: "MAINTENANCE_APPROVED",
      title: `Maintenance request ${request.asset.assetTag} approved`,
      body: `${request.asset.name} moved to Under Maintenance.`,
    });
    await logActivity(tx, {
      actorId: actor.id,
      action: "MAINTENANCE_APPROVED",
      entityId: id,
      details: { assetId: request.assetId, assetTag: request.asset.assetTag },
    });
    return updated;
  });
};

const rejectMaintenance = async (actor, id, { rejectionReason }) => {
  requireManager(actor);
  const request = await prisma.maintenanceRequest.findUnique({ where: { id }, include });
  if (!request) throw new ApiError(404, "NOT_FOUND", "Maintenance request not found");
  ensureTransition(request, ["PENDING"], "Only pending requests can be rejected");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.maintenanceRequest.update({ where: { id }, data: { status: "REJECTED", rejectionReason }, include });
    await notifyRequester(tx, request, {
      type: "MAINTENANCE_REJECTED",
      title: `Maintenance request ${request.asset.assetTag} rejected`,
      body: rejectionReason,
    });
    await logActivity(tx, {
      actorId: actor.id,
      action: "MAINTENANCE_REJECTED",
      entityId: id,
      details: { rejectionReason, assetId: request.assetId },
    });
    return updated;
  });
};

const assignMaintenance = async (actor, id, { technicianId, technicianName }) => {
  requireManager(actor);
  const request = await prisma.maintenanceRequest.findUnique({ where: { id }, include });
  if (!request) throw new ApiError(404, "NOT_FOUND", "Maintenance request not found");
  ensureTransition(request, ["APPROVED"], "Technician assignment requires approval first");

  if (technicianId) {
    const technician = await prisma.user.findUnique({ where: { id: technicianId } });
    if (!technician) throw new ApiError(400, "INVALID_TECHNICIAN", "Selected technician does not exist");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.maintenanceRequest.update({
      where: { id },
      data: { technicianId: technicianId || null, technicianName: technicianId ? null : technicianName, status: "TECHNICIAN_ASSIGNED" },
      include,
    });
    await logActivity(tx, {
      actorId: actor.id,
      action: "MAINTENANCE_TECHNICIAN_ASSIGNED",
      entityId: id,
      details: { technicianId, technicianName, assetId: request.assetId },
    });
    return updated;
  });
};

const startMaintenance = async (actor, id) => {
  requireManager(actor);
  const request = await prisma.maintenanceRequest.findUnique({ where: { id }, include });
  if (!request) throw new ApiError(404, "NOT_FOUND", "Maintenance request not found");
  ensureTransition(request, ["TECHNICIAN_ASSIGNED"], "Only assigned requests can move in progress");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.maintenanceRequest.update({ where: { id }, data: { status: "IN_PROGRESS" }, include });
    await logActivity(tx, { actorId: actor.id, action: "MAINTENANCE_STARTED", entityId: id, details: { assetId: request.assetId } });
    return updated;
  });
};

const resolveMaintenance = async (actor, id, { resolutionNotes }) => {
  requireManager(actor);
  const request = await prisma.maintenanceRequest.findUnique({ where: { id }, include });
  if (!request) throw new ApiError(404, "NOT_FOUND", "Maintenance request not found");
  ensureTransition(request, ["IN_PROGRESS"], "Only in-progress requests can be resolved");

  const activeAllocation = await prisma.allocation.findFirst({ where: { assetId: request.assetId, status: "ACTIVE" } });
  const nextAssetStatus = activeAllocation ? "ALLOCATED" : "AVAILABLE";

  return prisma.$transaction(async (tx) => {
    await tx.asset.update({ where: { id: request.assetId }, data: { status: nextAssetStatus } });
    const updated = await tx.maintenanceRequest.update({ where: { id }, data: { status: "RESOLVED", resolvedAt: new Date() }, include });
    await notifyRequester(tx, request, {
      type: "MAINTENANCE_RESOLVED",
      title: `Maintenance resolved: ${request.asset.assetTag}`,
      body: resolutionNotes || `${request.asset.name} returned to ${nextAssetStatus.replace("_", " ").toLowerCase()}.`,
    });
    await logActivity(tx, {
      actorId: actor.id,
      action: "MAINTENANCE_RESOLVED",
      entityId: id,
      details: { assetId: request.assetId, nextAssetStatus, resolutionNotes },
    });
    return updated;
  });
};

module.exports = {
  ApiError,
  listMaintenance,
  createMaintenance,
  approveMaintenance,
  rejectMaintenance,
  assignMaintenance,
  startMaintenance,
  resolveMaintenance,
};
