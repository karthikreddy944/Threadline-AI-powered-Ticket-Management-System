import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Landing from "./pages/Landing";
import ClientLayout from "./layouts/ClientLayout";
import AdminLayout from "./layouts/AdminLayout";

import Login from "./pages/client/Login";
import Signup from "./pages/client/Signup";
import Dashboard from "./pages/client/Dashboard";
import CreateTicket from "./pages/client/CreateTicket";
import MyTickets from "./pages/client/MyTickets";
import TicketDetails from "./pages/client/TicketDetails";
import Notifications from "./pages/client/Notifications";
import Settings from "./pages/client/Settings";

import AdminLogin from "./pages/admin/AdminLogin";
import AdminSignup from "./pages/admin/AdminSignup";
import Clients from "./pages/admin/Clients";
import ClientDetails from "./pages/admin/ClientDetails";
import AdminDashboard from "./pages/admin/AdminDashboard";
import TicketQueue from "./pages/admin/TicketQueue";
import AdminTicketDetails from "./pages/admin/AdminTicketDetails";
import Analytics from "./pages/admin/Analytics";
import AdminNotifications from "./pages/admin/Notifications";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminRepository from "./pages/admin/AdminRepository";
import EmployeeLayout from "./layouts/EmployeeLayout";
import EmployeeDashboard from "./pages/employee/Dashboard";
import EmployeeTickets from "./pages/employee/Tickets";
import EmployeeTicketDetails from "./pages/employee/TicketDetails";
import EmployeeNotifications from "./pages/employee/Notifications";
import EmployeeAnalytics from "./pages/employee/Analytics";
import EmployeeSettings from "./pages/employee/Settings";
import EmployeeRepository from "./pages/employee/Repository";
import EmployeeLogin from "./pages/employee/Login";
import Employees from "./pages/admin/Employees";
import PlatformLayout from "./layouts/PlatformLayout";
import PlatformLogin from "./pages/platform/Login";
import PlatformDashboard from "./pages/platform/Dashboard";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />

          {/* Client auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/employee/login" element={<EmployeeLogin />} />
          <Route path="/platform/login" element={<PlatformLogin />} />

          {/* Client app — requires a logged-in client */}
          <Route element={<ProtectedRoute role="client" />}>
            <Route path="/app" element={<ClientLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="tickets" element={<MyTickets />} />
              <Route path="tickets/new" element={<CreateTicket />} />
              <Route path="tickets/:id" element={<TicketDetails />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Employee app — requires an assigned support employee */}
          <Route element={<ProtectedRoute role="employee" />}>
            <Route path="/employee" element={<EmployeeLayout />}>
              <Route index element={<EmployeeDashboard />} />
              <Route path="tickets" element={<EmployeeTickets />} />
              <Route path="tickets/:id" element={<EmployeeTicketDetails />} />
              <Route path="repository" element={<EmployeeRepository />} />
              <Route path="analytics" element={<EmployeeAnalytics />} />
              <Route path="notifications" element={<EmployeeNotifications />} />
              <Route path="settings" element={<EmployeeSettings />} />
            </Route>
          </Route>

          {/* Admin auth */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/signup" element={<AdminSignup />} />

          {/* Admin app — requires a logged-in admin */}
          <Route element={<ProtectedRoute role="admin" />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="queue" element={<TicketQueue />} />
              <Route path="repository" element={<AdminRepository />} />
              <Route path="tickets/:id" element={<AdminTicketDetails />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="employees" element={<Employees />} />
              <Route path="clients" element={<Clients />} />
              <Route path="clients/:id" element={<ClientDetails />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute role="superadmin" />}>
            <Route path="/platform" element={<PlatformLayout />}>
              <Route index element={<PlatformDashboard />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
