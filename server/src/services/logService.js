const { prisma } = require("../db");
const { parseListQuery, toListResponse } = require("../lib/listQuery");

const listLogs = async (actor, query) => {
  if (!["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"].includes(actor.role)) {
    const error = new Error("Forbidden");
    error.status = 403;
    throw error;
  }

  const { skip, take, page, limit, search, sortBy, sortOrder } = parseListQuery(query, {
    defaultSortBy: "createdAt",
    allowedSortBy: ["createdAt", "action", "entity"],
  });
  const conditions = [];
  if (query.actorId) conditions.push({ actorId: Number(query.actorId) });
  if (query.entity) conditions.push({ entity: query.entity });
  if (query.action) conditions.push({ action: { contains: query.action, mode: "insensitive" } });
  if (query.from) conditions.push({ createdAt: { gte: new Date(query.from) } });
  if (query.to) conditions.push({ createdAt: { lte: new Date(query.to) } });
  if (search) conditions.push({ OR: [{ action: { contains: search, mode: "insensitive" } }, { entity: { contains: search, mode: "insensitive" } }] });

  const where = conditions.length ? { AND: conditions } : {};
  const [data, total] = await Promise.all([
    prisma.activityLog.findMany({ where, include: { actor: { select: { name: true, email: true, role: true } } }, orderBy: { [sortBy]: sortOrder }, skip, take }),
    prisma.activityLog.count({ where }),
  ]);
  return toListResponse(data, total, { page, limit });
};

module.exports = { listLogs };
