import React from "react";
import { useSelector } from "react-redux";
import { DashboardLayout, PageHeader } from "../../components/layout";

const Dashboard = () => {
  const auth = useSelector((state) => state.auth);

  return (
    <DashboardLayout>
      <PageHeader
        title="Dashboard"
        description={`Welcome, ${auth.user.name || auth.user.username} (${auth.user.role}). KPI cards, quick actions and recent activity land here in M8.`}
      />
    </DashboardLayout>
  );
};

export default Dashboard;
