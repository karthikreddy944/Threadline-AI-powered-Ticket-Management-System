import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, Ticket, BarChart3, Bell, Settings, Menu, GitBranch } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../lib/adapters";
import { useUnreadNotificationCount } from "../lib/useNotifications";

export default function EmployeeLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount } = useUnreadNotificationCount();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: "/employee", label: "Dashboard", icon: LayoutGrid, end: true },
    { to: "/employee/tickets", label: "Related Tickets", icon: Ticket },
    { to: "/employee/repository", label: "Repository", icon: GitBranch },
    { to: "/employee/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/employee/notifications", label: "Notifications", icon: Bell, count: unreadCount || undefined },
    { to: "/employee/settings", label: "Settings", icon: Settings },
  ];

  const sidebarUser = {
    name: user?.name || "",
    role: user?.organization?.adminCode ? `Admin Code: ${user.organization.adminCode}` : (user?.department || "Employee"),
    initials: getInitials(user?.name),
  };

  const handleLogout = () => {
    logout();
    navigate("/employee/login", { replace: true });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <Sidebar
        items={navItems}
        user={sidebarUser}
        footerHref="/employee/settings"
        onLogout={handleLogout}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-line bg-surface px-3 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="flex size-8 items-center justify-center rounded-md text-ink-muted hover:bg-surface-alt hover:text-ink"
          >
            <Menu className="size-[18px]" strokeWidth={2} />
          </button>
          <div className="flex items-center gap-1.5">
            <div className="flex size-5 items-center justify-center rounded bg-accent text-ink-on-accent">
              <GitBranch className="size-3" strokeWidth={2.5} />
            </div>
            <span className="font-display text-[13px] font-semibold tracking-tight text-ink">Threadline</span>
          </div>
        </div>
        <Outlet key={location.pathname} />
      </div>
    </div>
  );
}
