import { useNavigate } from "react-router-dom";
import StatusBadge from "./StatusBadge";
import PriorityTag from "./PriorityTag";
import { priorityRailColor } from "./PriorityTag";
import { timeAgo } from "../lib/format";
import EmptyState from "./EmptyState";
import { Inbox, TriangleAlert } from "lucide-react";
import Badge from "./Badge";

export default function TicketTable({ tickets, columns = "full", onRowClick, basePath = "/tickets" }) {
  const navigate = useNavigate();

  if (!tickets.length) {
    return <EmptyState icon={Inbox} title="No tickets here" description="Nothing matches the current filters yet." />;
  }

  const showRequester = columns === "full";
  const showAssignee = columns === "full";

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left">
        <thead>
          <tr className="border-b border-line bg-surface-alt/60 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
            <th className="w-8 px-0" />
            <th className="py-2.5 pr-3 font-medium">Ticket</th>
            <th className="w-[110px] py-2.5 pr-3 font-medium">Category</th>
            <th className="w-[100px] py-2.5 pr-3 font-medium">Priority</th>
            <th className="w-[110px] py-2.5 pr-3 font-medium">Status</th>
            {showRequester && <th className="w-[130px] py-2.5 pr-3 font-medium">Requester</th>}
            {showAssignee && <th className="w-[130px] py-2.5 pr-3 font-medium">Assigned to</th>}
            <th className="w-[110px] py-2.5 pr-3 font-medium">Escalation</th>
            <th className="w-[90px] py-2.5 pr-4 text-right font-medium">Updated</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr
              key={t.id}
              onClick={() => (onRowClick ? onRowClick(t) : navigate(`${basePath}/${t.routeId || t.id}`))}
              className="group cursor-pointer border-b border-line last:border-0 hover:bg-surface-alt/70"
            >
              <td className="w-8 px-0">
                <span
                  className="block h-full w-[3px]"
                  style={{ backgroundColor: priorityRailColor(t.priority) }}
                />
              </td>
              <td className="max-w-0 py-2.5 pr-3">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11.5px] text-ink-faint">{t.id}</span>
                  </div>
                  <span className="truncate text-[13px] font-medium text-ink group-hover:text-accent">
                    {t.title}
                  </span>
                </div>
              </td>
              <td className="py-2.5 pr-3 text-[12.5px] text-ink-muted">{t.category}</td>
              <td className="py-2.5 pr-3">
                <PriorityTag priority={t.priority} />
              </td>
              <td className="py-2.5 pr-3">
                <StatusBadge status={t.status} />
              </td>
              {showRequester && (
                <td className="py-2.5 pr-3 text-[12.5px] text-ink-muted">{t.requester}</td>
              )}
              {showAssignee && (
                <td className="py-2.5 pr-3 text-[12.5px] text-ink-muted">
                  {t.assignedTo || <span className="text-ink-faint">Unassigned</span>}
                </td>
              )}
              <td className="py-2.5 pr-3">
                {t.escalation?.escalatedToAdmin ? (
                  <Badge tone="warning" className="gap-1">
                    <TriangleAlert className="size-3" strokeWidth={2} />
                    Escalated
                  </Badge>
                ) : (
                  <span className="text-ink-faint">—</span>
                )}
              </td>
              <td className="py-2.5 pr-4 text-right font-tabular text-[11.5px] text-ink-faint">
                {timeAgo(t.updated)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
