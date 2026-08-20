import { Loader2 } from "lucide-react";

const variants = {
  primary: "bg-accent text-ink-on-accent hover:bg-accent-hover border border-transparent",
  secondary: "bg-surface text-ink border border-line-strong hover:bg-surface-alt",
  ghost: "bg-transparent text-ink-muted hover:bg-surface-alt hover:text-ink border border-transparent",
  danger: "bg-danger text-white hover:bg-[#94201a] border border-transparent",
};

const sizes = {
  sm: "h-7 px-2.5 text-[12.5px] gap-1.5",
  md: "h-8 px-3.5 text-[13px] gap-1.5",
  lg: "h-9 px-4 text-[13.5px] gap-2",
};

export default function Button({
  as: Tag = "button",
  variant = "secondary",
  size = "md",
  icon: Icon,
  loading = false,
  className = "",
  children,
  ...props
}) {
  return (
    <Tag
      className={`inline-flex items-center justify-center rounded-md font-medium transition-all duration-100 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 whitespace-nowrap ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : Icon ? (
        <Icon className="size-3.5" strokeWidth={2} />
      ) : null}
      {children}
    </Tag>
  );
}
