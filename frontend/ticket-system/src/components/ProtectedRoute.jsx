import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingState from "./LoadingState";

/**
 * Wrap a group of routes with <ProtectedRoute role="client" /> or
 * role="admin". Unauthenticated users are sent to the matching login
 * page; logged-in users of the wrong role are sent to their own home.
 */
export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas px-6">
        <div className="w-full max-w-sm">
          <LoadingState rows={3} />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={role === "admin" ? "/admin/login" : role === "employee" ? "/employee/login" : "/login"} replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === "admin" ? "/admin" : user.role === "employee" ? "/employee" : "/app"} replace />;
  }

  return <Outlet />;
}
