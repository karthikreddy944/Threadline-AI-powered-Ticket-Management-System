import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, AlertTriangle, CheckCircle2, Clock3, Inbox, TriangleAlert } from "lucide-react";
import Topbar from "../../components/Topbar";
import Stat from "../../components/Stat";
import TicketRow from "../../components/TicketRow";
import TicketTable from "../../components/TicketTable";
import LoadingState from "../../components/LoadingState";
import EmptyState from "../../components/EmptyState";
import { getEmployeeStats, getEmployeeTickets } from "../../lib/api";
import { adaptTicket } from "../../lib/adapters";

const priorityRank = { Critical: 0, High: 1, Medium: 2, Low: 3 };

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setError("");
      try {
        const [statsData, ticketData] = await Promise.all([getEmployeeStats(), getEmployeeTickets()]);
        if (cancelled) return;
        setStats(statsData);
        setTickets(ticketData.map(adaptTicket));
      } catch (err) {
        if (!cancelled) setError(err.message || "Couldn't load the dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const timer = setInterval(load, 5000);
    window.addEventListener("focus", load);
    return () => { cancelled = true; clearInterval(timer); window.removeEventListener("focus", load); };
  }, []);

  const needsAttention = [...tickets]
    .filter((ticket) => !["Resolved", "Closed"].includes(ticket.status))
    .sort((a, b) => (priorityRank[a.priority] ?? 99) - (priorityRank[b.priority] ?? 99) || new Date(b.updated) - new Date(a.updated));

  return (
    <>
      <Topbar eyebrow="Overview" title="Employee dashboard" />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="w-full">
          {error ? <EmptyState icon={AlertCircle} title="Couldn't load the dashboard" description={error} /> : loading ? <LoadingState rows={6} /> : <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Stat label="Related tickets" value={stats.total} icon={Inbox} tone="neutral" />
              <Stat label="Active" value={stats.active} icon={Clock3} tone="accent" />
              <Stat label="Pending" value={stats.pending} icon={AlertTriangle} tone="warning" />
              <Stat label="Critical" value={stats.critical} icon={AlertTriangle} tone="danger" />
              <Stat label="Resolved" value={stats.resolved} icon={CheckCircle2} tone="success" />
              <Link to="/employee/tickets" className="block"><Stat label="Escalated" value={stats.escalated || 0} icon={TriangleAlert} tone="warning" /></Link>
            </div>

            <section className="mt-6">
              <div className="mb-2.5 flex items-center justify-between"><h2 className="text-[13px] font-semibold text-ink">Needs attention</h2><Link to="/employee/tickets" className="text-[12.5px] font-medium text-accent hover:underline">Open filtered queue</Link></div>
              {needsAttention.length ? <div className="rounded-lg border border-line bg-surface">{needsAttention.slice(0, 6).map((ticket) => <TicketRow key={ticket.id} ticket={ticket} basePath="/employee/tickets" />)}</div> : <EmptyState icon={CheckCircle2} title="Nothing needs attention" description="All your related tickets are resolved." />}
            </section>

            <section className="mt-6">
              <div className="mb-2.5 flex items-center justify-between"><h2 className="text-[13px] font-semibold text-ink">All related tickets</h2><Link to="/employee/tickets" className="text-[12.5px] font-medium text-accent hover:underline">Search and sort</Link></div>
              {tickets.length ? <TicketTable tickets={tickets} columns="full" basePath="/employee/tickets" /> : <EmptyState icon={Inbox} title="No tickets assigned" description="New assignments will appear here." />}
            </section>
          </>}
        </div>
      </div>
    </>
  );
}
