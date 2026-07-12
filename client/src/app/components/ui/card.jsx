import React from "react";
import { cn } from "../../../lib/utils";

export const Card = ({ as: Component = "div", className, ...props }) => (
  <Component className={cn("ui-card", className)} {...props} />
);

export const CardHeader = ({ className, ...props }) => (
  <div className={cn("ui-card__header", className)} {...props} />
);

export const CardTitle = ({ className, ...props }) => (
  <h2 className={cn("ui-card__title", className)} {...props} />
);

export const CardDescription = ({ className, ...props }) => (
  <p className={cn("ui-card__description", className)} {...props} />
);

export const CardContent = ({ className, ...props }) => (
  <div className={cn("ui-card__content", className)} {...props} />
);

export const CardFooter = ({ className, ...props }) => (
  <div className={cn("ui-card__footer", className)} {...props} />
);
