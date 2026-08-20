import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function Topbar({ title, eyebrow, actions }) {
  const { setTheme } = useTheme();
  const isDark = document.documentElement.dataset.theme === "dark";
  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-surface/95 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex flex-col justify-center leading-tight">
        {eyebrow && <span className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">{eyebrow}</span>}
        <h1 className="font-display text-[16px] font-semibold tracking-tight text-ink">{title}</h1>
      </div>
      <div className="flex items-center gap-2"><button type="button" title="Toggle theme" onClick={() => setTheme(isDark ? "light" : "dark")} className="flex size-8 items-center justify-center rounded-lg border border-line text-ink-faint hover:bg-surface-alt hover:text-ink">{isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}</button>{actions}</div>
    </div>
  );
}
