import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const choices = [{ value: "light", label: "Light", icon: Sun }, { value: "dark", label: "Dark", icon: Moon }, { value: "system", label: "System", icon: Laptop }];
export default function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  return <section className="rounded-xl border border-line bg-surface p-5 shadow-xs"><h3 className="text-[13px] font-semibold text-ink">Appearance</h3><p className="mt-1 text-[12px] text-ink-faint">Choose how Threadline looks on this device.</p><div className="mt-4 grid grid-cols-3 gap-2">{choices.map(({ value, label, icon: Icon }) => <button key={value} type="button" onClick={() => setTheme(value)} className={`flex flex-col items-center gap-2 rounded-lg border px-2 py-3 text-[11.5px] font-medium transition-colors ${theme === value ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface-alt/40 text-ink-muted hover:border-accent-line"}`}><Icon className="size-4" />{label}</button>)}</div></section>;
}
