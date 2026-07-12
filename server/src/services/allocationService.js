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

const logActivity = (tx, { actorId, action, entity, entityId, details }) =>
  tx.activityLog.create({ data: { actorId, action, entity, entityId, details } });

const BLOCKED_STATUSES = ["UNDER_MAINTENANCE", "LOST", "RETIRED", "DISPOSED"];

const allocationInclude = {
  asset: { select: { id: true, assetTag: true, name: true, status: true } },
  user: { select: { id: true, name: true, email: true, departmentId: true } },
};

const allocate = async (actorId, { assetId, userId, departmentId, expectedReturnDate }) => {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) throw new ApiError(404, "NOT_FOUND", "Asset not found");

  if (asset.status === "ALLOCATED") {
    const activeAllocation = await prisma.allocation.findFirst({
      where: { assetId, status: "ACTIVE" },
      include: { user: { select: { id: true, name: true, departmentId: true, department: { select: { name: true } } } } },
    });

    const holderName = activeAllocation?.user?.name || "another employee";
    const holderDept = activeAllocation?.user?.department?.name || "unassigned dept";

    throw new ApiError(
      409,
      "ALREADY_ALLOCATED",
      `Already Allocated to ${holderName} (${holderDept}) — Direct re-allocation is blocked — submit a transfer request below`,
      {
        currentHolder: activeAllocation?.user
          ? { id: activeAllocation.user.id, name: activeAllocation.user.name, department: holderDept }
          : null,
      },
    );
  }

  if (BLOCKED_STATUSES.includes(asset.status)) {
    throw new ApiError(409, "ASSET_UNAVAILABLE", `Asset is ${asset.status.replace("_", " ").toLowerCase()} and cannot be allocated`);
  }

  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(400, "INVALID_USER", "Selected employee does not exist");
  }

  if (departmentId) {
    const department = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!department) throw new ApiError(400, "INVALID_DEPARTMENT", "Selected department does not exist");
  }

  return prisma.$transaction(async (tx) => {
    // Update the asset status before creating the allocation so the
    // allocation's nested `asset` include reflects the post-write state.
    await tx.asset.update({ where: { id: assetId }, data: { status: "ALLOCATED" } });

    const allocation = await tx.allocation.create({
      data: { assetId, userId: userId || null, departmentId: departmentId || null, expectedReturnDate, status: "ACTIVE" },
      include: allocationInclude,
    });

    await logActivity(tx, {
      actorId,
      action: "ALLOCATED",
      entity: "Asset",
      entityId: assetId,
      details: { userId, departmentId, assetTag: asset.assetTag },
    });

    if (userId) {
      await tx.notification.create({
        data: {
          userId,
          type: "ASSET_ASSIGNED",
          title: `${asset.name} ${asset.assetTag} assigned to you`,
          body: `This asset has been allocated to you.`,
          meta: { assetId },
        },
      });
    }

    return allocation;
  });
};

const canActOnAllocation = (requester, allocation) => {
  if (requester.role === "ADMIN" || requester.role === "ASSET_MANAGER") return true;
  return allocation.userId === requester.id;
};

const requestReturn = async (requester, id) => {
  const allocation = await prisma.allocation.findUnique({ where: { id } });
  if (!allocation) throw new ApiError(404, "NOT_FOUND", "Allocation not found");
  if (allocation.status !== "ACTIVE") throw new ApiError(409, "ILLEGAL_TRANSITION", "Only an active allocation can have a return requested");
  if (!canActOnAllocation(requester, allocation)) throw new ApiError(403, "FORBIDDEN", "You can only request a return for your own allocation");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.allocation.update({ where: { id }, data: { status: "RETURN_REQUESTED" }, include: allocationInclude });
    await logActivity(tx, { actorId: requester.id, action: "RETURN_REQUESTED", entity: "Allocation", entityId: id, details: {} });
    return updated;
  });
};

const returnAllocation = async (actorId, id, { returnCondition, checkInNotes }) => {
  const allocation = await prisma.allocation.findUnique({ where: { id }, include: { asset: true } });
  if (!allocation) throw new ApiError(404, "NOT_FOUND", "Allocation not found");
  if (!["ACTIVE", "RETURN_REQUESTED"].includes(allocation.status)) {
    throw new ApiError(409, "ILLEGAL_TRANSITION", "This allocation has already been returned");
  }

  return prisma.$transaction(async (tx) => {
    await tx.asset.update({ where: { id: allocation.assetId }, data: { status: "AVAILABLE", condition: returnCondition } });

    const updated = await tx.allocation.update({
      where: { id },
      data: { status: "RETURNED", returnedAt: new Date(), returnCondition, checkInNotes },
      include: allocationInclude,
    });

    await logActivity(tx, {
      actorId,
      action: "RETURNED",
      entity: "Asset",
      entityId: allocation.assetId,
      details: { returnCondition, checkInNotes, assetTag: allocation.asset.assetTag },
    });

    if (allocation.userId) {
      await tx.notification.create({
        data: {
          userId: allocation.userId,
          type: "RETURN_PROCESSED",
          title: `Return processed for ${allocation.asset.assetTag}`,
          body: `Condition recorded as ${returnCondition.toLowerCase()}.`,
          meta: { assetId: allocation.assetId },
        },
      });
    }

    return updated;
  });
};

const listAllocations = async (query, requester) => {
  const { skip, take, page, limit, sortBy, sortOrder } = parseListQuery(query, {
    defaultSortBy: "allocatedAt",
    allowedSortBy: ["allocatedAt", "expectedReturnDate", "status"],
  });

  const conditions = [];

  if (query.assetId) conditions.push({ assetId: Number(query.assetId) });

  if (query.status === "active") conditions.push({ status: "ACTIVE" });
  else if (query.status === "returned") conditions.push({ status: "RETURNED" });
  else if (query.status === "overdue") conditions.push({ status: "ACTIVE", expectedReturnDate: { lt: new Date() } });

  if (query.userId) conditions.push({ userId: Number(query.userId) });
  if (query.departmentId) conditions.push({ departmentId: Number(query.departmentId) });

  if (requester.role === "EMPLOYEE") {
    conditions.push({ userId: requester.id });
  } else if (requester.role === "DEPARTMENT_HEAD") {
    conditions.push({ departmentId: requester.departmentId });
  }

  const where = conditions.length > 0 ? { AND: conditions } : {};

  const [rows, total] = await Promise.all([
    prisma.allocation.findMany({ where, include: allocationInclude, orderBy: { [sortBy]: sortOrder }, skip, take }),
    prisma.allocation.count({ where }),
  ]);

  const now = new Date();
  const data = rows.map((row) => ({
    ...row,
    isOverdue: row.status === "ACTIVE" && row.expectedReturnDate && row.expectedReturnDate < now,
  }));

  return toListResponse(data, total, { page, limit });
};

module.exports = {
  ApiError,
  allocate,
  requestReturn,
  returnAllocation,
  listAllocations,
};
