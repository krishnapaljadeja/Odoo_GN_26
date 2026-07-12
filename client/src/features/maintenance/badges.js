import React from "react";
import { Badge } from "@/components/ui/badge";

export const STATUS_LABEL = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  TECHNICIAN_ASSIGNED: "Technician assigned",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
};

export const PRIORITY_LABEL = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

const priorityVariant = {
  LOW: "zinc",
  MEDIUM: "blue",
  HIGH: "amber",
  CRITICAL: "red",
};

export const PriorityBadge = ({ priority }) =>
  React.createElement(Badge, { variant: priorityVariant[priority] || "default" }, PRIORITY_LABEL[priority] || priority);
