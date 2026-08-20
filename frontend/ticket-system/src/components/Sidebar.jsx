import { NavLink } from "react-router-dom";
import { GitBranch, LogOut, X } from "lucide-react";

export default function Sidebar({ items, user, footerHref, homeHref, onLogout, mobileOpen = false, onClose }) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink/30 backdrop-blur-[1px] transition-opacity lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-[232px] shrink-0 -translate-x-full flex-col border-r border-line bg-surface transition-transform duration-200 ease-out lg:static lg:w-[216px] lg:translate-x-0 ${
          mobileOpen ? "translate-x-0 shadow-lg" : ""
        }`}
      >
        <div className="flex h-14 items-center gap-2 border-b border-line px-4">
          <div className="flex size-6 items-center justify-center rounded-md bg-accent text-ink-on-accent">
            <GitBranch className="size-3.5" strokeWidth={2.5} />
          </div>
          <span className="font-display text-[14px] font-semibold tracking-tight text-ink">Threadline</span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="ml-auto flex size-7 items-center justify-center rounded-md text-ink-faint hover:bg-surface-alt hover:text-ink lg:hidden"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 py-3">
          <ul className="flex flex-col gap-0.5">
            {items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] font-medium transition-colors ${
                      isActive
                        ? "bg-accent-soft text-accent"
                        : "text-ink-muted hover:bg-surface-alt hover:text-ink"
                    }`
                  }
                >
                  <item.icon className="size-[15px]" strokeWidth={2} />
                  {item.label}
                  {item.count != null && (
                    <span className="ml-auto font-tabular text-[11px] text-ink-faint">{item.count}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1 border-t border-line px-2 py-2">
          <NavLink
            to={footerHref}
            onClick={onClose}
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-surface-alt"
          >
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-[11px] font-semibold text-ink">
              {user.initials}
            </div>
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-[12.5px] font-medium text-ink">{user.name}</span>
              <span className="truncate text-[11px] text-ink-faint">{user.role}</span>
            </div>
          </NavLink>
          {onLogout && (
            <button
              onClick={onLogout}
              title="Log out"
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-ink-faint hover:bg-surface-alt hover:text-ink"
            >
              <LogOut className="size-[15px]" strokeWidth={2} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
