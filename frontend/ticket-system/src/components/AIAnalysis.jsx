import { Sparkle } from "lucide-react";
import PriorityTag from "./PriorityTag";

export default function AIAnalysis({ analysis, category }) {
  if (!analysis) return null;
  const confidencePct = Math.round((analysis.confidence ?? 0) * 100);

  return (
    <div className="overflow-hidden rounded-lg border border-accent-line bg-accent-soft/40">
      <div className="flex items-center justify-between border-b border-accent-line/70 bg-accent-soft/60 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <Sparkle className="size-3.5 text-accent" strokeWidth={2} />
          <span className="font-mono text-[11px] font-medium uppercase tracking-wide text-accent">
            AI Analysis
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-ink-faint">Confidence</span>
          <div className="h-1 w-14 overflow-hidden rounded-full bg-accent-line/60">
            <div className="h-full bg-accent" style={{ width: `${confidencePct}%` }} />
          </div>
          <span className="font-tabular text-[11px] font-medium text-accent">{confidencePct}%</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 py-3.5">
        <div>
          <span className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">Summary</span>
          <p className="mt-1 text-[13px] leading-relaxed text-ink">{analysis.summary}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
              Detected category
            </span>
            <p className="mt-1 text-[13px] font-medium text-ink">{analysis.category ?? category}</p>
          </div>
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">Priority</span>
            <div className="mt-1">
              <PriorityTag priority={analysis.priority} />
            </div>
          </div>
        </div>

        <div>
          <span className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
            Recommended action
          </span>
          <p className="mt-1 text-[13px] leading-relaxed text-ink">{analysis.recommendedAction}</p>
        </div>
      </div>
    </div>
  );
}
