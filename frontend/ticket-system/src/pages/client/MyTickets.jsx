import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, PlusCircle, AlertCircle, SlidersHorizontal, X } from "lucide-react";
import Topbar from "../../components/Topbar";
import Button from "../../components/Button";
import TicketTable from "../../components/TicketTable";
import LoadingState from "../../components/LoadingState";
import EmptyState from "../../components/EmptyState";
import { STATUSES } from "../../data/mockTickets";
import { CATEGORIES, PRIORITIES } from "../../data/mockTickets";
import Select from "../../components/Select";
import { getMyTickets } from "../../lib/api";
import { adaptTicket } from "../../lib/adapters";
import { useAuth } from "../../context/AuthContext";

const FILTERS = ["All", ...STATUSES];
const SORTS = [{ value: "updated", label: "Last updated" }, { value: "newest", label: "Newest created" }, { value: "oldest", label: "Oldest created" }, { value: "priority", label: "Priority" }];
const priorityRank = { Critical: 0, High: 1, Medium: 2, Low: 3 };

export default function MyTickets() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("updated");
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
    const visible = tickets.filter((t) => {
      const matchesFilter = filter === "All" || t.status === filter;
      const matchesQuery =
        !query ||
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        t.id.toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery && (!priority || t.priority === priority) && (!category || t.category === category);
    });
    return visible.sort((a, b) => {
      if (sort === "priority") return (priorityRank[a.priority] ?? 99) - (priorityRank[b.priority] ?? 99);
      if (sort === "newest") return new Date(b.created) - new Date(a.created);
      if (sort === "oldest") return new Date(a.created) - new Date(b.created);
      return new Date(b.updated) - new Date(a.updated);
    });
  }, [tickets, filter, query, priority, category, sort]);

  const hasFilters = filter !== "All" || query || priority || category || sort !== "updated";
  const clearFilters = () => { setFilter("All"); setQuery(""); setPriority(""); setCategory(""); setSort("updated"); };

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
            <div className="mb-4 rounded-xl border border-line bg-surface p-3 shadow-xs">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
              <div className="min-w-0 overflow-x-auto rounded-lg border border-line bg-surface-alt/40 p-1 xl:flex-1">
              <div className="flex w-max items-center gap-1">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                      className={`rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                      filter === f ? "bg-accent-soft text-accent" : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              </div>
              <div className="relative xl:w-60">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tickets..."
                  className="h-9 w-full rounded-lg border border-line-strong bg-surface pl-8 pr-3 text-[12.5px] shadow-xs outline-none focus:border-accent focus:ring-2 focus:ring-accent-line"
                />
              </div>
              <div className="grid grid-cols-3 gap-2 sm:w-[480px]">
                <Select id="my-ticket-priority" placeholder="Priority" options={[{ value: "", label: "All priorities" }, ...PRIORITIES]} value={priority} onChange={(e) => setPriority(e.target.value)} />
                <Select id="my-ticket-category" placeholder="Category" options={[{ value: "", label: "All categories" }, ...CATEGORIES]} value={category} onChange={(e) => setCategory(e.target.value)} />
                <Select id="my-ticket-sort" placeholder="Sort" options={SORTS} value={sort} onChange={(e) => setSort(e.target.value)} />
              </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-faint"><SlidersHorizontal className="size-3.5" /> {filtered.length} ticket{filtered.length === 1 ? "" : "s"}</span>
                {hasFilters && <Button variant="ghost" size="sm" icon={X} onClick={clearFilters}>Clear filters</Button>}
              </div>
            </div>

            {loading ? <LoadingState rows={5} /> : <TicketTable tickets={filtered} columns="compact" basePath="/app/tickets" />}
          </>
        )}
      </div>
    </>
  );
}
