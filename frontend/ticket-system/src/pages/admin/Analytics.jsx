import { useEffect, useMemo, useState } from "react";
import Topbar from "../../components/Topbar";
import Stat from "../../components/Stat";
import LoadingState from "../../components/LoadingState";
import EmptyState from "../../components/EmptyState";
import { getTicketAnalytics } from "../../lib/api";
import { AlertCircle, BarChart3, CheckCircle2, Clock3, Inbox, Users } from "lucide-react";

const formatMinutes = (minutes) => {
  if (minutes == null) return "—";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
};

const titleCase = (value) => value.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

export default function Analytics() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getTicketAnalytics(days)
      .then((result) => !cancelled && setData(result))
      .catch((err) => !cancelled && setError(err.message || "Couldn't load analytics."))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [days]);

  const categories = useMemo(() => Object.entries(data?.categories || {}).sort((a, b) => b[1] - a[1]), [data]);
  const priorities = useMemo(() => Object.entries(data?.priorities || {}).sort((a, b) => b[1] - a[1]), [data]);
  const statuses = useMemo(() => Object.entries(data?.status || {}).sort((a, b) => b[1] - a[1]), [data]);
  const maxCategory = Math.max(...categories.map(([, value]) => value), 1);
  const maxEmployee = Math.max(...(data?.employeeLoad || []).map((e) => e.active), 1);
  const maxDaily = Math.max(...(data?.daily || []).map((d) => d.count), 1);

  return (
    <>
      <Topbar eyebrow="Insights" title="Analytics" />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <p className="text-[12px] text-ink-faint">
            Live metrics calculated from tickets, activity, and employee assignments in MongoDB.
          </p>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="h-8 rounded-md border border-line-strong bg-surface px-2.5 text-[12px] text-ink outline-none"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

        {error ? (
          <EmptyState icon={AlertCircle} title="Couldn't load analytics" description={error} />
        ) : loading ? (
          <LoadingState rows={8} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat label={`Tickets (${days}d)`} value={data.summary.total} icon={Inbox} tone="neutral" />
              <Stat label="Resolution rate" value={`${data.summary.resolutionRate}%`} icon={CheckCircle2} tone="success" />
              <Stat label="Avg. first response" value={formatMinutes(data.summary.averageFirstResponseMinutes)} icon={Clock3} tone="accent" />
              <Stat label="High / critical" value={data.summary.highPriority} icon={BarChart3} tone="danger" />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-line bg-surface p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold text-ink">Tickets by category</h3>
                  <span className="text-[11px] text-ink-faint">Selected period</span>
                </div>
                {categories.length === 0 ? (
                  <p className="text-[12px] text-ink-faint">No tickets were created in this period.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {categories.map(([label, value]) => (
                      <div key={label} className="flex items-center gap-3">
                        <span className="w-28 shrink-0 text-[12px] text-ink-muted">{label}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                          <div className="h-full rounded-full bg-accent" style={{ width: `${(value / maxCategory) * 100}%` }} />
                        </div>
                        <span className="w-6 shrink-0 text-right font-tabular text-[12px] text-ink-faint">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-line bg-surface p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold text-ink">Current ticket status</h3>
                  <span className="text-[11px] text-ink-faint">Selected period</span>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {statuses.map(([label, value]) => (
                    <div key={label} className="rounded-md border border-line bg-surface-alt/60 p-3">
                      <div className="text-[11px] text-ink-faint">{label}</div>
                      <div className="mt-1 text-[18px] font-semibold text-ink">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-line bg-surface p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold text-ink">Tickets created over time</h3>
                  <span className="text-[11px] text-ink-faint">Daily</span>
                </div>
                {data.daily.length === 0 ? (
                  <p className="text-[12px] text-ink-faint">No ticket activity in this period.</p>
                ) : (
                  <div className="flex h-44 items-end gap-1.5 overflow-x-auto pb-5">
                    {data.daily.map((day) => (
                      <div key={day.date} className="flex h-full min-w-[18px] flex-1 flex-col items-center justify-end gap-1">
                        <span className="text-[9px] text-ink-faint">{day.count}</span>
                        <div className="w-full rounded-t bg-info" style={{ height: `${Math.max((day.count / maxDaily) * 115, 3)}px` }} />
                        <span className="text-[8px] text-ink-faint">{day.date.slice(5)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-line bg-surface p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold text-ink">Employee workload</h3>
                  <Users className="size-4 text-ink-faint" />
                </div>
                {data.employeeLoad.length === 0 ? (
                  <p className="text-[12px] text-ink-faint">No employee assignments yet.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {data.employeeLoad.map((employee) => (
                      <div key={employee.id}>
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <span className="truncate text-[12px] text-ink-muted">{employee.name}</span>
                          <span className="shrink-0 font-tabular text-[11px] text-ink-faint">
                            {employee.active} active / {employee.total} total
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-surface-sunken">
                          <div className="h-full rounded-full bg-info" style={{ width: `${(employee.active / maxEmployee) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-line bg-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[13px] font-semibold text-ink">Priority distribution</h3>
                <span className="text-[11px] text-ink-faint">{data.summary.total} tickets</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {["Critical", "High", "Medium", "Low"].map((priority) => (
                  <div key={priority} className="rounded-md border border-line bg-surface-alt/60 p-3">
                    <div className="text-[11px] text-ink-faint">{priority}</div>
                    <div className="mt-1 text-[20px] font-semibold text-ink">{data.priorities?.[priority] || 0}</div>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-4 text-[10.5px] text-ink-faint">
              First response is calculated from ticket creation to the first staff comment recorded in ticket activity. "—" means there is not enough real activity data yet.
            </p>
          </>
        )}
      </div>
    </>
  );
}
