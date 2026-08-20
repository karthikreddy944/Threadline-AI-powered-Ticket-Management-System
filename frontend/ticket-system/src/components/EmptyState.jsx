export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
      {Icon && (
        <div className="mb-1 flex size-9 items-center justify-center rounded-full bg-surface-sunken text-ink-faint">
          <Icon className="size-4" strokeWidth={2} />
        </div>
      )}
      <h3 className="text-[13.5px] font-semibold text-ink">{title}</h3>
      {description && <p className="max-w-xs text-[12.5px] text-ink-faint">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
