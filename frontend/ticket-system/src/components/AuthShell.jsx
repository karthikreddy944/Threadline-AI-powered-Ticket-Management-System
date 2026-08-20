import { Link } from "react-router-dom";
import { GitBranch, ArrowLeft } from "lucide-react";

export default function AuthShell({ eyebrow, title, description, children, footer }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(600px circle at 15% 10%, var(--color-accent-soft), transparent 60%), radial-gradient(500px circle at 85% 90%, var(--color-info-soft), transparent 55%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-ink) 1px, transparent 1px), linear-gradient(90deg, var(--color-ink) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
        aria-hidden="true"
      />
      <Link
        to="/"
        className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] font-medium text-ink-muted transition-colors hover:bg-surface-alt hover:text-ink sm:left-6 sm:top-6"
      >
        <ArrowLeft className="size-3.5" strokeWidth={2} />
        Back to home
      </Link>
      <div className="relative w-full max-w-[380px]">
        <div className="mb-7 flex flex-col items-center text-center">
          <Link
            to="/"
            className="mb-4 flex size-9 items-center justify-center rounded-lg bg-accent text-ink-on-accent shadow-md transition-transform hover:scale-105"
          >
            <GitBranch className="size-[18px]" strokeWidth={2.5} />
          </Link>
          {eyebrow && (
            <span className="mb-1 text-[11px] font-medium uppercase tracking-wide text-ink-faint">{eyebrow}</span>
          )}
          <h1 className="font-display text-[19px] font-semibold text-ink">{title}</h1>
          {description && <p className="mt-1.5 text-[13px] text-ink-muted">{description}</p>}
        </div>

        <div className="rounded-lg border border-line bg-surface p-6 shadow-lg">{children}</div>

        {footer && <div className="mt-5 text-center text-[12.5px] text-ink-faint">{footer}</div>}
      </div>
    </div>
  );
}
