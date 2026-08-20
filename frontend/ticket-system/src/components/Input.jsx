export default function Input({ label, hint, error, id, className = "", ...props }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-[12.5px] font-medium text-ink">
          {label}
        </label>
      )}
      <input
        id={id}
        className="h-9 rounded-lg border border-line-strong bg-surface px-3 text-[13px] text-ink shadow-xs placeholder:text-ink-faint outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent-line"
        {...props}
      />
      {hint && !error && <span className="text-[11.5px] text-ink-faint">{hint}</span>}
      {error && <span className="text-[11.5px] text-danger">{error}</span>}
    </div>
  );
}
