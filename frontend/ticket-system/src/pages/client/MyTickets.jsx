import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, PlusCircle, AlertCircle } from "lucide-react";
import Topbar from "../../components/Topbar";
import Button from "../../components/Button";
import TicketTable from "../../components/TicketTable";
import LoadingState from "../../components/LoadingState";
import EmptyState from "../../components/EmptyState";
import { STATUSES } from "../../data/mockTickets";
import { getMyTickets } from "../../lib/api";
import { adaptTicket } from "../../lib/adapters";
import { useAuth } from "../../context/AuthContext";

const FILTERS = ["All", ...STATUSES];

export default function MyTickets() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
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

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const matchesFilter = filter === "All" || t.status === filter;
      const matchesQuery =
        !query ||
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        t.id.toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [tickets, filter, query]);

  return (
    <>
      <Topbar
        eyebrow="Support"
        title="My tickets"
        actions={
          <Button as={Link} to="/app/tickets/new" variant="primary" icon={PlusCircle}>
            Create ticket
          </Button>
        }
      />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {error ? (
          <EmptyState icon={AlertCircle} title="Couldn't load your tickets" description={error} />
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1 rounded-md border border-line bg-surface p-0.5">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded px-2.5 py-1 text-[12px] font-medium transition-colors ${
                      filter === f ? "bg-accent-soft text-accent" : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="relative w-56">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tickets..."
                  className="h-8 w-full rounded-md border border-line-strong bg-surface pl-8 pr-3 text-[12.5px] outline-none focus:border-accent focus:ring-2 focus:ring-accent-line"
                />
              </div>
            </div>

            {loading ? <LoadingState rows={5} /> : <TicketTable tickets={filtered} columns="compact" basePath="/app/tickets" />}
          </>
        )}
      </div>
    </>
  );
}
