import React from "react";
import { Badge } from "@/components/ui";

// Plan section 9: Available=green, Allocated=blue, Reserved=purple,
// Under Maintenance=amber, Lost=red, Retired=zinc, Disposed=dark zinc.
const STATUS_VARIANT = {
  AVAILABLE: "green",
  ALLOCATED: "blue",
  RESERVED: "purple",
  UNDER_MAINTENANCE: "amber",
  LOST: "red",
  RETIRED: "zinc",
  DISPOSED: "zinc",
};

export const STATUS_LABEL = {
  AVAILABLE: "Available",
  ALLOCATED: "Allocated",
  RESERVED: "Reserved",
  UNDER_MAINTENANCE: "Under Maintenance",
  LOST: "Lost",
  RETIRED: "Retired",
  DISPOSED: "Disposed",
};

export const AssetStatusBadge = ({ status }) => (
  <Badge variant={STATUS_VARIANT[status] || "default"}>{STATUS_LABEL[status] || status}</Badge>
);

export const CONDITION_LABEL = {
  NEW: "New",
  GOOD: "Good",
  FAIR: "Fair",
  POOR: "Poor",
  DAMAGED: "Damaged",
};
