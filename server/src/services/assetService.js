const { prisma } = require("../db");
const { parseListQuery, toListResponse } = require("../lib/listQuery");

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Direct asset-detail edits only cover the transitions this screen owns
// (plan section 6.1). ALLOCATED/RESERVED/UNDER_MAINTENANCE are set by the
// Allocation/Booking/Maintenance services, never by a direct PATCH here.
const DIRECT_STATUS_TRANSITIONS = {
  AVAILABLE: ["LOST", "RETIRED"],
  RESERVED: ["LOST", "RETIRED"],
  UNDER_MAINTENANCE: ["LOST", "RETIRED"],
  // Losing a checked-out asset is a real scenario (theft, misplaced while
  // allocated); retiring one still checked out is not - return/transfer it
  // first.
  ALLOCATED: ["LOST"],
  LOST: ["AVAILABLE", "RETIRED"],
  RETIRED: ["DISPOSED"],
  DISPOSED: [],
};

const assertLegalTransition = (currentStatus, nextStatus) => {
  if (currentStatus === nextStatus) return;

  const allowed = DIRECT_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw new ApiError(
      409,
      "ILLEGAL_TRANSITION",
      `Cannot change status from ${currentStatus} to ${nextStatus} directly`,
    );
  }
};

const generateNextAssetTag = async (tx) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const existing = await tx.asset.findMany({
      where: { assetTag: { startsWith: "AF-" } },
      select: { assetTag: true },
    });

    const max = existing.reduce((acc, asset) => {
      const match = asset.assetTag.match(/^AF-(\d+)$/);
      return match ? Math.max(acc, Number(match[1])) : acc;
    }, 0);

    const candidate = `AF-${String(max + 1 + attempt).padStart(4, "0")}`;
    const taken = await tx.asset.findUnique({ where: { assetTag: candidate } });
    if (!taken) return candidate;
  }

  throw new ApiError(500, "TAG_GENERATION_FAILED", "Could not generate a unique asset tag, try again");
};

const logActivity = (tx, { actorId, action, entity, entityId, details }) =>
  tx.activityLog.create({ data: { actorId, action, entity, entityId, details } });

const assetListSelect = {
  id: true,
  assetTag: true,
  name: true,
  status: true,
  condition: true,
  location: true,
  isBookable: true,
  categoryId: true,
  departmentId: true,
  category: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
  createdAt: true,
};

const listAssets = async (query) => {
  const { skip, take, page, limit, search, sortBy, sortOrder } = parseListQuery(query, {
    defaultSortBy: "assetTag",
    allowedSortBy: ["assetTag", "name", "status", "createdAt"],
  });

  const where = {
    AND: [
      search
        ? {
            OR: [
              { assetTag: { contains: search, mode: "insensitive" } },
              { serialNumber: { contains: search, mode: "insensitive" } },
              { name: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      query.status ? { status: query.status } : {},
      query.categoryId ? { categoryId: Number(query.categoryId) } : {},
      query.departmentId ? { departmentId: Number(query.departmentId) } : {},
      query.location ? { location: { contains: query.location, mode: "insensitive" } } : {},
      query.isBookable !== undefined ? { isBookable: query.isBookable === "true" } : {},
    ],
  };

  const [data, total] = await Promise.all([
    prisma.asset.findMany({ where, select: assetListSelect, orderBy: { [sortBy]: sortOrder }, skip, take }),
    prisma.asset.count({ where }),
  ]);

  return toListResponse(data, total, { page, limit });
};

const assetDetailInclude = {
  category: true,
  department: true,
  allocations: { orderBy: { allocatedAt: "desc" }, include: { user: { select: { id: true, name: true, email: true } } } },
  maintenance: { orderBy: { createdAt: "desc" } },
  bookings: { orderBy: { startTime: "desc" }, include: { user: { select: { id: true, name: true } } } },
  auditItems: { orderBy: { id: "desc" }, include: { cycle: { select: { id: true, title: true } } } },
};

const getAssetById = async (id) => {
  const asset = await prisma.asset.findUnique({ where: { id }, include: assetDetailInclude });
  if (!asset) throw new ApiError(404, "NOT_FOUND", "Asset not found");
  return asset;
};

const validateReferences = async ({ categoryId, departmentId }) => {
  if (categoryId) {
    const category = await prisma.assetCategory.findUnique({ where: { id: categoryId } });
    if (!category) throw new ApiError(400, "INVALID_CATEGORY", "Selected category does not exist");
  }

  if (departmentId) {
    const department = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!department) throw new ApiError(400, "INVALID_DEPARTMENT", "Selected department does not exist");
  }
};

const createAsset = async (actorId, data) => {
  await validateReferences(data);

  if (data.serialNumber) {
    const existing = await prisma.asset.findUnique({ where: { serialNumber: data.serialNumber } });
    if (existing) throw new ApiError(409, "ALREADY_EXISTS", "An asset with that serial number already exists");
  }

  return prisma.$transaction(async (tx) => {
    const assetTag = await generateNextAssetTag(tx);

    const asset = await tx.asset.create({
      data: { ...data, assetTag, status: "AVAILABLE" },
      include: assetDetailInclude,
    });

    await logActivity(tx, { actorId, action: "ASSET_REGISTERED", entity: "Asset", entityId: asset.id, details: { assetTag, name: asset.name } });

    return asset;
  });
};

const updateAsset = async (actorId, id, data) => {
  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) throw new ApiError(404, "NOT_FOUND", "Asset not found");

  await validateReferences(data);

  if (data.serialNumber && data.serialNumber !== asset.serialNumber) {
    const existing = await prisma.asset.findUnique({ where: { serialNumber: data.serialNumber } });
    if (existing) throw new ApiError(409, "ALREADY_EXISTS", "An asset with that serial number already exists");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.asset.update({ where: { id }, data, include: assetDetailInclude });
    await logActivity(tx, { actorId, action: "ASSET_UPDATED", entity: "Asset", entityId: id, details: data });
    return updated;
  });
};

const changeAssetStatus = async (actorId, id, { status, reason }) => {
  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) throw new ApiError(404, "NOT_FOUND", "Asset not found");

  assertLegalTransition(asset.status, status);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.asset.update({ where: { id }, data: { status }, include: assetDetailInclude });

    await logActivity(tx, {
      actorId,
      action: "ASSET_STATUS_CHANGED",
      entity: "Asset",
      entityId: id,
      details: { from: asset.status, to: status, reason },
    });

    return updated;
  });
};

module.exports = {
  ApiError,
  listAssets,
  getAssetById,
  createAsset,
  updateAsset,
  changeAssetStatus,
};
