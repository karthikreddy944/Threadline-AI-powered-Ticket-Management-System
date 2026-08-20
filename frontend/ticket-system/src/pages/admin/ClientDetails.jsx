import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Topbar from "../../components/Topbar";
import LoadingState from "../../components/LoadingState";
import EmptyState from "../../components/EmptyState";
import { getClientDetails } from "../../lib/api";

export default function ClientDetails() {
  const { id } = useParams(); const [data, setData] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { getClientDetails(id).then(setData).catch(e => setError(e.message)).finally(() => setLoading(false)); }, [id]);
  if (loading) return <><Topbar eyebrow="Client" title="Client details" /><div className="p-6"><LoadingState rows={5} /></div></>;
  if (error) return <><Topbar eyebrow="Client" title="Client details" /><div className="p-6 text-[12.5px] text-danger">{error}</div></>;
  const { client, tickets = [] } = data || {};
  return <><Topbar eyebrow="Client" title={client?.name || "Client details"} /><div className="flex-1 overflow-y-auto px-6 py-6"><div className="flex w-full flex-col gap-5"><div className="rounded-lg border border-line bg-surface p-5"><h2 className="text-[15px] font-semibold text-ink">{client?.name}</h2><p className="mt-1 text-[12.5px] text-ink-muted">{client?.email}</p></div><div className="rounded-lg border border-line bg-surface"><div className="border-b border-line px-4 py-3 text-[13px] font-semibold text-ink">Ticket history</div>{tickets.length ? tickets.map(t => <Link key={t._id} to={`/admin/tickets/${t._id}`} className="flex items-center justify-between border-b border-line px-4 py-3 last:border-0 hover:bg-surface-alt"><div><div className="text-[12.5px] font-medium text-ink">{t.title}</div><div className="text-[11px] text-ink-faint">{t.ticketId}</div></div><div className="text-[12px] text-ink-muted">{t.status}</div></Link>) : <EmptyState title="No tickets" description="This client has not raised any tickets yet." />}</div></div></div></>;
}
