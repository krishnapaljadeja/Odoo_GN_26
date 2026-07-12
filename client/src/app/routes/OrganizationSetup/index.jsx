import React, { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { DashboardLayout, PageHeader } from "../../components/layout";
import { Button } from "../../components/ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import DepartmentsTab from "./DepartmentsTab";
import CategoriesTab from "./CategoriesTab";
import EmployeesTab from "./EmployeesTab";

const TAB_ADD_LABEL = {
  departments: "Add department",
  categories: "Add category",
};

const OrganizationSetup = () => {
  const [tab, setTab] = useState("departments");
  const addActionRef = useRef(null);

  const registerAddAction = (fn) => {
    addActionRef.current = fn;
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Organization Setup"
        description="Departments, categories and the employee directory - all master data other modules depend on."
        actions={
          tab !== "employees" && (
            <Button onClick={() => addActionRef.current?.()}>
              <Plus size={16} />
              {TAB_ADD_LABEL[tab]}
            </Button>
          )
        }
      />

      <Tabs value={tab} onValueChange={setTab} className="grid gap-4">
        <TabsList>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
        </TabsList>

        <TabsContent value="departments">
          <DepartmentsTab registerAddAction={registerAddAction} />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesTab registerAddAction={registerAddAction} />
        </TabsContent>
        <TabsContent value="employees">
          <EmployeesTab />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default OrganizationSetup;
