import React from "react";
import { Badge } from "@/components/ui";

export const STATUS_VARIANT = { ACTIVE: "green", INACTIVE: "zinc" };

export const StatusBadge = ({ status }) => <Badge variant={STATUS_VARIANT[status] || "zinc"}>{status}</Badge>;

export const ROLE_LABEL = {
  ADMIN: "Admin",
  ASSET_MANAGER: "Asset Manager",
  DEPARTMENT_HEAD: "Department Head",
  EMPLOYEE: "Employee",
};

const ROLE_VARIANT = {
  ADMIN: "purple",
  ASSET_MANAGER: "blue",
  DEPARTMENT_HEAD: "amber",
  EMPLOYEE: "default",
};

export const RoleBadge = ({ role }) => <Badge variant={ROLE_VARIANT[role] || "default"}>{ROLE_LABEL[role] || role}</Badge>;
