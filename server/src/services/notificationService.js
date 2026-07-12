const { prisma } = require("../db");
const { parseListQuery, toListResponse } = require("../lib/listQuery");

const typeGroups = {
  alerts: ["OVERDUE_RETURN", "RETURN_REQUESTED", "RETURN_PROCESSED", "AUDIT_ASSIGNED", "AUDIT_DISCREPANCY"],
  approvals: [
    "MAINTENANCE_APPROVED",
    "MAINTENANCE_REJECTED",
    "MAINTENANCE_REQUESTED",
    "MAINTENANCE_ASSIGNED",
    "MAINTENANCE_STARTED",
    "MAINTENANCE_RESOLVED",
    "TRANSFER_REQUESTED",
    "TRANSFER_APPROVED",
    "TRANSFER_REJECTED",
    "ROLE_CHANGED",
  ],
  bookings: ["BOOKING_CONFIRMED", "BOOKING_CANCELLED", "BOOKING_RESCHEDULED", "BOOKING_REMINDER"],
};

const hasMetaId = (notification, key, value) => notification.meta && Number(notification.meta[key]) === Number(value);

const createMissingOverdueReturnAlerts = async (actor) => {
  const overdue = await prisma.allocation.findMany({
    where: { userId: actor.id, status: "ACTIVE", expectedReturnDate: { lt: new Date() } },
    include: { asset: { select: { id: true, assetTag: true, name: true } } },
    take: 25,
  });
  if (overdue.length === 0) return;

  const existing = await prisma.notification.findMany({
    where: { userId: actor.id, type: "OVERDUE_RETURN" },
    select: { meta: true },
  });

  const unseen = overdue.filter((allocation) => !existing.some((notification) => hasMetaId(notification, "allocationId", allocation.id)));
  if (unseen.length === 0) return;

  await prisma.notification.createMany({
    data: unseen.map((allocation) => ({
      userId: actor.id,
      type: "OVERDUE_RETURN",
      title: `Overdue return: ${allocation.asset.assetTag}`,
      body: `${allocation.asset.name} was due on ${allocation.expectedReturnDate.toLocaleDateString()}.`,
      meta: { allocationId: allocation.id, assetId: allocation.assetId },
    })),
  });
};

const createMissingBookingReminders = async (actor) => {
  const now = new Date();
  const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const bookings = await prisma.booking.findMany({
    where: { userId: actor.id, status: "UPCOMING", startTime: { gte: now, lte: soon } },
    include: { asset: { select: { id: true, assetTag: true, name: true } } },
    take: 25,
  });
  if (bookings.length === 0) return;

  const existing = await prisma.notification.findMany({
    where: { userId: actor.id, type: "BOOKING_REMINDER" },
    select: { meta: true },
  });

  const unseen = bookings.filter((booking) => !existing.some((notification) => hasMetaId(notification, "bookingId", booking.id)));
  if (unseen.length === 0) return;

  await prisma.notification.createMany({
    data: unseen.map((booking) => ({
      userId: actor.id,
      type: "BOOKING_REMINDER",
      title: `Booking reminder: ${booking.asset.name}`,
      body: `Starts at ${booking.startTime.toLocaleString()}.`,
      meta: { bookingId: booking.id, assetId: booking.assetId },
    })),
  });
};

const ensureSystemNotifications = async (actor) => {
  await Promise.all([createMissingOverdueReturnAlerts(actor), createMissingBookingReminders(actor)]);
};

const listNotifications = async (actor, query) => {
  await ensureSystemNotifications(actor);
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

const unreadCount = async (actor) => {
  await ensureSystemNotifications(actor);
  return prisma.notification.count({ where: { userId: actor.id, isRead: false } });
};
const markRead = (actor, id) => prisma.notification.updateMany({ where: { id, userId: actor.id }, data: { isRead: true } });
const markAllRead = (actor) => prisma.notification.updateMany({ where: { userId: actor.id, isRead: false }, data: { isRead: true } });

module.exports = { listNotifications, unreadCount, markRead, markAllRead };
