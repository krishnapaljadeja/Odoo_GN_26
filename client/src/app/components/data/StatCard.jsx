import React from "react";
import { Card, CardContent } from "../ui";

const StatCard = ({ label, value, hint, icon: Icon }) => (
  <Card>
    <CardContent className="flex items-start justify-between">
      <div>
        <p className="text-sm text-zinc-400">{label}</p>
        <p className="mt-2 text-2xl font-bold text-zinc-50">{value}</p>
        {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
      </div>
      {Icon && <Icon className="text-zinc-500" size={20} aria-hidden="true" />}
    </CardContent>
  </Card>
);

export default StatCard;
