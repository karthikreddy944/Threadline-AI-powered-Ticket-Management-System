import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Inbox, UserX, AlertTriangle, Loader2, CheckCircle2, AlertCircle, GitBranch, Sparkle, TriangleAlert } from "lucide-react";
import Topbar from "../../components/Topbar";
import Stat from "../../components/Stat";
import TicketRow from "../../components/TicketRow";
import LoadingState from "../../components/LoadingState";
import EmptyState from "../../components/EmptyState";
import { getTicketStats, getAllTickets } from "../../lib/api";
import { adaptTicket } from "../../lib/adapters";

const priorityRank = { Critical: 0, High: 1, Medium: 2, Low: 3 };

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [statsData, ticketsData] = await Promise.all([getTicketStats(), getAllTickets({ limit: 100 })]);
        if (cancelled) return;
        setStats(statsData);
        setTickets(ticketsData.tickets.map(adaptTicket));
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const timer = setInterval(load, 5000);
    window.addEventListener("focus", load);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("focus", load);
    };
  }, []);

  const needsAttention = [...tickets]
    .filter((t) => t.status !== "Resolved")
    .sort((a, b) => {
      return priorityRank[a.priority] - priorityRank[b.priority] || new Date(b.created) - new Date(a.created);
    });

  return (
    <>
      <Topbar eyebrow="Overview" title="Admin dashboard" />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {error ? (
          <EmptyState icon={AlertCircle} title="Couldn't load the dashboard" description={error} />
        ) : loading ? (
          <LoadingState rows={5} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Stat label="Total tickets" value={stats.total} icon={Inbox} tone="neutral" />
              <Stat label="Unassigned" value={stats.unassigned} icon={UserX} tone="warning" />
              <Stat label="High priority" value={stats.highPriority} icon={AlertTriangle} tone="danger" />
              <Stat label="In progress" value={stats.inProgress} icon={Loader2} tone="accent" />
              <Stat label="Resolved" value={stats.resolved} icon={CheckCircle2} tone="success" />
              <Link to="/admin/queue?escalated=true" className="block">
                <Stat label="Escalated tickets" value={stats.escalated || 0} icon={TriangleAlert} tone="warning" />
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-line bg-surface p-4"><div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-ink-faint"><GitBranch className="size-3.5" /> Repository-linked tickets</div><div className="mt-2 text-[22px] font-semibold text-ink">{tickets.filter((t) => t.githubRepo).length}</div><p className="mt-1 text-[11.5px] text-ink-faint">Tickets linked to a organization GitHub repository.</p></div>
              <div className="rounded-lg border border-accent-line bg-accent-soft/40 p-4"><div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-accent"><Sparkle className="size-3.5" /> AI investigations</div><div className="mt-2 text-[22px] font-semibold text-ink">{tickets.filter((t) => t.repoAnalysis).length}</div><p className="mt-1 text-[11.5px] text-ink-faint">Repository investigations already completed.</p></div>
            </div>

            <div className="mt-6">
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-ink">Needs attention</h2>
                <Link to="/admin/queue" className="text-[12.5px] font-medium text-accent hover:underline">
                  Open full queue
                </Link>
              </div>
              {needsAttention.length === 0 ? (
                <EmptyState icon={Inbox} title="Nothing needs attention" description="All caught up." />
              ) : (
                <div className="rounded-lg border border-line bg-surface">
                  {needsAttention.slice(0, 6).map((t) => (
                    <TicketRow key={t.id} ticket={t} basePath="/admin/tickets" />
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
