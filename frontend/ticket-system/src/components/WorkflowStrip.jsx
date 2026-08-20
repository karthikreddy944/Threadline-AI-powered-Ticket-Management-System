import { Check, ChevronRight } from "lucide-react";
import { STATUSES } from "../data/mockTickets";

export default function WorkflowStrip({ current }) {
  const currentIndex = STATUSES.indexOf(current);

  return (
    <div className="flex items-center overflow-x-auto rounded-lg border border-line bg-surface px-4 py-3">
      {STATUSES.map((s, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={s} className="flex shrink-0 items-center">
            <div className="flex items-center gap-1.5">
              <div
                className={`flex size-5 items-center justify-center rounded-full border text-[10px] font-semibold ${
                  done
                    ? "border-accent bg-accent text-ink-on-accent"
                    : active
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-line-strong bg-surface text-ink-faint"
                }`}
              >
                {done ? <Check className="size-3" strokeWidth={2.5} /> : i + 1}
              </div>
              <span
                className={`whitespace-nowrap text-[12.5px] font-medium ${
                  active ? "text-accent" : done ? "text-ink" : "text-ink-faint"
                }`}
              >
                {s}
              </span>
            </div>
            {i < STATUSES.length - 1 && (
              <ChevronRight className="mx-2.5 size-3.5 shrink-0 text-line-strong" strokeWidth={2} />
            )}
          </div>
        );
      })}
    </div>
  );
}
