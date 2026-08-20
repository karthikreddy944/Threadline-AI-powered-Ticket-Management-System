import { useEffect, useMemo, useState } from "react";
import Topbar from "../../components/Topbar";
import Stat from "../../components/Stat";
import LoadingState from "../../components/LoadingState";
import EmptyState from "../../components/EmptyState";
import { getEmployeeTickets } from "../../lib/api";
import { AlertCircle, CheckCircle2, Clock3, Inbox, TrendingUp } from "lucide-react";

const RESOLVED_STATUSES = ["Resolved", "Closed"];

function formatHours(hours) {
  if (hours == null || Number.isNaN(hours)) return "—";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 48) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

export default function Analytics() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getEmployeeTickets()
      .then((data) => !cancelled && setTickets(data))
      .catch((err) => !cancelled && setError(err.message || "Couldn't load analytics."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const byStatus = {};
    const byPriority = {};
    let resolvedCount = 0;
    let totalResolutionHours = 0;
    const trend = {}; // date -> resolved count

    for (const t of tickets) {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;

      if (RESOLVED_STATUSES.includes(t.status)) {
        resolvedCount += 1;
        const created = new Date(t.createdAt).getTime();
        const updated = new Date(t.updatedAt).getTime();
        if (Number.isFinite(created) && Number.isFinite(updated) && updated >= created) {
          totalResolutionHours += (updated - created) / (1000 * 60 * 60);
        }
        const day = new Date(t.updatedAt).toISOString().slice(0, 10);
        trend[day] = (trend[day] || 0) + 1;
      }
    }

    const open = tickets.length - resolvedCount;
    const avgResolutionHours = resolvedCount ? totalResolutionHours / resolvedCount : null;
    const trendEntries = Object.entries(trend).sort(([a], [b]) => a.localeCompare(b)).slice(-14);

    return {
      total: tickets.length,
      open,
      resolvedCount,
      avgResolutionHours,
      byStatus,
      byPriority,
      trendEntries,
    };
  }, [tickets]);

  if (loading) {
    return (
      <>
        <Topbar eyebrow="Support workspace" title="My analytics" />
        <div className="flex-1 px-6 py-6">
          <LoadingState rows={6} />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Topbar eyebrow="Support workspace" title="My analytics" />
        <div className="flex-1 px-6 py-6">
          <EmptyState icon={AlertCircle} title="Couldn't load analytics" description={error} />
        </div>
      </>
    );
  }

  const maxTrend = Math.max(...stats.trendEntries.map(([, v]) => v), 1);
  const maxStatus = Math.max(...Object.values(stats.byStatus), 1);

  return (
    <>
      <Topbar eyebrow="Support workspace" title="My analytics" />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <p className="mb-5 text-[12px] text-ink-faint">
          Calculated from your assigned tickets — no hardcoded numbers.
        </p>

        {tickets.length === 0 ? (
          <EmptyState icon={Inbox} title="No assigned tickets yet" description="Once tickets are assigned to you, your analytics will appear here." />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Assigned tickets" value={stats.total} icon={Inbox} tone="neutral" />
              <Stat label="Open" value={stats.open} icon={Clock3} tone="accent" />
              <Stat label="Resolved" value={stats.resolvedCount} icon={CheckCircle2} tone="success" />
              <Stat label="Avg. resolution time" value={formatHours(stats.avgResolutionHours)} icon={TrendingUp} tone="neutral" />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-line bg-surface p-5">
                <h3 className="mb-4 text-[13px] font-semibold text-ink">Tickets by status</h3>
                <div className="flex flex-col gap-3">
                  {Object.entries(stats.byStatus).map(([label, value]) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 text-[12px] text-ink-muted">{label}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${(value / maxStatus) * 100}%` }} />
                      </div>
                      <span className="w-6 shrink-0 text-right font-tabular text-[12px] text-ink-faint">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-line bg-surface p-5">
                <h3 className="mb-4 text-[13px] font-semibold text-ink">Tickets by priority</h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {["Critical", "High", "Medium", "Low"].map((priority) => (
                    <div key={priority} className="rounded-md border border-line bg-surface-alt/60 p-3">
                      <div className="text-[11px] text-ink-faint">{priority}</div>
                      <div className="mt-1 text-[18px] font-semibold text-ink">{stats.byPriority[priority] || 0}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-line bg-surface p-5">
              <h3 className="mb-4 text-[13px] font-semibold text-ink">Resolution trend</h3>
              {stats.trendEntries.length === 0 ? (
                <p className="text-[12px] text-ink-faint">No resolved tickets yet.</p>
              ) : (
                <div className="flex h-40 items-end gap-1.5 overflow-x-auto pb-5">
                  {stats.trendEntries.map(([date, count]) => (
                    <div key={date} className="flex h-full min-w-[22px] flex-1 flex-col items-center justify-end gap-1">
                      <span className="text-[9px] text-ink-faint">{count}</span>
                      <div className="w-full rounded-t bg-info" style={{ height: `${Math.max((count / maxTrend) * 100, 3)}px` }} />
                      <span className="text-[8px] text-ink-faint">{date.slice(5)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
