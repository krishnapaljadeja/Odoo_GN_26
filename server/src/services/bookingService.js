const { prisma } = require("../db");
const { Prisma } = require("@prisma/client");

class ApiError extends Error {
  constructor(status, code, message, extra) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

const MAX_BOOKING_HOURS = Number(process.env.MAX_BOOKING_HOURS || 8);

const bookingInclude = {
  asset: { select: { id: true, assetTag: true, name: true, location: true, category: { select: { name: true } } } },
  user: { select: { id: true, name: true, email: true, department: { select: { name: true } } } },
};

const logActivity = (tx, { actorId, action, entityId, details }) =>
  tx.activityLog.create({ data: { actorId, action, entity: "Booking", entityId, details } });

const deriveStatus = (booking, now = new Date()) => {
  if (booking.status === "CANCELLED") return "CANCELLED";
  if (booking.endTime <= now) return "COMPLETED";
  if (booking.startTime <= now && booking.endTime > now) return "ONGOING";
  return "UPCOMING";
};

const withDerivedStatus = (booking) => ({ ...booking, status: deriveStatus(booking) });

const syncStatuses = async (bookings, tx = prisma) => {
  const updates = bookings
    .map((booking) => ({ booking, status: deriveStatus(booking) }))
    .filter(({ booking, status }) => booking.status !== status && booking.status !== "CANCELLED");

  await Promise.all(updates.map(({ booking, status }) => tx.booking.update({ where: { id: booking.id }, data: { status } })));

  return bookings.map((booking) => ({ ...booking, status: deriveStatus(booking) }));
};

const getDayRange = (dateValue) => {
  const source = dateValue ? new Date(`${dateValue}T00:00:00`) : new Date();
  if (Number.isNaN(source.getTime())) throw new ApiError(400, "INVALID_DATE", "Date filter must be YYYY-MM-DD");
  const start = new Date(source);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

const assertDuration = (startTime, endTime) => {
  const hours = (endTime - startTime) / (1000 * 60 * 60);
  if (hours > MAX_BOOKING_HOURS) {
    throw new ApiError(400, "BOOKING_TOO_LONG", `Bookings cannot exceed ${MAX_BOOKING_HOURS} hours`);
  }
};

const assertBookableAsset = async (assetId, tx = prisma) => {
  const asset = await tx.asset.findUnique({ where: { id: assetId }, include: { category: { select: { name: true } } } });
  if (!asset) throw new ApiError(404, "NOT_FOUND", "Resource not found");
  if (!asset.isBookable) throw new ApiError(400, "NOT_BOOKABLE", "Selected asset is not a bookable resource");
  if (["UNDER_MAINTENANCE", "LOST", "RETIRED", "DISPOSED"].includes(asset.status)) {
    throw new ApiError(409, "RESOURCE_UNAVAILABLE", `Resource is ${asset.status.replace("_", " ").toLowerCase()} and cannot be booked`);
  }
  return asset;
};

const findOverlap = (tx, { assetId, startTime, endTime, excludeId }) =>
  tx.booking.findFirst({
    where: {
      assetId,
      status: { not: "CANCELLED" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
    include: bookingInclude,
    orderBy: { startTime: "asc" },
  });

const slotLabel = (startTime, endTime) =>
  `${startTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} to ${endTime.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })}`;

const listResources = async (query = {}) => {
  const where = { isBookable: true };
  if (query.search) {
    where.OR = [
      { assetTag: { contains: query.search, mode: "insensitive" } },
      { name: { contains: query.search, mode: "insensitive" } },
      { serialNumber: { contains: query.search, mode: "insensitive" } },
    ];
  }
  if (query.categoryId) where.categoryId = Number(query.categoryId);

  return prisma.asset.findMany({
    where,
    include: { category: { select: { name: true } } },
    orderBy: [{ name: "asc" }, { assetTag: "asc" }],
    take: 50,
  });
};

const listBookings = async (query = {}, requester) => {
  const conditions = [];

  if (query.assetId) conditions.push({ assetId: Number(query.assetId) });
  if (query.status) conditions.push({ status: String(query.status).toUpperCase() });
  if (query.mine === "true") conditions.push({ userId: requester.id });
  if (query.date) {
    const { start, end } = getDayRange(query.date);
    conditions.push({ startTime: { lt: end }, endTime: { gt: start } });
  }

  if (requester.role === "EMPLOYEE" && query.mine !== "false") {
    // Employees can inspect resource calendars, but personal lists default to
    // their own bookings when no explicit resource/date calendar is requested.
    if (!query.assetId && !query.date) conditions.push({ userId: requester.id });
  }

  const bookings = await prisma.booking.findMany({
    where: conditions.length > 0 ? { AND: conditions } : {},
    include: bookingInclude,
    orderBy: { startTime: "asc" },
  });

  return syncStatuses(bookings);
};

const createBooking = async (actor, { assetId, startTime, endTime, purpose }) => {
  assertDuration(startTime, endTime);

  return prisma.$transaction(async (tx) => {
    const asset = await assertBookableAsset(assetId, tx);
    const overlap = await findOverlap(tx, { assetId, startTime, endTime });
    if (overlap) {
      throw new ApiError(409, "SLOT_UNAVAILABLE", "Requested slot is unavailable", {
        conflict: withDerivedStatus(overlap),
      });
    }

    const booking = await tx.booking.create({
      data: { assetId, userId: actor.id, startTime, endTime, purpose: purpose || null, status: "UPCOMING" },
      include: bookingInclude,
    });

    await tx.notification.create({
      data: {
        userId: actor.id,
        type: "BOOKING_CONFIRMED",
        title: `Booking confirmed: ${asset.name}, ${slotLabel(startTime, endTime)}`,
        body: purpose || "Resource booking confirmed.",
        meta: { bookingId: booking.id, assetId },
      },
    });

    await logActivity(tx, {
      actorId: actor.id,
      action: "BOOKING_CONFIRMED",
      entityId: booking.id,
      details: { assetId, assetTag: asset.assetTag, slot: slotLabel(startTime, endTime) },
    });

    return booking;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
};

const canManageBooking = (requester, booking) =>
  requester.role === "ADMIN" || requester.role === "ASSET_MANAGER" || booking.userId === requester.id;

const cancelBooking = async (requester, id) => {
  const booking = await prisma.booking.findUnique({ where: { id }, include: bookingInclude });
  if (!booking) throw new ApiError(404, "NOT_FOUND", "Booking not found");
  if (!canManageBooking(requester, booking)) throw new ApiError(403, "FORBIDDEN", "You can only cancel your own bookings");
  if (booking.status === "CANCELLED") throw new ApiError(409, "ALREADY_CANCELLED", "Booking is already cancelled");
  if (deriveStatus(booking) === "COMPLETED") throw new ApiError(409, "BOOKING_COMPLETED", "Completed bookings cannot be cancelled");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.booking.update({ where: { id }, data: { status: "CANCELLED" }, include: bookingInclude });
    await tx.notification.create({
      data: {
        userId: booking.userId,
        type: "BOOKING_CANCELLED",
        title: `Booking cancelled: ${booking.asset.name}`,
        body: slotLabel(booking.startTime, booking.endTime),
        meta: { bookingId: id, assetId: booking.assetId },
      },
    });
    await logActivity(tx, { actorId: requester.id, action: "BOOKING_CANCELLED", entityId: id, details: { assetId: booking.assetId } });
    return updated;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
};

const rescheduleBooking = async (requester, id, { startTime, endTime, purpose }) => {
  assertDuration(startTime, endTime);

  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({ where: { id }, include: bookingInclude });
    if (!booking) throw new ApiError(404, "NOT_FOUND", "Booking not found");
    if (!canManageBooking(requester, booking)) throw new ApiError(403, "FORBIDDEN", "You can only reschedule your own bookings");
    if (booking.status === "CANCELLED") throw new ApiError(409, "BOOKING_CANCELLED", "Cancelled bookings cannot be rescheduled");
    if (deriveStatus(booking) === "COMPLETED") throw new ApiError(409, "BOOKING_COMPLETED", "Completed bookings cannot be rescheduled");

    await assertBookableAsset(booking.assetId, tx);
    const overlap = await findOverlap(tx, { assetId: booking.assetId, startTime, endTime, excludeId: id });
    if (overlap) {
      throw new ApiError(409, "SLOT_UNAVAILABLE", "Requested slot is unavailable", {
        conflict: withDerivedStatus(overlap),
      });
    }

    const updated = await tx.booking.update({
      where: { id },
      data: { startTime, endTime, purpose: purpose ?? booking.purpose, status: "UPCOMING" },
      include: bookingInclude,
    });
    await logActivity(tx, { actorId: requester.id, action: "BOOKING_RESCHEDULED", entityId: id, details: { slot: slotLabel(startTime, endTime) } });
    return updated;
  });
};

module.exports = {
  ApiError,
  listResources,
  listBookings,
  createBooking,
  cancelBooking,
  rescheduleBooking,
};
