import { useMemo } from "react";
import { Sparkle, TriangleAlert } from "lucide-react";
import Badge from "./Badge";
import Button from "./Button";

const SEVERITY_TONE = { critical: "danger", high: "danger", medium: "warning", low: "neutral" };
const SEVERITY_LABEL = { critical: "Critical", high: "High", medium: "Medium", low: "Low" };
const SEVERITY_ORDER = ["critical", "high", "medium", "low"];

/**
 * AI Code Analysis panel. Shown to admins and the employee assigned to the
 * ticket —
 * see frontend build notes for why this isn't reused on the client
 * ticket page.
 *
 * `analysis` is the persisted Ticket.aiAnalysis shape:
 * { fileName, language, summary, issues[], overallAssessment, confidence, truncated }
 */
export default function CodeAnalysis({ analysis, analyzing, error, notice, onAnalyze }) {
  const counts = useMemo(() => {
    const c = { critical: 0, high: 0, medium: 0, low: 0 };
    (analysis?.issues || []).forEach((issue) => {
      if (c[issue.severity] !== undefined) c[issue.severity] += 1;
    });
    return c;
  }, [analysis]);

  const confidencePct =
    typeof analysis?.confidence === "number" ? Math.round(analysis.confidence * 100) : null;

  return (
    <div className="overflow-hidden rounded-lg border border-accent-line bg-accent-soft/40">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-accent-line/70 bg-accent-soft/60 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <Sparkle className="size-3.5 text-accent" strokeWidth={2} />
          <span className="font-mono text-[11px] font-medium uppercase tracking-wide text-accent">
            AI Code Analysis
          </span>
        </div>
        <div className="flex items-center gap-2">
          {confidencePct !== null && (
            <>
              <span className="text-[11px] text-ink-faint">Confidence</span>
              <div className="h-1 w-14 overflow-hidden rounded-full bg-accent-line/60">
                <div className="h-full bg-accent" style={{ width: `${confidencePct}%` }} />
              </div>
              <span className="font-tabular text-[11px] font-medium text-accent">{confidencePct}%</span>
            </>
          )}
          <Button variant="primary" size="sm" icon={Sparkle} onClick={onAnalyze} loading={analyzing}>
            {analysis ? "Re-analyze" : "Analyze Code"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 py-3.5">
        {analyzing && <p className="text-[13px] text-ink-faint">Analyzing code...</p>}

        {!analyzing && error && (
          <p className="flex items-center gap-1.5 text-[13px] text-danger">
            <TriangleAlert className="size-3.5 shrink-0" strokeWidth={2} />
            {error}
          </p>
        )}

        {!analyzing && !error && notice && <p className="text-[13px] text-ink-faint">{notice}</p>}

        {!analyzing && !error && !notice && !analysis && (
          <p className="text-[13px] text-ink-faint">
            No AI analysis yet. Click "Analyze Code" to have the AI Engine review the ticket's
            uploaded source file for bugs and risks.
          </p>
        )}

        {!analyzing && analysis && (
          <>
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">Summary</span>
              <p className="mt-1 text-[13px] leading-relaxed text-ink">{analysis.summary}</p>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink-faint">
              <span>
                {analysis.fileName} · {analysis.language}
              </span>
              <span>Issues found: {analysis.issues.length}</span>
              {analysis.truncated && <span className="text-warning">File truncated for analysis</span>}
            </div>

            {analysis.issues.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {SEVERITY_ORDER.filter((sev) => counts[sev] > 0).map((sev) => (
                  <Badge key={sev} tone={SEVERITY_TONE[sev]}>
                    {SEVERITY_LABEL[sev]}: {counts[sev]}
                  </Badge>
                ))}
              </div>
            )}

            {analysis.issues.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-accent-line/50 pt-3">
                <span className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
                  Findings
                </span>
                {analysis.issues.map((issue, i) => (
                  <div key={i} className="rounded-md border border-line bg-surface p-3">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      {issue.line != null && (
                        <span className="font-mono text-[11.5px] text-ink-faint">Line {issue.line}</span>
                      )}
                      <Badge tone={SEVERITY_TONE[issue.severity]}>{SEVERITY_LABEL[issue.severity]}</Badge>
                      <span className="text-[13px] font-medium text-ink">{issue.title}</span>
                    </div>
                    {issue.explanation && (
                      <p className="text-[12.5px] leading-relaxed text-ink-muted">{issue.explanation}</p>
                    )}
                    {issue.suggestion && (
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">
                        <span className="font-medium text-ink">Suggestion: </span>
                        {issue.suggestion}
                      </p>
                    )}
                    {issue.suggestedFix && (
                      <pre className="mt-1.5 overflow-x-auto rounded bg-surface-sunken px-2.5 py-2 text-[12px] text-ink">
                        <code>{issue.suggestedFix}</code>
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}

            {analysis.overallAssessment && (
              <div className="border-t border-accent-line/50 pt-3">
                <span className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
                  Overall assessment
                </span>
                <p className="mt-1 text-[13px] leading-relaxed text-ink">{analysis.overallAssessment}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
