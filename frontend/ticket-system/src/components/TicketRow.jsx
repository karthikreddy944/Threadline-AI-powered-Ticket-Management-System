import { useNavigate } from "react-router-dom";
import { Wifi, Cpu, AppWindow, KeyRound, CircleHelp, TriangleAlert } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { priorityRailColor } from "./PriorityTag";
import { timeAgo } from "../lib/format";

const categoryIcon = {
  Network: Wifi,
  Hardware: Cpu,
  Software: AppWindow,
  "Account/Login": KeyRound,
  Other: CircleHelp,
};

export default function TicketRow({ ticket, basePath = "/tickets" }) {
  const navigate = useNavigate();
  const Icon = categoryIcon[ticket.category] || CircleHelp;

  return (
    <button
      onClick={() => navigate(`${basePath}/${ticket.routeId || ticket.id}`)}
      className="flex w-full items-center gap-3 border-b border-line px-4 py-2.5 text-left last:border-0 hover:bg-surface-alt/70"
    >
      <span
        className="h-8 w-[3px] shrink-0 rounded-full"
        style={{ backgroundColor: priorityRailColor(ticket.priority) }}
      />
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-ink-muted">
        <Icon className="size-[15px]" strokeWidth={2} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[13px] font-medium text-ink">{ticket.title}</span>
        <span className="font-mono text-[11px] text-ink-faint">
          {ticket.id} · {ticket.category}{ticket.assignedTo ? ` · Assigned to ${ticket.assignedTo}` : " · Unassigned"}
        </span>
      </div>
      <StatusBadge status={ticket.status} />
      {ticket.escalation?.escalatedToAdmin && (
        <TriangleAlert className="size-3.5 shrink-0 text-warning" strokeWidth={2} />
      )}
      <span className="w-14 shrink-0 text-right font-tabular text-[11px] text-ink-faint">
        {timeAgo(ticket.updated)}
      </span>
    </button>
  );
}
