import { useNavigate } from "react-router-dom";
import {
  Bell,
  CircleDot,
  UserCheck,
  MessageSquare,
  Paperclip,
  Sparkle,
  AlertTriangle,
  CheckCheck,
  TriangleAlert,
} from "lucide-react";
import Topbar from "./Topbar";
import EmptyState from "./EmptyState";
import LoadingState from "./LoadingState";
import Button from "./Button";
import { useNotifications } from "../lib/useNotifications";
import { timeAgo } from "../lib/format";

const ICON_BY_TYPE = {
  ticket_created: { icon: CircleDot, tone: "text-accent bg-accent-soft" },
  ticket_assigned: { icon: UserCheck, tone: "text-info bg-info-soft" },
  status_changed: { icon: CircleDot, tone: "text-success bg-success-soft" },
  comment: { icon: MessageSquare, tone: "text-accent bg-accent-soft" },
  attachment_added: { icon: Paperclip, tone: "text-ink-muted bg-surface-alt" },
  repo_analysis_completed: { icon: Sparkle, tone: "text-accent bg-accent-soft" },
  repo_analysis_failed: { icon: AlertTriangle, tone: "text-danger bg-danger-soft" },
  ticket_escalated: { icon: TriangleAlert, tone: "text-warning bg-warning-soft" },
  ticket_reassigned: { icon: UserCheck, tone: "text-info bg-info-soft" },
};
const DEFAULT_ICON = { icon: Bell, tone: "text-ink-muted bg-surface-alt" };

/**
 * Real, persistent notifications backed by MongoDB (via useNotifications).
 * Shared by the client and admin Notifications pages — each only ever
 * sees notifications the backend has scoped to that user, so the same
 * component and the same `/api/notifications` endpoints work for both.
 */
export default function NotificationsPanel({ eyebrow, basePath }) {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, error, markRead, markAllRead } = useNotifications();

  const openNotification = (n) => {
    if (!n.read) markRead(n.id);
    if (n.ticketRouteId) navigate(`${basePath}/${n.ticketRouteId}`);
  };

  return (
    <>
      <Topbar
        eyebrow={eyebrow}
        title="Notifications"
        actions={
          unreadCount > 0 ? (
            <Button variant="secondary" size="sm" icon={CheckCheck} onClick={markAllRead}>
              Mark all as read
            </Button>
          ) : null
        }
      />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {error && (
          <div className="mx-auto mb-3 max-w-xl rounded-md border border-danger/30 bg-danger-soft/50 px-3 py-2 text-[12.5px] text-danger">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mx-auto max-w-xl">
            <LoadingState rows={4} />
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState icon={Bell} title="You're all caught up" description="New updates on your tickets will show up here." />
        ) : (
          <div className="mx-auto flex max-w-xl flex-col gap-2">
            {notifications.map((n) => {
              const { icon: Icon, tone } = ICON_BY_TYPE[n.type] || DEFAULT_ICON;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => openNotification(n)}
                  className={`flex items-start gap-3 rounded-lg border p-3.5 text-left transition-colors ${
                    n.read
                      ? "border-line bg-surface hover:bg-surface-alt/60"
                      : "border-accent-line bg-accent-soft/30 hover:bg-accent-soft/50"
                  } ${n.ticketRouteId ? "cursor-pointer" : "cursor-default"}`}
                >
                  <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${tone}`}>
                    <Icon className="size-4" strokeWidth={2} />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
                        {!n.read && <span className="size-1.5 shrink-0 rounded-full bg-accent" />}
                        {n.title}
                      </span>
                      <span className="shrink-0 text-[11px] text-ink-faint">{timeAgo(n.at)}</span>
                    </div>
                    <span className="text-[12.5px] text-ink-muted">{n.message}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
