import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Building2, Menu, ShieldCheck } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../lib/adapters";

export default function PlatformLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  return <div className="flex h-screen overflow-hidden bg-canvas"><Sidebar items={[{ to: "/platform", label: "Organization access", icon: Building2, end: true }]} user={{ name: user?.name || "Platform Operations", role: "Platform Owner", initials: getInitials(user?.name || "Platform Operations") }} footerHref="/platform" onLogout={() => { logout(); navigate("/platform/login", { replace: true }); }} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} /><div className="flex min-w-0 flex-1 flex-col"><div className="flex h-12 shrink-0 items-center gap-2 border-b border-line bg-surface px-3 lg:hidden"><button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="flex size-8 items-center justify-center rounded-md text-ink-muted hover:bg-surface-alt"><Menu className="size-[18px]" /></button><div className="flex items-center gap-1.5 text-[13px] font-semibold text-ink"><ShieldCheck className="size-4 text-accent" /> Platform Operations</div></div><Outlet key={location.pathname} /></div></div>;
}
