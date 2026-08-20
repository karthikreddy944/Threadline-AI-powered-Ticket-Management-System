export default function Topbar({ title, eyebrow, actions }) {
  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-surface px-6">
      <div className="flex flex-col justify-center leading-tight">
        {eyebrow && <span className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">{eyebrow}</span>}
        <h1 className="font-display text-[15px] font-semibold text-ink">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
