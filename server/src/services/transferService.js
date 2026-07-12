const { prisma } = require("../db");
const { parseListQuery, toListResponse } = require("../lib/listQuery");

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const logActivity = (tx, { actorId, action, entity, entityId, details }) =>
  tx.activityLog.create({ data: { actorId, action, entity, entityId, details } });

const notifyTransferApprovers = async (tx, transfer) => {
  const approvers = await tx.user.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { role: { in: ["ADMIN", "ASSET_MANAGER"] } },
        { role: "DEPARTMENT_HEAD", departmentId: { in: [transfer.fromUser.departmentId, transfer.toUser.departmentId].filter(Boolean) } },
      ],
    },
    select: { id: true },
  });
  const userIds = [...new Set(approvers.map((user) => user.id))];
  if (userIds.length === 0) return;
  await tx.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type: "TRANSFER_REQUESTED",
      title: `Transfer requested: ${transfer.asset.assetTag}`,
      body: `${transfer.fromUser.name || transfer.fromUser.email} to ${transfer.toUser.name || transfer.toUser.email}`,
      meta: { transferId: transfer.id, assetId: transfer.asset.id },
    })),
  });
};

const transferInclude = {
  asset: { select: { id: true, assetTag: true, name: true, status: true } },
  fromUser: { select: { id: true, name: true, email: true, departmentId: true } },
  toUser: { select: { id: true, name: true, email: true, departmentId: true } },
};

const createTransfer = async (requester, { assetId, toUserId, reason }) => {
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) throw new ApiError(404, "NOT_FOUND", "Asset not found");
  if (asset.status !== "ALLOCATED") throw new ApiError(409, "NOT_ALLOCATED", "Asset is not currently allocated to anyone");

  const activeAllocation = await prisma.allocation.findFirst({ where: { assetId, status: "ACTIVE" } });
  if (!activeAllocation || !activeAllocation.userId) {
    throw new ApiError(409, "NOT_ALLOCATED", "Asset is not currently allocated to an individual employee");
  }

  // Employees may only initiate a transfer for an asset they currently hold
  // (plan section 3: "Initiate return/transfer request ... Employee (own
  // assets)"). Admin/Asset Manager/Department Head can act on anyone's behalf.
  if (requester.role === "EMPLOYEE" && activeAllocation.userId !== requester.id) {
    throw new ApiError(403, "FORBIDDEN", "You can only request a transfer for an asset allocated to you");
  }

  if (activeAllocation.userId === toUserId) {
    throw new ApiError(400, "SAME_HOLDER", "Asset is already allocated to that employee");
  }

  const toUser = await prisma.user.findUnique({ where: { id: toUserId } });
  if (!toUser) throw new ApiError(400, "INVALID_USER", "Selected employee does not exist");

  return prisma.$transaction(async (tx) => {
    const transfer = await tx.transferRequest.create({
      data: { assetId, fromUserId: activeAllocation.userId, toUserId, reason, status: "REQUESTED" },
      include: transferInclude,
    });

    await logActivity(tx, {
      actorId: requester.id,
      action: "TRANSFER_REQUESTED",
      entity: "TransferRequest",
      entityId: transfer.id,
      details: {
        assetTag: transfer.asset.assetTag,
        assetName: transfer.asset.name,
        fromUserId: transfer.fromUserId,
        fromUserName: transfer.fromUser.name,
        toUserId: transfer.toUserId,
        toUserName: transfer.toUser.name,
      },
    });

    await notifyTransferApprovers(tx, transfer);

    return transfer;
  });
};

const assertCanDecide = (requester, transfer) => {
  if (requester.role === "ADMIN" || requester.role === "ASSET_MANAGER") return;

  if (requester.role === "DEPARTMENT_HEAD") {
    const sameDept =
      requester.departmentId &&
      transfer.fromUser.departmentId === requester.departmentId &&
      transfer.toUser.departmentId === requester.departmentId;
    if (sameDept) return;
  }

  throw new ApiError(403, "FORBIDDEN", "You do not have permission to decide this transfer request");
};

