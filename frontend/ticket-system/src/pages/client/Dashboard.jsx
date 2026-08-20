import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FolderOpen, Loader2, CheckCircle2, AlertTriangle, PlusCircle, AlertCircle } from "lucide-react";
import Topbar from "../../components/Topbar";
import Stat from "../../components/Stat";
import Button from "../../components/Button";
import TicketRow from "../../components/TicketRow";
import LoadingState from "../../components/LoadingState";
import EmptyState from "../../components/EmptyState";
import { getMyTickets } from "../../lib/api";
import GitRepositoryCard from "../../components/GitRepositoryCard";
import { adaptTicket } from "../../lib/adapters";
import { useAuth } from "../../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getMyTickets()
      .then((data) => {
        if (cancelled) return;
        setTickets(data.map((t) => adaptTicket(t, { requesterFallback: user?.name })));
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user?.name]);

  const open = tickets.filter((t) => t.status !== "Resolved").length;
  const inProgress = tickets.filter((t) => t.status === "In Progress").length;
  const resolved = tickets.filter((t) => t.status === "Resolved").length;
  const highPriority = tickets.filter((t) => t.priority === "High" || t.priority === "Critical").length;

  const recent = [...tickets].sort((a, b) => new Date(b.updated) - new Date(a.updated));

  return (
    <>
      <Topbar
        eyebrow="Overview"
        title={`Welcome back, ${(user?.name || "").split(" ")[0]}`}
        actions={
          <Button as={Link} to="/app/tickets/new" variant="primary" icon={PlusCircle}>
            Create ticket
          </Button>
        }
      />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {error ? (
          <EmptyState icon={AlertCircle} title="Couldn't load your tickets" description={error} />
        ) : loading ? (
          <LoadingState rows={4} />
        ) : (
          <>
            <GitRepositoryCard />

            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat label="Open tickets" value={open} icon={FolderOpen} tone="accent" />
              <Stat label="In progress" value={inProgress} icon={Loader2} tone="warning" />
              <Stat label="Resolved" value={resolved} icon={CheckCircle2} tone="success" />
              <Stat label="High priority" value={highPriority} icon={AlertTriangle} tone="danger" />
            </div>

            <div className="mt-6">
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-ink">Recent tickets</h2>
                <Link to="/app/tickets" className="text-[12.5px] font-medium text-accent hover:underline">
                  View all
                </Link>
              </div>
              {recent.length === 0 ? (
                <EmptyState
                  icon={FolderOpen}
                  title="No tickets yet"
                  description="Create your first ticket to get started."
                />
              ) : (
                <div className="rounded-lg border border-line bg-surface">
                  {recent.slice(0, 5).map((t) => (
                    <TicketRow key={t.id} ticket={t} basePath="/app/tickets" />
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
