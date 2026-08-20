export default function Stat({ label, value, icon: Icon, tone = "neutral", trend }) {
  const iconTones = {
    neutral: "bg-surface-sunken text-ink-muted",
    accent: "bg-accent-soft text-accent",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
    success: "bg-success-soft text-success",
  };
  return (
    <div className="flex flex-1 flex-col gap-3 rounded-lg border border-line bg-surface p-4 shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-ink-muted">{label}</span>
        {Icon && (
          <div className={`flex size-6 items-center justify-center rounded-md ${iconTones[tone]}`}>
            <Icon className="size-3.5" strokeWidth={2} />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="font-display font-tabular text-[26px] font-semibold leading-none text-ink">{value}</span>
        {trend && <span className="text-[11.5px] text-ink-faint">{trend}</span>}
      </div>
    </div>
  );
}
