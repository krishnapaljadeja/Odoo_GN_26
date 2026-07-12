const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const SEED_PASSWORD = "Passw0rd1";

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const daysFromNow = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);
const yearsAgo = (n) => new Date(Date.now() - n * 365 * 24 * 60 * 60 * 1000);

const todayAt = (hour, minute = 0) => {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
};

async function main() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  // ---- Departments ----------------------------------------------------
  const engineering = await prisma.department.upsert({
    where: { name: "Engineering" },
    update: {},
    create: { name: "Engineering", status: "ACTIVE" },
  });
  const facilities = await prisma.department.upsert({
    where: { name: "Facilities" },
    update: {},
    create: { name: "Facilities", status: "ACTIVE" },
  });
  const fieldOps = await prisma.department.upsert({
    where: { name: "Field Ops" },
    update: {},
    create: { name: "Field Ops", status: "ACTIVE" },
  });
  const fieldOpsEast = await prisma.department.upsert({
    where: { name: "Field Ops (East)" },
    update: {},
    create: { name: "Field Ops (East)", status: "INACTIVE", parentId: fieldOps.id },
  });

  // ---- Categories -------------------------------------------------------
  const electronics = await prisma.assetCategory.upsert({
    where: { name: "Electronics" },
    update: {},
    create: { name: "Electronics", description: "Laptops, monitors, projectors, cameras", customFields: { warrantyMonths: 12 } },
  });
  const furniture = await prisma.assetCategory.upsert({
    where: { name: "Furniture" },
    update: {},
    create: { name: "Furniture", description: "Chairs, desks, cabinets" },
  });
  const vehicles = await prisma.assetCategory.upsert({
    where: { name: "Vehicles" },
    update: {},
    create: { name: "Vehicles", description: "Vans, forklifts and other fleet assets" },
  });
  const facilitiesCategory = await prisma.assetCategory.upsert({
    where: { name: "Facilities & Spaces" },
    update: {},
    create: { name: "Facilities & Spaces", description: "Bookable rooms and shared spaces" },
  });

  // ---- Users --------------------------------------------------------
  const upsertUser = (data) =>
    prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: { password: passwordHash, ...data },
    });

  const admin = await upsertUser({
    email: "admin@assetflow.test",
    username: "admin",
    name: "Admin User",
    role: "ADMIN",
  });
  const assetManager = await upsertUser({
    email: "vikram.singh@assetflow.test",
    username: "vikram.singh",
    name: "Vikram Singh",
    role: "ASSET_MANAGER",
  });
  const aditiRao = await upsertUser({
    email: "aditi.rao@assetflow.test",
    username: "aditi.rao",
    name: "Aditi Rao",
    role: "DEPARTMENT_HEAD",
    departmentId: engineering.id,
  });
  const rohanMehta = await upsertUser({
    email: "rohan.mehta@assetflow.test",
    username: "rohan.mehta",
    name: "Rohan Mehta",
    role: "DEPARTMENT_HEAD",
    departmentId: facilities.id,
  });
  const sanaIqbal = await upsertUser({
    email: "sana.iqbal@assetflow.test",
    username: "sana.iqbal",
    name: "Sana Iqbal",
    role: "DEPARTMENT_HEAD",
    departmentId: fieldOpsEast.id,
  });

  await prisma.department.update({ where: { id: engineering.id }, data: { headId: aditiRao.id } });
  await prisma.department.update({ where: { id: facilities.id }, data: { headId: rohanMehta.id } });
  await prisma.department.update({ where: { id: fieldOpsEast.id }, data: { headId: sanaIqbal.id } });

  const priyaShah = await upsertUser({
    email: "priya.shah@assetflow.test",
    username: "priya.shah",
    name: "Priya Shah",
    role: "EMPLOYEE",
    departmentId: engineering.id,
  });
  const arjunNair = await upsertUser({
    email: "arjun.nair@assetflow.test",
    username: "arjun.nair",
    name: "Arjun Nair",
    role: "EMPLOYEE",
    departmentId: engineering.id,
  });
  const rajMalhotra = await upsertUser({
    email: "raj.malhotra@assetflow.test",
    username: "raj.malhotra",
    name: "Raj Malhotra",
    role: "EMPLOYEE",
    departmentId: engineering.id,
  });
  const nehaKapoor = await upsertUser({
    email: "neha.kapoor@assetflow.test",
    username: "neha.kapoor",
    name: "Neha Kapoor",
    role: "EMPLOYEE",
    departmentId: engineering.id,
  });
  const karanVerma = await upsertUser({
    email: "karan.verma@assetflow.test",
    username: "karan.verma",
    name: "Karan Verma",
    role: "EMPLOYEE",
    departmentId: facilities.id,
  });
  const meeraJoshi = await upsertUser({
    email: "meera.joshi@assetflow.test",
    username: "meera.joshi",
    name: "Meera Joshi",
    role: "EMPLOYEE",
    departmentId: fieldOpsEast.id,
  });

  // ---- Assets -----------------------------------------------------------
  const upsertAsset = (data) =>
    prisma.asset.upsert({
      where: { assetTag: data.assetTag },
      update: {},
      create: data,
    });

  const af0114 = await upsertAsset({
    assetTag: "AF-0114",
    name: "Dell Laptop",
    categoryId: electronics.id,
    serialNumber: "SN-0114-DL",
    acquisitionDate: daysAgo(400),
    acquisitionCost: 82000,
    condition: "GOOD",
    status: "ALLOCATED",
    location: "Bengaluru",
    departmentId: engineering.id,
    isBookable: false,
  });
  const af0012 = await upsertAsset({
    assetTag: "AF-0012",
    name: "Dell Laptop",
    categoryId: electronics.id,
    serialNumber: "SN-0012-DL",
    acquisitionDate: daysAgo(500),
    acquisitionCost: 78000,
    condition: "GOOD",
    status: "ALLOCATED",
    location: "Bengaluru",
    departmentId: facilities.id,
    isBookable: false,
  });
  const af0062 = await upsertAsset({
    assetTag: "AF-0062",
    name: "Projector",
    categoryId: electronics.id,
    serialNumber: "SN-0062-PJ",
    acquisitionDate: daysAgo(600),
    acquisitionCost: 45000,
    condition: "FAIR",
    status: "UNDER_MAINTENANCE",
    location: "HQ Floor 2",
    departmentId: engineering.id,
    isBookable: false,
  });
  const af0201 = await upsertAsset({
    assetTag: "AF-0201",
    name: "Office Chair",
    categoryId: furniture.id,
    serialNumber: "SN-0201-CH",
    acquisitionDate: daysAgo(200),
    acquisitionCost: 6500,
    condition: "GOOD",
    status: "AVAILABLE",
    location: "Warehouse",
    isBookable: false,
  });
  const roomB2 = await upsertAsset({
    assetTag: "AF-0500",
    name: "Conference Room B2",
    categoryId: facilitiesCategory.id,
    condition: "GOOD",
    status: "AVAILABLE",
    location: "HQ Floor 3",
    isBookable: true,
  });
  const af0031 = await upsertAsset({
    assetTag: "AF-0031",
    name: "AC Unit",
    categoryId: electronics.id,
    serialNumber: "SN-0031-AC",
    acquisitionDate: daysAgo(700),
    acquisitionCost: 32000,
    condition: "FAIR",
    status: "UNDER_MAINTENANCE",
    location: "HQ Floor 1",
    departmentId: facilities.id,
    isBookable: false,
  });
  const af0078 = await upsertAsset({
    assetTag: "AF-0078",
    name: "Forklift",
    categoryId: vehicles.id,
    serialNumber: "SN-0078-FL",
    acquisitionDate: daysAgo(900),
    acquisitionCost: 210000,
    condition: "FAIR",
    status: "UNDER_MAINTENANCE",
    location: "Warehouse",
    departmentId: fieldOpsEast.id,
    isBookable: false,
  });
  const af0897 = await upsertAsset({
    assetTag: "AF-0897",
    name: "Printer",
    categoryId: electronics.id,
    serialNumber: "SN-0897-PR",
    acquisitionDate: daysAgo(300),
    acquisitionCost: 18000,
    condition: "FAIR",
    status: "UNDER_MAINTENANCE",
    location: "HQ Floor 2",
    departmentId: engineering.id,
    isBookable: false,
  });
  const af0873 = await upsertAsset({
    assetTag: "AF-0873",
    name: "Office Chair",
    categoryId: furniture.id,
    serialNumber: "SN-0873-CH",
    acquisitionDate: daysAgo(250),
    acquisitionCost: 7000,
    condition: "GOOD",
    status: "AVAILABLE",
    location: "HQ Floor 2",
    departmentId: engineering.id,
    isBookable: false,
  });
  const af0003 = await upsertAsset({
    assetTag: "AF-0003",
    name: "Dell Laptop",
    categoryId: electronics.id,
    serialNumber: "SN-0003-DL",
    acquisitionDate: daysAgo(450),
    acquisitionCost: 80000,
    condition: "GOOD",
    status: "ALLOCATED",
    location: "Desk E12",
    departmentId: engineering.id,
    isBookable: false,
  });
  const af9921 = await upsertAsset({
    assetTag: "AF-9921",
    name: "Office Chair",
    categoryId: furniture.id,
    serialNumber: "SN-9921-CH",
    acquisitionDate: daysAgo(320),
    acquisitionCost: 6800,
    condition: "GOOD",
    status: "ALLOCATED",
    location: "Desk E14",
    departmentId: engineering.id,
    isBookable: false,
  });
  const af9838 = await upsertAsset({
    assetTag: "AF-9838",
    name: "Monitor",
    categoryId: electronics.id,
    serialNumber: "SN-9838-MN",
    acquisitionDate: daysAgo(380),
    acquisitionCost: 15000,
    condition: "GOOD",
    status: "ALLOCATED",
    location: "Desk E15",
    departmentId: engineering.id,
    isBookable: false,
  });
  const af0335 = await upsertAsset({
    assetTag: "AF-0335",
    name: "Projector",
    categoryId: electronics.id,
    serialNumber: "SN-0335-PJ",
    acquisitionDate: daysAgo(340),
    acquisitionCost: 42000,
    condition: "GOOD",
    status: "ALLOCATED",
    location: "HQ Floor 2",
    departmentId: fieldOpsEast.id,
    isBookable: true,
  });
  const af0343 = await upsertAsset({
    assetTag: "AF-0343",
    name: "Delivery Van",
    categoryId: vehicles.id,
    serialNumber: "SN-0343-VN",
    acquisitionDate: daysAgo(600),
    acquisitionCost: 950000,
    condition: "GOOD",
    status: "AVAILABLE",
    location: "Warehouse",
    departmentId: fieldOpsEast.id,
    isBookable: true,
  });
  const af0301 = await upsertAsset({
    assetTag: "AF-0301",
    name: "Camera",
    categoryId: electronics.id,
    serialNumber: "SN-0301-CM",
    acquisitionDate: daysAgo(500),
    acquisitionCost: 55000,
    condition: "GOOD",
    status: "AVAILABLE",
    location: "HQ Floor 2",
    isBookable: true,
    updatedAt: daysAgo(65),
  });
  const af0410 = await upsertAsset({
    assetTag: "AF-0410",
    name: "Office Chair",
    categoryId: furniture.id,
    serialNumber: "SN-0410-CH",
    acquisitionDate: daysAgo(280),
    acquisitionCost: 6200,
    condition: "GOOD",
    status: "AVAILABLE",
    location: "Warehouse",
    updatedAt: daysAgo(45),
  });
  const af0087 = await upsertAsset({
    assetTag: "AF-0087",
    name: "Forklift",
    categoryId: vehicles.id,
    serialNumber: "SN-0087-FL",
    acquisitionDate: daysAgo(1200),
    acquisitionCost: 195000,
    condition: "FAIR",
    status: "AVAILABLE",
    location: "Warehouse",
    departmentId: fieldOpsEast.id,
    isBookable: false,
  });
  const af0020 = await upsertAsset({
    assetTag: "AF-0020",
    name: "Dell Laptop",
    categoryId: electronics.id,
    serialNumber: "SN-0020-DL",
    acquisitionDate: yearsAgo(4),
    acquisitionCost: 70000,
    condition: "POOR",
    status: "AVAILABLE",
    location: "Warehouse",
  });

  // ---- Transactional demo data (allocations/transfers/bookings/etc) -----
  // Not upserted (no natural unique key) - guard so re-running the seed
  // against an already-seeded database doesn't duplicate these rows.
  const alreadySeeded = await prisma.auditCycle.findFirst({
    where: { title: "Q3 audit: Engineering dept" },
  });

  if (alreadySeeded) {
    console.log("Transactional demo data already present, skipping.");
    console.log(`Admin login: admin@assetflow.test / ${SEED_PASSWORD}`);
    return;
  }

  // ---- Allocations (active + history) -----------------------------------
  await prisma.allocation.create({
    data: {
      assetId: af0114.id,
      userId: priyaShah.id,
      departmentId: engineering.id,
      expectedReturnDate: daysFromNow(45),
      allocatedAt: daysAgo(122), // "Mar 12" style history entry
      status: "ACTIVE",
    },
  });
  await prisma.allocation.create({
    data: {
      assetId: af0114.id,
      userId: arjunNair.id,
      departmentId: engineering.id,
      allocatedAt: daysAgo(300),
      returnedAt: daysAgo(125), // "Jan 09" style history entry
      returnCondition: "GOOD",
      checkInNotes: "Returned in good condition",
      status: "RETURNED",
    },
  });

  await prisma.allocation.create({
    data: {
      assetId: af0012.id,
      userId: karanVerma.id,
      departmentId: facilities.id,
      expectedReturnDate: daysAgo(3), // overdue
      allocatedAt: daysAgo(90),
      status: "ACTIVE",
    },
  });
  await prisma.allocation.create({
    data: { assetId: af0335.id, userId: meeraJoshi.id, departmentId: fieldOpsEast.id, allocatedAt: daysAgo(60), status: "ACTIVE" },
  });
  await prisma.allocation.create({
    data: { assetId: af0003.id, userId: nehaKapoor.id, departmentId: engineering.id, allocatedAt: daysAgo(200), status: "ACTIVE" },
  });
  await prisma.allocation.create({
    data: { assetId: af9921.id, userId: rajMalhotra.id, departmentId: engineering.id, allocatedAt: daysAgo(150), status: "ACTIVE" },
  });
  await prisma.allocation.create({
    data: { assetId: af9838.id, userId: nehaKapoor.id, departmentId: engineering.id, allocatedAt: daysAgo(180), status: "ACTIVE" },
  });

  // ---- Pending transfer requests -----------------------------------------
  await prisma.transferRequest.create({
    data: {
      assetId: af0114.id,
      fromUserId: priyaShah.id,
      toUserId: rajMalhotra.id,
      reason: "Priya is relocating to the Facilities support project next quarter",
      status: "REQUESTED",
    },
  });
  await prisma.transferRequest.create({
    data: {
      assetId: af0012.id,
      fromUserId: karanVerma.id,
      toUserId: nehaKapoor.id,
      reason: "Department reorg, reassigning laptop to new hire",
      status: "REQUESTED",
    },
  });
  await prisma.transferRequest.create({
    data: {
      assetId: af0335.id,
      fromUserId: meeraJoshi.id,
      toUserId: karanVerma.id,
      reason: "Projector relocating to the new Facilities floor",
      status: "REQUESTED",
    },
  });

  // ---- Bookings: Room B2 9:00-10:00 today (the overlap-demo booking) -----
  await prisma.booking.create({
    data: {
      assetId: roomB2.id,
      userId: rohanMehta.id,
      startTime: todayAt(9, 0),
      endTime: todayAt(10, 0),
      purpose: "Procurement Team sync",
      status: "UPCOMING",
    },
  });
  await prisma.booking.create({
    data: {
      assetId: roomB2.id,
      userId: aditiRao.id,
      startTime: todayAt(14, 0),
      endTime: todayAt(15, 0),
      purpose: "Engineering standup",
      status: "UPCOMING",
    },
  });
  await prisma.booking.create({
    data: { assetId: af0343.id, userId: meeraJoshi.id, startTime: daysAgo(2), endTime: daysAgo(2), purpose: "Client delivery run", status: "COMPLETED" },
  });

  // ---- Maintenance requests (Kanban demo) --------------------------------
  await prisma.maintenanceRequest.create({
    data: {
      assetId: af0062.id,
      requesterId: priyaShah.id,
      description: "Projector bulb is not turning on during presentations",
      priority: "MEDIUM",
      status: "APPROVED",
    },
  });
  await prisma.maintenanceRequest.create({
    data: {
      assetId: af0031.id,
      requesterId: rohanMehta.id,
      description: "AC unit noisy compressor, needs inspection",
      priority: "HIGH",
      status: "APPROVED",
    },
  });
  await prisma.maintenanceRequest.create({
    data: {
      assetId: af0078.id,
      requesterId: meeraJoshi.id,
      description: "Forklift hydraulic lift is slow to respond",
      priority: "HIGH",
      technicianName: "R. Varma",
      status: "TECHNICIAN_ASSIGNED",
    },
  });
  await prisma.maintenanceRequest.create({
    data: {
      assetId: af0897.id,
      requesterId: nehaKapoor.id,
      description: "Printer jam on tray 2, parts ordered",
      priority: "MEDIUM",
      technicianName: "Facilities Vendor",
      status: "IN_PROGRESS",
    },
  });
  await prisma.maintenanceRequest.create({
    data: {
      assetId: af0873.id,
      requesterId: karanVerma.id,
      description: "Chair armrest repair",
      priority: "LOW",
      technicianName: "Facilities Vendor",
      status: "RESOLVED",
      resolvedAt: daysAgo(5),
    },
  });

  // ---- Audit cycle: Q3 audit - Engineering dept --------------------------
  const q3Audit = await prisma.auditCycle.create({
    data: {
      title: "Q3 audit: Engineering dept",
      scopeDeptId: engineering.id,
      startDate: daysAgo(11),
      endDate: daysFromNow(3),
      status: "OPEN",
    },
  });
  await prisma.auditAssignment.createMany({
    data: [
      { cycleId: q3Audit.id, auditorId: aditiRao.id },
      { cycleId: q3Audit.id, auditorId: sanaIqbal.id },
    ],
  });
  await prisma.auditItem.createMany({
    data: [
      {
        cycleId: q3Audit.id,
        assetId: af0003.id,
        expectedLocation: "Desk E12",
        result: "VERIFIED",
        verifiedById: aditiRao.id,
        verifiedAt: daysAgo(2),
      },
      {
        cycleId: q3Audit.id,
        assetId: af9921.id,
        expectedLocation: "Desk E14",
        result: "MISSING",
        notes: "Not found at expected desk",
        verifiedById: sanaIqbal.id,
        verifiedAt: daysAgo(1),
      },
      {
        cycleId: q3Audit.id,
        assetId: af9838.id,
        expectedLocation: "Desk E15",
        result: "DAMAGED",
        notes: "Cracked screen bezel",
        verifiedById: sanaIqbal.id,
        verifiedAt: daysAgo(1),
      },
    ],
  });

  // ---- Notifications ------------------------------------------------------
  await prisma.notification.createMany({
    data: [
      {
        userId: priyaShah.id,
        type: "ASSET_ASSIGNED",
        title: "Laptop AF-0114 assigned to you",
        body: "Dell Laptop AF-0114 has been allocated to you (Engineering).",
        createdAt: daysAgo(0.03), // ~2m ago
      },
      {
        userId: assetManager.id,
        type: "MAINTENANCE_APPROVED",
        title: "Maintenance request AF-0062 approved",
        body: "Projector AF-0062 moved to Under Maintenance.",
        createdAt: daysAgo(0.0125), // ~18m ago
      },
      {
        userId: rohanMehta.id,
        type: "BOOKING_CONFIRMED",
        title: "Booking confirmed: Room B2, 2:00 to 3:00 PM",
        body: "Conference Room B2 booking confirmed.",
        createdAt: daysAgo(0.04),
      },
      {
        userId: karanVerma.id,
        type: "TRANSFER_APPROVED",
        title: "Transfer approved: AF-0033 to Facilities dept",
        body: "Transfer request approved.",
        createdAt: daysAgo(0.06),
      },
      {
        userId: karanVerma.id,
        type: "OVERDUE_RETURN",
        title: "Overdue return: AF-0012 was due 3 days ago",
        body: "Please return or request an extension.",
        isRead: false,
        createdAt: daysAgo(1),
      },
      {
        userId: admin.id,
        type: "AUDIT_DISCREPANCY",
        title: "Audit discrepancy flagged: AF-9838 damaged",
        body: "Q3 audit: Engineering dept flagged a damaged asset.",
        createdAt: daysAgo(2),
      },
    ],
    skipDuplicates: true,
  });

  // ---- Activity log (recent activity feed) --------------------------------
  await prisma.activityLog.createMany({
    data: [
      { actorId: assetManager.id, action: "ALLOCATED", entity: "Asset", entityId: af0114.id, details: { holder: "Priya Shah", department: "Engineering" }, createdAt: daysAgo(0.03) },
      { actorId: rohanMehta.id, action: "BOOKING_CONFIRMED", entity: "Booking", entityId: roomB2.id, details: { slot: "2:00 to 3:00 PM" }, createdAt: daysAgo(0.04) },
      { actorId: assetManager.id, action: "MAINTENANCE_RESOLVED", entity: "MaintenanceRequest", entityId: af0873.id, details: { asset: "AF-0873" }, createdAt: daysAgo(5) },
    ],
  });

  console.log("Seed complete.");
  console.log(`All seeded users share the password: ${SEED_PASSWORD}`);
  console.log(`Admin login: admin@assetflow.test / ${SEED_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
