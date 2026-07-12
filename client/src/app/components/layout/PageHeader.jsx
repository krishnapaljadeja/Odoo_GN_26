import React from "react";

const PageHeader = ({ title, description, actions }) => (
  <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-950">{title}</h1>
      {description && <p className="mt-2 max-w-3xl text-sm text-slate-600">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export default PageHeader;
