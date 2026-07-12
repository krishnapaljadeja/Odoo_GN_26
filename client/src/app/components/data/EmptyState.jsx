import React from "react";
import { Button } from "../ui";

const EmptyState = ({ title = "Nothing here yet", description, actionLabel, onAction }) => (
  <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
    <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
    {description && <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{description}</p>}
    {actionLabel && onAction && (
      <Button className="mt-5" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </div>
);

export default EmptyState;
