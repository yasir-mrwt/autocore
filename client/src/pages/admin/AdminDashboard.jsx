import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import AdminOrders from "./AdminOrders";
import AdminOverview from "./AdminOverview";
import AdminPlaceholderPage from "./AdminPlaceholderPage";
import AdminReports from "./AdminReports";

const AdminDashboard = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route index path="/" element={<Navigate to="overview" replace />} />
        <Route path="/overview" element={<AdminOverview />} />
        <Route path="/orders" element={<AdminOrders />} />
        <Route
          path="/pending"
          element={<AdminOrders title="Pending / New Orders" statusFilter={["PENDING_PAYMENT", "PAID", "PROCESSING"]} mode="pending" />}
        />
        <Route
          path="/ready"
          element={<AdminOrders title="Ready for Dispatch" statusFilter={["READY_TO_DISPATCH"]} mode="ready" />}
        />
        <Route
          path="/shipped"
          element={<AdminOrders title="Shipped Orders" statusFilter={["SHIPPED"]} mode="shipped" />}
        />
        <Route
          path="/confirmations"
          element={<AdminOrders title="Delivery Confirmation" statusFilter={["SHIPPED", "DELIVERED"]} mode="confirmations" />}
        />
        <Route path="/products" element={<AdminPlaceholderPage type="products" />} />
        <Route path="/customers" element={<AdminPlaceholderPage type="customers" />} />
        <Route path="/analytics" element={<AdminReports />} />
        <Route path="/settings" element={<AdminPlaceholderPage type="settings" />} />
        <Route path="*" element={<Navigate to="overview" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default AdminDashboard;
