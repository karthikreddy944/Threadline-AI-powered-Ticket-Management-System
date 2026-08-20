const dotColor = {
  Low: "bg-p-low",
  Medium: "bg-p-medium",
  High: "bg-p-high",
  Critical: "bg-p-critical",
};

const textColor = {
  Low: "text-p-low",
  Medium: "text-p-medium",
  High: "text-p-high",
  Critical: "text-p-critical",
};

export default function PriorityTag({ priority, showLabel = true }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12.5px] font-medium ${textColor[priority]}`}>
      <span className={`size-1.5 rounded-full ${dotColor[priority]} ${priority === "Critical" ? "animate-pulse" : ""}`} />
      {showLabel && priority}
    </span>
  );
}

export function priorityRailColor(priority) {
  return (
    {
      Low: "var(--color-p-low)",
      Medium: "var(--color-p-medium)",
      High: "var(--color-p-high)",
      Critical: "var(--color-p-critical)",
    }[priority] || "var(--color-line-strong)"
  );
}
