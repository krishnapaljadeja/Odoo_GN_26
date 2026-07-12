const { prisma } = require("../db");
const { parseListQuery, toListResponse } = require("../lib/listQuery");

const typeGroups = {
  alerts: ["OVERDUE_RETURN", "AUDIT_DISCREPANCY"],
  approvals: ["MAINTENANCE_APPROVED", "MAINTENANCE_REJECTED", "TRANSFER_APPROVED", "ROLE_CHANGED"],
  bookings: ["BOOKING_CONFIRMED", "BOOKING_CANCELLED", "BOOKING_REMINDER"],
};

const listNotifications = async (actor, query) => {
  const { skip, take, page, limit } = parseListQuery(query, { defaultSortBy: "createdAt" });
  const conditions = [{ userId: actor.id }];
  if (query.group && query.group !== "all") conditions.push({ type: { in: typeGroups[query.group] || [] } });
  if (query.isRead === "true") conditions.push({ isRead: true });
  if (query.isRead === "false") conditions.push({ isRead: false });
  const where = { AND: conditions };
  const [data, total] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.notification.count({ where }),
  ]);
  return toListResponse(data, total, { page, limit });
};

const unreadCount = (actor) => prisma.notification.count({ where: { userId: actor.id, isRead: false } });
const markRead = (actor, id) => prisma.notification.updateMany({ where: { id, userId: actor.id }, data: { isRead: true } });
const markAllRead = (actor) => prisma.notification.updateMany({ where: { userId: actor.id, isRead: false }, data: { isRead: true } });

module.exports = { listNotifications, unreadCount, markRead, markAllRead };
