import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Search, SlidersHorizontal, Users, X } from "lucide-react";
import Topbar from "../../components/Topbar";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";
import Select from "../../components/Select";
import { getClients } from "../../lib/api";

const SORTS = [{ value: "newest", label: "Newest joined" }, { value: "name", label: "Name A–Z" }, { value: "tickets", label: "Most tickets" }, { value: "open", label: "Most open tickets" }];

export default function Clients() {
  const [clients, setClients] = useState([]); const [query, setQuery] = useState(""); const [sort, setSort] = useState("newest"); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { const timer = setTimeout(() => { setLoading(true); getClients({ search: query }).then(setClients).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, 250); return () => clearTimeout(timer); }, [query]);
  const sorted = useMemo(() => [...clients].sort((a, b) => { if (sort === "name") return a.name.localeCompare(b.name); if (sort === "tickets") return (b.ticketStats?.total || 0) - (a.ticketStats?.total || 0); if (sort === "open") return (b.ticketStats?.open || 0) - (a.ticketStats?.open || 0); return new Date(b.createdAt) - new Date(a.createdAt); }), [clients, sort]);
  const clear = () => { setQuery(""); setSort("newest"); };
  const filtered = query || sort !== "newest";
  return <><Topbar eyebrow="Administration" title="Clients" /><div className="flex-1 overflow-y-auto px-6 py-6"><div className="flex w-full flex-col gap-5"><div className="rounded-lg border border-line bg-surface p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-end"><label className="relative flex-1"><span className="sr-only">Search clients</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search client name, email, or phone…" className="h-9 w-full rounded-md border border-line-strong bg-surface pl-9 pr-3 text-[13px] outline-none focus:border-accent focus:ring-2 focus:ring-accent-line" /></label><div className="lg:w-[190px]"><Select id="client-sort" label="Sort by" options={SORTS} value={sort} onChange={(e) => setSort(e.target.value)} /></div></div><div className="mt-3 flex items-center justify-between border-t border-line pt-3"><span className="inline-flex items-center gap-1.5 text-[12px] text-ink-faint"><SlidersHorizontal className="size-3.5" /> {sorted.length} client{sorted.length === 1 ? "" : "s"}</span>{filtered && <Button variant="ghost" size="sm" icon={X} onClick={clear}>Clear filters</Button>}</div></div>{error && <p className="text-[12.5px] text-danger">{error}</p>}{loading ? <LoadingState rows={5} /> : sorted.length === 0 ? <EmptyState icon={Users} title="No matching clients" description="Try changing your search or filters." /> : <div className="overflow-hidden rounded-lg border border-line bg-surface">{sorted.map((client) => <Link key={client._id} to={`/admin/clients/${client._id}`} className="flex items-center justify-between border-b border-line px-4 py-4 last:border-0 hover:bg-surface-alt"><div><div className="text-[13px] font-medium text-ink">{client.name}</div><div className="text-[11.5px] text-ink-faint">{client.email}</div></div><div className="flex items-center gap-6 text-[12px] text-ink-muted"><span>{client.ticketStats?.total || 0} tickets</span><span>{client.ticketStats?.open || 0} open</span><ArrowRight className="size-4" /></div></Link>)}</div>}</div></div></>;
}
