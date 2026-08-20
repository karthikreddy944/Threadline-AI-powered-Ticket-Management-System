import { X } from "lucide-react";
import { useEffect } from "react";

export default function Modal({ open, onClose, title, children, footer, width = "420px" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4 backdrop-blur-[2px]">
      <div
        className="flex max-h-[85vh] flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-lg"
        style={{ width }}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="font-display text-[14px] font-semibold text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="flex size-6 items-center justify-center rounded-md text-ink-faint hover:bg-surface-alt hover:text-ink"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-4 py-3">{footer}</div>}
      </div>
    </div>
  );
}
