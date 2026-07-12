const { prisma } = require("../db");

const MANAGER_ROLES = ["ADMIN", "ASSET_MANAGER"];
const RETIREMENT_YEARS = Number(process.env.ASSET_RETIREMENT_YEARS || 4);

const scopeAssetWhere = (actor) => {
  if (actor.role === "DEPARTMENT_HEAD") return { departmentId: actor.departmentId || -1 };
  if (actor.role === "EMPLOYEE") return { allocations: { some: { userId: actor.id, status: "ACTIVE" } } };
  return {};
};

const scopeAllocationWhere = (actor) => {
  if (actor.role === "DEPARTMENT_HEAD") return { OR: [{ departmentId: actor.departmentId || -1 }, { user: { departmentId: actor.departmentId || -1 } }] };
  if (actor.role === "EMPLOYEE") return { userId: actor.id };
  return {};
};

const scopeBookingWhere = (actor) => (actor.role === "EMPLOYEE" ? { userId: actor.id } : {});

const getKpis = async (actor) => {
  const assetScope = scopeAssetWhere(actor);
  const allocationScope = scopeAllocationWhere(actor);
  const bookingScope = scopeBookingWhere(actor);
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 86400000);

  const [
    available,
    allocated,
    bookableFree,
    activeBookings,
    pendingTransfers,
    upcomingReturns,
    overdueReturns,
    maintenanceToday,
    recentActivity,
  ] = await Promise.all([
    prisma.asset.count({ where: { ...assetScope, status: "AVAILABLE" } }),
    prisma.asset.count({ where: { ...assetScope, status: "ALLOCATED" } }),
    prisma.asset.count({ where: { ...assetScope, isBookable: true, status: "AVAILABLE" } }),
    prisma.booking.count({ where: { ...bookingScope, status: { in: ["UPCOMING", "ONGOING"] }, endTime: { gte: now } } }),
    prisma.transferRequest.count({ where: { status: "REQUESTED" } }),
    prisma.allocation.count({ where: { ...allocationScope, status: "ACTIVE", expectedReturnDate: { gte: now, lte: in7Days } } }),
    prisma.allocation.count({ where: { ...allocationScope, status: "ACTIVE", expectedReturnDate: { lt: now } } }),
    prisma.maintenanceRequest.count({ where: { status: { in: ["APPROVED", "TECHNICIAN_ASSIGNED", "IN_PROGRESS"] } } }),
    prisma.activityLog.findMany({
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return {
    available,
    allocated,
    bookableFree,
    activeBookings,
    pendingTransfers,
    upcomingReturns,
    overdueReturns,
    maintenanceToday,
    recentActivity,
  };
};

const getUtilization = async (actor, groupBy = "department") => {
  const assets = await prisma.asset.findMany({
    where: scopeAssetWhere(actor),
    include: { department: true, category: true },
  });

  const groups = new Map();
  assets.forEach((asset) => {
    const key = groupBy === "category" ? asset.category?.name || "Uncategorized" : asset.department?.name || "Unassigned";
    const row = groups.get(key) || { label: key, total: 0, allocated: 0 };
    row.total += 1;
    if (asset.status === "ALLOCATED") row.allocated += 1;
    groups.set(key, row);
  });

  return Array.from(groups.values()).map((row) => ({ ...row, utilization: row.total ? Math.round((row.allocated / row.total) * 100) : 0 }));
};

const getMaintenanceFrequency = async () => {
  const rows = await prisma.maintenanceRequest.findMany({ select: { createdAt: true } });
  const months = new Map();
  rows.forEach((row) => {
    const date = new Date(row.createdAt);
    const label = date.toLocaleString("en", { month: "short" });
    months.set(label, (months.get(label) || 0) + 1);
  });
  return Array.from(months.entries()).map(([label, count]) => ({ label, count }));
};

const getMostUsed = async (actor) => {
  const [bookingGroups, allocationGroups] = await Promise.all([
    prisma.booking.groupBy({ by: ["assetId"], _count: { id: true }, where: scopeBookingWhere(actor), orderBy: { _count: { id: "desc" } }, take: 5 }),
    prisma.allocation.groupBy({ by: ["assetId"], _count: { id: true }, where: scopeAllocationWhere(actor), orderBy: { _count: { id: "desc" } }, take: 5 }),
  ]);
  const ids = [...new Set([...bookingGroups, ...allocationGroups].map((row) => row.assetId))];
  const assets = await prisma.asset.findMany({ where: { id: { in: ids } }, select: { id: true, assetTag: true, name: true } });
  const byId = new Map(assets.map((asset) => [asset.id, asset]));

  return {
    bookings: bookingGroups.map((row) => ({ asset: byId.get(row.assetId), count: row._count.id })).filter((row) => row.asset),
    allocations: allocationGroups.map((row) => ({ asset: byId.get(row.assetId), count: row._count.id })).filter((row) => row.asset),
  };
};

const getIdleAssets = async (actor, days = 45) => {
  const since = new Date(Date.now() - Number(days) * 86400000);
  const assets = await prisma.asset.findMany({
    where: {
      ...scopeAssetWhere(actor),
      updatedAt: { lt: since },
      allocations: { none: { allocatedAt: { gte: since } } },
      bookings: { none: { startTime: { gte: since } } },
    },
    include: { category: { select: { name: true } } },
    orderBy: { updatedAt: "asc" },
    take: 10,
  });
  return assets.map((asset) => ({ ...asset, idleDays: Math.floor((Date.now() - new Date(asset.updatedAt).getTime()) / 86400000) }));
};

const getDueSoon = async (actor) => {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - RETIREMENT_YEARS);
  return prisma.asset.findMany({
    where: { ...scopeAssetWhere(actor), OR: [{ acquisitionDate: { lte: cutoff } }, { condition: { in: ["POOR", "DAMAGED"] } }] },
    include: { category: { select: { name: true } } },
    orderBy: [{ condition: "desc" }, { acquisitionDate: "asc" }],
    take: 10,
  });
};

const getBookingHeatmap = async (actor) => {
  const bookings = await prisma.booking.findMany({ where: scopeBookingWhere(actor), select: { startTime: true } });
  const cells = {};
  bookings.forEach((booking) => {
    const date = new Date(booking.startTime);
    const key = `${date.getDay()}-${date.getHours()}`;
    cells[key] = (cells[key] || 0) + 1;
  });
  return cells;
};

const getAllocationSummary = (actor) => getUtilization(actor, "department");

const toCsv = (rows) => {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  return [keys.join(","), ...rows.map((row) => keys.map((key) => JSON.stringify(row[key] ?? "")).join(","))].join("\n");
};

module.exports = {
  getKpis,
  getUtilization,
  getMaintenanceFrequency,
  getMostUsed,
  getIdleAssets,
  getDueSoon,
  getBookingHeatmap,
  getAllocationSummary,
  toCsv,
};
