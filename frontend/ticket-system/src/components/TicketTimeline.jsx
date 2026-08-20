import { CirclePlus, Sparkle, UserCheck, MessageSquare, CircleDot, TriangleAlert } from "lucide-react";
import { formatDateTime } from "../lib/format";

const typeMeta = {
  created: { icon: CirclePlus, tone: "text-ink-muted bg-surface-sunken" },
  ai: { icon: Sparkle, tone: "text-accent bg-accent-soft" },
  assigned: { icon: UserCheck, tone: "text-info bg-info-soft" },
  comment: { icon: MessageSquare, tone: "text-ink-muted bg-surface-sunken" },
  status: { icon: CircleDot, tone: "text-success bg-success-soft" },
  escalated: { icon: TriangleAlert, tone: "text-warning bg-warning-soft" },
};

export default function TicketTimeline({ events }) {
  return (
    <ol className="flex flex-col">
      {events.map((e, i) => {
        const meta = typeMeta[e.type] || typeMeta.comment;
        const Icon = meta.icon;
        const isLast = i === events.length - 1;
        return (
          <li key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`flex size-6 shrink-0 items-center justify-center rounded-full ${meta.tone}`}>
                <Icon className="size-3.5" strokeWidth={2} />
              </div>
              {!isLast && <div className="w-px flex-1 bg-line" />}
            </div>
            <div className={`flex flex-1 flex-col gap-0.5 ${isLast ? "pb-0" : "pb-4"}`}>
              <div className="flex items-baseline gap-2">
                <span className="text-[12.5px] font-medium text-ink">{e.actor}</span>
                <span className="text-[11px] text-ink-faint">{formatDateTime(e.at)}</span>
              </div>
              <p className="text-[13px] leading-relaxed text-ink-muted">{e.text}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
