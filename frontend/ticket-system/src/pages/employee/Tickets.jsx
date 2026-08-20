import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import Topbar from "../../components/Topbar";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";
import Select from "../../components/Select";
import TicketTable from "../../components/TicketTable";
import { CATEGORIES, PRIORITIES, STATUSES } from "../../data/mockTickets";
import { getEmployeeTickets } from "../../lib/api";
import { adaptTicket } from "../../lib/adapters";

const SORTS = [{ value: "updated", label: "Last updated" }, { value: "priority", label: "Priority (highest first)" }, { value: "newest", label: "Newest created" }, { value: "oldest", label: "Oldest created" }, { value: "status", label: "Status" }];
const priorityRank = { Critical: 0, High: 1, Medium: 2, Low: 3 };

export default function Tickets() {
  const [query, setQuery] = useState(""); const [status, setStatus] = useState(""); const [priority, setPriority] = useState(""); const [category, setCategory] = useState(""); const [sort, setSort] = useState("updated");
  const [tickets, setTickets] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");

  useEffect(() => { const timer = setTimeout(async () => { setLoading(true); setError(""); try { const data = await getEmployeeTickets({ search: query, status, priority, category }); setTickets(data.map(adaptTicket)); } catch (err) { setError(err.message || "Could not load related tickets."); } finally { setLoading(false); } }, 250); return () => clearTimeout(timer); }, [query, status, priority, category]);

  const sortedTickets = useMemo(() => [...tickets].sort((a, b) => {
    if (sort === "priority") return (priorityRank[a.priority] ?? 99) - (priorityRank[b.priority] ?? 99);
    if (sort === "newest") return new Date(b.created) - new Date(a.created);
    if (sort === "oldest") return new Date(a.created) - new Date(b.created);
    if (sort === "status") return String(a.status).localeCompare(String(b.status));
    return new Date(b.updated) - new Date(a.updated);
  }), [tickets, sort]);

  const hasFilters = query || status || priority || category || sort !== "updated";
  const clearFilters = () => { setQuery(""); setStatus(""); setPriority(""); setCategory(""); setSort("updated"); };
  const all = (label, values) => [{ value: "", label }, ...values];

  return <><Topbar eyebrow="Support workspace" title="Related Tickets" /><div className="flex-1 overflow-y-auto px-6 py-6"><div className="flex w-full flex-col gap-5">
    <div className="rounded-lg border border-line bg-surface p-4"><div className="flex flex-col gap-3 xl:flex-row xl:items-end">
      <label className="relative min-w-0 flex-1"><span className="sr-only">Search related tickets</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, ticket ID, or description…" className="h-9 w-full rounded-md border border-line-strong bg-surface pl-9 pr-3 text-[13px] text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-line" /></label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:w-[620px]"><Select id="employee-status" label="Status" options={all("All statuses", STATUSES)} value={status} onChange={(event) => setStatus(event.target.value)} /><Select id="employee-priority" label="Priority" options={all("All priorities", PRIORITIES)} value={priority} onChange={(event) => setPriority(event.target.value)} /><Select id="employee-category" label="Category" options={all("All categories", CATEGORIES)} value={category} onChange={(event) => setCategory(event.target.value)} /><Select id="employee-sort" label="Sort by" options={SORTS} value={sort} onChange={(event) => setSort(event.target.value)} /></div>
    </div><div className="mt-3 flex items-center justify-between border-t border-line pt-3"><span className="inline-flex items-center gap-1.5 text-[12px] text-ink-faint"><SlidersHorizontal className="size-3.5" /> {sortedTickets.length} related ticket{sortedTickets.length === 1 ? "" : "s"}</span>{hasFilters && <Button variant="ghost" size="sm" icon={X} onClick={clearFilters}>Clear filters</Button>}</div></div>
    {loading ? <LoadingState rows={6} /> : error ? <EmptyState icon={Search} title="Couldn't load tickets" description={error} /> : <TicketTable tickets={sortedTickets} columns="full" basePath="/employee/tickets" />}
  </div></div></>;
}