const approveTransfer = async (requester, id) => {
  const transfer = await prisma.transferRequest.findUnique({ where: { id }, include: transferInclude });
  if (!transfer) throw new ApiError(404, "NOT_FOUND", "Transfer request not found");
  if (transfer.status !== "REQUESTED") throw new ApiError(409, "ILLEGAL_TRANSITION", "This transfer request has already been decided");

  assertCanDecide(requester, transfer);

  return prisma.$transaction(async (tx) => {
    const currentAllocation = await tx.allocation.findFirst({ where: { assetId: transfer.assetId, status: "ACTIVE" } });

    if (currentAllocation) {
      await tx.allocation.update({ where: { id: currentAllocation.id }, data: { status: "RETURNED", returnedAt: new Date() } });
    }

    await tx.allocation.create({
      data: {
        assetId: transfer.assetId,
        userId: transfer.toUserId,
        departmentId: transfer.toUser.departmentId,
        expectedReturnDate: currentAllocation?.expectedReturnDate || null,
        status: "ACTIVE",
      },
    });

    const updated = await tx.transferRequest.update({
      where: { id },
      data: { status: "APPROVED", decidedById: requester.id, decidedAt: new Date() },
      include: transferInclude,
    });

    await logActivity(tx, {
      actorId: requester.id,
      action: "TRANSFER_APPROVED",
      entity: "TransferRequest",
      entityId: id,
      details: {
        assetTag: transfer.asset.assetTag,
        assetName: transfer.asset.name,
        fromUserName: transfer.fromUser.name,
        toUserName: transfer.toUser.name,
      },
    });

    await tx.notification.createMany({
      data: [
        {
          userId: transfer.fromUserId,
          type: "TRANSFER_APPROVED",
          title: `Transfer approved: ${transfer.asset.assetTag} moved to ${transfer.toUser.name}`,
          body: transfer.reason,
        },
        {
          userId: transfer.toUserId,
          type: "TRANSFER_APPROVED",
          title: `${transfer.asset.assetTag} has been transferred to you`,
          body: transfer.reason,
        },
      ],
    });

    return updated;
  });
};

const rejectTransfer = async (requester, id, note) => {
  const transfer = await prisma.transferRequest.findUnique({ where: { id }, include: transferInclude });
  if (!transfer) throw new ApiError(404, "NOT_FOUND", "Transfer request not found");
  if (transfer.status !== "REQUESTED") throw new ApiError(409, "ILLEGAL_TRANSITION", "This transfer request has already been decided");

  assertCanDecide(requester, transfer);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.transferRequest.update({
      where: { id },
      data: { status: "REJECTED", decidedById: requester.id, decidedAt: new Date() },
      include: transferInclude,
    });

    await logActivity(tx, {
      actorId: requester.id,
      action: "TRANSFER_REJECTED",
      entity: "TransferRequest",
      entityId: id,
      details: {
        assetTag: transfer.asset.assetTag,
        assetName: transfer.asset.name,
        fromUserName: transfer.fromUser.name,
        toUserName: transfer.toUser.name,
        note: note || null,
      },
    });

    await tx.notification.create({
      data: {
        userId: transfer.fromUserId,
        type: "TRANSFER_REJECTED",
        title: `Transfer request rejected: ${transfer.asset.assetTag}`,
        body: note || "Your transfer request was not approved.",
      },
    });

    return updated;
  });
};

const listTransfers = async (query, requester) => {
  const { skip, take, page, limit, sortBy, sortOrder } = parseListQuery(query, {
    defaultSortBy: "createdAt",
    allowedSortBy: ["createdAt", "status"],
  });

  const conditions = [];

  if (query.status) conditions.push({ status: query.status });
  if (query.assetId) conditions.push({ assetId: Number(query.assetId) });

  if (query.mine === "true") {
    conditions.push({ OR: [{ fromUserId: requester.id }, { toUserId: requester.id }] });
  } else if (requester.role === "EMPLOYEE") {
    conditions.push({ OR: [{ fromUserId: requester.id }, { toUserId: requester.id }] });
  } else if (requester.role === "DEPARTMENT_HEAD" && requester.departmentId) {
    conditions.push({
      OR: [{ fromUser: { departmentId: requester.departmentId } }, { toUser: { departmentId: requester.departmentId } }],
    });
  }

  const where = conditions.length > 0 ? { AND: conditions } : {};

  const [data, total] = await Promise.all([
    prisma.transferRequest.findMany({ where, include: transferInclude, orderBy: { [sortBy]: sortOrder }, skip, take }),
    prisma.transferRequest.count({ where }),
  ]);

  return toListResponse(data, total, { page, limit });
};

module.exports = {
  ApiError,
  createTransfer,
  approveTransfer,
  rejectTransfer,
  listTransfers,
};
