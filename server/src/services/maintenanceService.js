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

const requireManagerOrAssignedTechnician = (actor, request) => {
  if (MANAGER_ROLES.includes(actor.role)) return;
  if (request.technicianId === actor.id) return;
  throw new ApiError(403, "FORBIDDEN", "Only managers or the assigned technician can update this maintenance request");
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

const notifyTechnician = (tx, request, { type, title, body }) => {
  if (!request.technicianId) return null;
  return tx.notification.create({
    data: {
      userId: request.technicianId,
      type,
      title,
      body,
      meta: { maintenanceId: request.id, assetId: request.assetId },
    },
  });
};

const notifyUsers = async (tx, userIds, { type, title, body, meta }) => {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) return;
  await tx.notification.createMany({
    data: uniqueIds.map((userId) => ({ userId, type, title, body, meta })),
  });
};

const notifyManagers = async (tx, actorId, { type, title, body, meta }) => {
  const managers = await tx.user.findMany({
    where: { role: { in: MANAGER_ROLES }, status: "ACTIVE", id: { not: actorId } },
    select: { id: true },
  });
  if (managers.length === 0) return;
  await tx.notification.createMany({
    data: managers.map((user) => ({ userId: user.id, type, title, body, meta })),
  });
};

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
    conditions.push({ OR: [{ requesterId: actor.id }, { technicianId: actor.id }] });
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
      details: { assetId, assetTag: asset.assetTag, assetName: asset.name, priority },
    });

    await notifyManagers(tx, actor.id, {
      type: "MAINTENANCE_REQUESTED",
      title: `Maintenance requested: ${asset.assetTag}`,
      body: `${actor.name || actor.email} raised a ${priority.toLowerCase()} priority request for ${asset.name}.`,
      meta: { maintenanceId: request.id, assetId },
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
      details: { assetId: request.assetId, assetTag: request.asset.assetTag, assetName: request.asset.name },
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
      details: { rejectionReason, assetId: request.assetId, assetTag: request.asset.assetTag, assetName: request.asset.name },
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
      details: {
        technicianId: updated.technicianId,
        technicianName: updated.technician?.name || updated.technicianName || technicianName,
        assetId: request.assetId,
        assetTag: request.asset.assetTag,
        assetName: request.asset.name,
      },
    });
    await notifyTechnician(tx, updated, {
      type: "MAINTENANCE_ASSIGNED",
      title: `Maintenance assigned: ${updated.asset.assetTag}`,
      body: `${updated.asset.name} is assigned to you.`,
    });
    if (request.requesterId !== updated.technicianId) {
      await notifyRequester(tx, request, {
        type: "MAINTENANCE_ASSIGNED",
        title: `Technician assigned: ${request.asset.assetTag}`,
        body: `${updated.technician?.name || updated.technicianName || "A technician"} was assigned to ${request.asset.name}.`,
      });
    }
    return updated;
  });
};

const startMaintenance = async (actor, id) => {
  const request = await prisma.maintenanceRequest.findUnique({ where: { id }, include });
  if (!request) throw new ApiError(404, "NOT_FOUND", "Maintenance request not found");
  requireManagerOrAssignedTechnician(actor, request);
  ensureTransition(request, ["TECHNICIAN_ASSIGNED"], "Only assigned requests can move in progress");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.maintenanceRequest.update({ where: { id }, data: { status: "IN_PROGRESS" }, include });
    await logActivity(tx, {
      actorId: actor.id,
      action: "MAINTENANCE_STARTED",
      entityId: id,
      details: {
        assetId: request.assetId,
        assetTag: request.asset.assetTag,
        assetName: request.asset.name,
        technicianName: request.technician?.name || request.technicianName || null,
      },
    });
    await notifyUsers(tx, [request.requesterId, request.technicianId].filter((id) => id !== actor.id), {
      type: "MAINTENANCE_STARTED",
      title: `Maintenance started: ${request.asset.assetTag}`,
      body: `${request.asset.name} is now in progress.`,
      meta: { maintenanceId: request.id, assetId: request.assetId },
    });
    await notifyManagers(tx, actor.id, {
      type: "MAINTENANCE_STARTED",
      title: `Maintenance started: ${request.asset.assetTag}`,
      body: `${actor.name || actor.email} started work on ${request.asset.name}.`,
      meta: { maintenanceId: request.id, assetId: request.assetId },
    });
    return updated;
  });
};

const resolveMaintenance = async (actor, id, { resolutionNotes }) => {
  const request = await prisma.maintenanceRequest.findUnique({ where: { id }, include });
  if (!request) throw new ApiError(404, "NOT_FOUND", "Maintenance request not found");
  requireManagerOrAssignedTechnician(actor, request);
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
      details: {
        assetId: request.assetId,
        assetTag: request.asset.assetTag,
        assetName: request.asset.name,
        technicianName: request.technician?.name || request.technicianName || null,
        nextAssetStatus,
        resolutionNotes,
      },
    });
    await notifyUsers(tx, [request.technicianId].filter((id) => id !== actor.id), {
      type: "MAINTENANCE_RESOLVED",
      title: `Maintenance resolved: ${request.asset.assetTag}`,
      body: resolutionNotes || `${request.asset.name} returned to ${nextAssetStatus.replace("_", " ").toLowerCase()}.`,
      meta: { maintenanceId: request.id, assetId: request.assetId },
    });
    await notifyManagers(tx, actor.id, {
      type: "MAINTENANCE_RESOLVED",
      title: `Maintenance resolved: ${request.asset.assetTag}`,
      body: `${actor.name || actor.email} resolved ${request.asset.name}.`,
      meta: { maintenanceId: request.id, assetId: request.assetId },
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
