import React from "react";
import { Badge } from "@/components/ui/badge";

export const RESULT_LABEL = {
  PENDING: "Pending",
  VERIFIED: "Verified",
  MISSING: "Missing",
  DAMAGED: "Damaged",
};

const resultVariant = {
  PENDING: "zinc",
  VERIFIED: "green",
  MISSING: "red",
  DAMAGED: "amber",
};

export const ResultBadge = ({ result }) => <Badge variant={resultVariant[result] || "default"}>{RESULT_LABEL[result] || result}</Badge>;

export const AuditStatusBadge = ({ status }) => <Badge variant={status === "OPEN" ? "green" : "zinc"}>{status}</Badge>;
