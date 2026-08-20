export default function LoadingState({ rows = 4 }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5 shadow-xs">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-8 w-8 shrink-0 animate-pulse rounded-md bg-surface-sunken" />
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="h-2.5 w-2/3 animate-pulse rounded bg-surface-sunken" />
            <div className="h-2 w-1/3 animate-pulse rounded bg-surface-sunken" />
          </div>
        </div>
      ))}
    </div>
  );
}
