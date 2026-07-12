import React from "react";
import { cn } from "@/lib/utils";

export const Skeleton = ({ className }) => <div className={cn("animate-pulse rounded-md bg-zinc-800", className)} />;

export default Skeleton;
