import { ChevronDown } from "lucide-react";

export default function Select({ label, hint, error, id, options = [], placeholder, className = "", ...props }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-[12.5px] font-medium text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          className="h-9 w-full appearance-none rounded-lg border border-line-strong bg-surface px-3 pr-8 text-[13px] text-ink shadow-xs outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent-line"
          {...(props.value === undefined && props.defaultValue === undefined ? { defaultValue: "" } : {})}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => {
            const value = typeof opt === "object" && opt !== null ? opt.value : opt;
            const label = typeof opt === "object" && opt !== null ? opt.label : opt;
            return (
              <option key={value} value={value}>
                {label}
              </option>
            );
          })}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-faint" />
      </div>
      {hint && !error && <span className="text-[11.5px] text-ink-faint">{hint}</span>}
      {error && <span className="text-[11.5px] text-danger">{error}</span>}
    </div>
  );
}
