import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui";

const FormSection = ({ title, description, children }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

export default FormSection;
