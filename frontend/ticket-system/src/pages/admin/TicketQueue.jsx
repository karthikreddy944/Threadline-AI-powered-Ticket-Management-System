import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, ArrowUpDown, AlertCircle, Zap, TriangleAlert, X } from "lucide-react";
import Topbar from "../../components/Topbar";
import Select from "../../components/Select";
import Button from "../../components/Button";
import TicketTable from "../../components/TicketTable";
import LoadingState from "../../components/LoadingState";
import EmptyState from "../../components/EmptyState";
import { STATUSES, PRIORITIES, CATEGORIES } from "../../data/mockTickets";
import { getAllTickets, getAllocationSettings, autoAssignAllUnassigned } from "../../lib/api";
import { adaptTicket } from "../../lib/adapters";

const priorityRank = { Critical: 0, High: 1, Medium: 2, Low: 3 };

export default function TicketQueue() {
  const [searchParams, setSearchParams] = useSearchParams();
  const escalatedOnly = searchParams.get("escalated") === "true";

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("updated");

  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Assignment Mode is admin-controlled in Settings. The bulk
  // "Automatically Assign Unassigned Tickets" action only makes
  // sense (and only succeeds server-side) when it's "automatic".
  const [allocationMode, setAllocationMode] = useState("manual");
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [autoAssignNote, setAutoAssignNote] = useState("");

  useEffect(() => {
    getAllocationSettings().then((s) => setAllocationMode(s.mode)).catch(() => {});
  }, []);

  // Debounce the free-text search so we're not firing a request on every keystroke.
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = { limit: 100 };
    if (debouncedQuery) params.search = debouncedQuery;
    if (status) params.status = status;
    if (priority) params.priority = priority;
    if (category) params.category = category;
    try {
      const data = await getAllTickets(params);
      setTickets(data.tickets.map(adaptTicket));
      setTotal(data.pagination?.total ?? data.tickets.length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, status, priority, category]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      await load();
    };
    run();
    const timer = setInterval(run, 5000);
    window.addEventListener("focus", run);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("focus", run);
    };
  }, [load]);

  const handleAutoAssignAll = async () => {
    setAutoAssigning(true);
    setAutoAssignNote("");
    try {
      const result = await autoAssignAllUnassigned();
      setAutoAssignNote(
        result.message || `Assigned ${result.assigned.length} ticket${result.assigned.length === 1 ? "" : "s"}.`
      );
      await load();
    } catch (err) {
      setAutoAssignNote(err.message || "No active employees available for automatic assignment.");
    } finally {
      setAutoAssigning(false);
    }
  };

  const sorted = useMemo(() => {
    const rows = [...tickets].filter((t) => !escalatedOnly || t.escalation?.escalatedToAdmin);
    rows.sort((a, b) => {
      if (sort === "priority") return priorityRank[a.priority] - priorityRank[b.priority];
      if (sort === "created") return new Date(b.created) - new Date(a.created);
      return new Date(b.updated) - new Date(a.updated);
    });
    return rows;
  }, [tickets, sort, escalatedOnly]);

  const clearEscalatedFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("escalated");
    setSearchParams(next);
  };

  return (
    <>
      <Topbar
        eyebrow="Support"
        title="Ticket queue"
        actions={
          allocationMode === "automatic" ? (
            <Button variant="primary" size="sm" icon={Zap} onClick={handleAutoAssignAll} loading={autoAssigning}>
              Automatically assign unassigned tickets
            </Button>
          ) : null
        }
      />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {escalatedOnly && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-line bg-warning-soft/60 px-3 py-2 text-[12.5px] text-warning">
            <TriangleAlert className="size-3.5" strokeWidth={2} />
            <span>Showing escalated tickets only</span>
            <button
              onClick={clearEscalatedFilter}
              className="ml-auto flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11.5px] font-medium hover:bg-warning-soft"
            >
              <X className="size-3" strokeWidth={2} /> Clear
            </button>
          </div>
        )}
        {autoAssignNote && (
          <div className="mb-4 rounded-md border border-line bg-surface-alt/60 p-3 text-[12.5px] text-ink">
            {autoAssignNote}
          </div>
        )}
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="relative w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, ID, or requester..."
              className="h-9 w-full rounded-md border border-line-strong bg-surface pl-8 pr-3 text-[13px] outline-none focus:border-accent focus:ring-2 focus:ring-accent-line"
            />
          </div>
          <Select
            className="w-40"
            id="status-filter"
            placeholder="All statuses"
            options={STATUSES}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />
          <Select
            className="w-36"
            id="priority-filter"
            placeholder="All priorities"
            options={PRIORITIES}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          />
          <Select
            className="w-40"
            id="category-filter"
            placeholder="All categories"
            options={CATEGORIES}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <div className="ml-auto flex items-center gap-1.5">
            <ArrowUpDown className="size-3.5 text-ink-faint" strokeWidth={2} />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-9 rounded-md border border-line-strong bg-surface px-2.5 text-[12.5px] outline-none focus:border-accent"
            >
              <option value="updated">Last updated</option>
              <option value="created">Newest first</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </div>

        {error ? (
          <EmptyState icon={AlertCircle} title="Couldn't load tickets" description={error} />
        ) : loading ? (
          <LoadingState rows={6} />
        ) : (
          <>
            <p className="mb-2 text-[12px] text-ink-faint">
              {sorted.length} of {total} tickets
            </p>
            <TicketTable tickets={sorted} columns="full" basePath="/admin/tickets" />
          </>
        )}
      </div>
    </>
  );
}
