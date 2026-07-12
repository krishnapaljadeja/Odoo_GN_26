import React, { useState } from "react";
import { DashboardLayout, PageHeader } from "../../components/layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AllocateTransferTab from "./AllocateTransferTab";
import ActiveAllocationsTab from "./ActiveAllocationsTab";
import PendingTransfersTab from "./PendingTransfersTab";

const Allocations = () => {
  const [tab, setTab] = useState("allocate");

  return (
    <DashboardLayout>
      <PageHeader title="Allocation & Transfer" description="Allocate assets, handle transfer requests, and process returns." />

      <Tabs value={tab} onValueChange={setTab} className="grid gap-4">
        <TabsList>
          <TabsTrigger value="allocate">Allocate &amp; Transfer</TabsTrigger>
          <TabsTrigger value="active">Active Allocations</TabsTrigger>
          <TabsTrigger value="pending">Pending Transfers</TabsTrigger>
        </TabsList>

        <TabsContent value="allocate">
          <AllocateTransferTab />
        </TabsContent>
        <TabsContent value="active">
          <ActiveAllocationsTab />
        </TabsContent>
        <TabsContent value="pending">
          <PendingTransfersTab />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Allocations;
