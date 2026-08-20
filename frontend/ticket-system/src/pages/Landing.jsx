import { Link } from "react-router-dom";
import {
  GitBranch,
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
  BarChart3,
  Users,
  Bot,
  Route,
  Bell,
  Clock,
  CheckCircle2,
  UserRound,
  UserCog,
  Building2,
} from "lucide-react";
import Reveal from "../components/Reveal";

const FEATURES = [
  {
    icon: Bot,
    title: "AI repository analysis",
    description:
      "Threadline reads the linked GitHub repository and surfaces likely root causes, severity, and suggested fixes before an engineer even opens the ticket.",
  },
  {
    icon: Route,
    title: "Smart assignment",
    description:
      "Route tickets manually or automatically — round robin, priority-first, or FIFO — with live workload visibility so no one gets buried.",
  },
  {
    icon: GitBranch,
    title: "GitHub-native context",
    description:
      "Every ticket can carry its repository, branch, and analysis status, so engineers start with the code in front of them, not a blank description box.",
  },
  {
    icon: BarChart3,
    title: "Real analytics",
    description:
      "Resolution time, workload by employee, ticket volume by priority — all computed from live data, never mocked or padded.",
  },
  {
    icon: Bell,
    title: "Notifications that matter",
    description:
      "Assignment changes, new comments, and status updates reach the right person the moment they happen.",
  },
  {
    icon: ShieldCheck,
    title: "Role-scoped security",
    description:
      "Clients, employees, and admins each see exactly what they're supposed to — enforced server-side, not just hidden in the UI.",
  },
];

const STEPS = [
  {
    title: "A client raises a ticket",
    description: "Description, priority, and an optional linked GitHub repository — submitted in under a minute.",
  },
  {
    title: "Threadline triages it",
    description: "Automatic assignment routes it to the right engineer, and AI analysis starts investigating the repo.",
  },
  {
    title: "The team resolves it",
    description: "Engineers work from AI findings and repo context, leave notes, and update status as they go.",
  },
  {
    title: "Everyone stays informed",
    description: "Clients and admins see live status, resolution notes, and analytics the moment things change.",
  },
];

const PORTALS = [
  {
    icon: UserRound,
    role: "Client",
    description: "Raise tickets, track status, and stay in the loop on your requests.",
    to: "/login",
    cta: "Client sign in",
  },
  {
    icon: Building2,
    role: "Employee",
    description: "Work your assigned queue with AI-assisted investigation tools.",
    to: "/employee/login",
    cta: "Employee sign in",
  },
  {
    icon: UserCog,
    role: "Admin",
    description: "Oversee the whole system — assignment, employees, and analytics.",
    to: "/admin/login",
    cta: "Admin sign in",
  },
];

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-canvas text-ink">
      {/* Ambient background */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] opacity-80"
        style={{
          backgroundImage:
            "radial-gradient(700px circle at 20% -10%, var(--color-accent-soft), transparent 60%), radial-gradient(600px circle at 90% 10%, var(--color-info-soft), transparent 55%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-ink) 1px, transparent 1px), linear-gradient(90deg, var(--color-ink) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
        aria-hidden="true"
      />

      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-accent text-ink-on-accent shadow-sm">
              <GitBranch className="size-4" strokeWidth={2.5} />
            </div>
            <span className="font-display text-[16px] font-semibold tracking-tight text-ink">Threadline</span>
          </div>
          <nav className="hidden items-center gap-7 md:flex">
            <a href="#features" className="text-[13px] font-medium text-ink-muted hover:text-ink">Features</a>
            <a href="#workflow" className="text-[13px] font-medium text-ink-muted hover:text-ink">How it works</a>
            <a href="#portals" className="text-[13px] font-medium text-ink-muted hover:text-ink">Sign in</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="hidden h-8 items-center rounded-md px-3 text-[13px] font-medium text-ink-muted hover:bg-surface-alt hover:text-ink sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-accent px-3.5 text-[13px] font-medium text-ink-on-accent shadow-sm transition-colors hover:bg-accent-hover"
            >
              Get started
              <ArrowRight className="size-3.5" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pb-20 pt-20 sm:pt-28">
        <div className="mx-auto max-w-2xl text-center">
          <div className="animate-fade-up mx-auto mb-5 inline-flex items-center gap-1.5 rounded-full border border-accent-line bg-accent-soft px-3 py-1 text-[12px] font-medium text-accent">
            <Sparkles className="size-3.5" strokeWidth={2} />
            AI-powered IT support, built for real teams
          </div>
          <h1
            className="animate-fade-up font-display text-[34px] font-semibold leading-[1.15] tracking-tight text-ink sm:text-[46px]"
            style={{ animationDelay: "80ms" }}
          >
            Ticket management that{" "}
            <span className="animate-gradient-x bg-gradient-to-r from-accent via-info to-accent bg-clip-text text-transparent">
              thinks alongside your team
            </span>
          </h1>
          <p
            className="animate-fade-up mt-5 text-[15px] leading-relaxed text-ink-muted sm:text-[16px]"
            style={{ animationDelay: "160ms" }}
          >
            Threadline pairs a modern helpdesk with AI-driven repository analysis, automatic routing, and
            real-time visibility — so nothing falls through the cracks, and no one wonders where a ticket stands.
          </p>
          <div
            className="animate-fade-up mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            style={{ animationDelay: "240ms" }}
          >
            <Link
              to="/signup"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-accent px-6 text-[14px] font-medium text-ink-on-accent shadow-md transition-all hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-lg sm:w-auto"
            >
              Create your free account
              <ArrowRight className="size-4" strokeWidth={2} />
            </Link>
            <a
              href="#portals"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-line-strong bg-surface px-6 text-[14px] font-medium text-ink transition-colors hover:bg-surface-alt sm:w-auto"
            >
              Sign in to your workspace
            </a>
          </div>
        </div>

        {/* Product preview mock */}
        <Reveal delay={120} className="mx-auto mt-16 max-w-4xl">
          <div className="animate-float-slow rounded-xl border border-line bg-surface p-2 shadow-lg">
            <div className="flex items-center gap-1.5 rounded-t-lg border-b border-line bg-surface-alt/60 px-3 py-2.5">
              <span className="size-2.5 rounded-full bg-p-critical/40" />
              <span className="size-2.5 rounded-full bg-p-medium/40" />
              <span className="size-2.5 rounded-full bg-success/40" />
              <span className="ml-3 text-[11px] font-medium text-ink-faint">Admin dashboard</span>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
              {[
                { label: "Total tickets", value: "182", tone: "text-ink" },
                { label: "Unassigned", value: "6", tone: "text-warning" },
                { label: "High priority", value: "11", tone: "text-danger" },
                { label: "Resolved", value: "147", tone: "text-success" },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border border-line bg-surface p-3">
                  <div className="text-[11px] font-medium text-ink-muted">{s.label}</div>
                  <div className={`mt-2 font-display text-[22px] font-semibold ${s.tone}`}>{s.value}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 px-4 pb-4 sm:grid-cols-[1.4fr_1fr]">
              <div className="rounded-lg border border-line bg-surface p-3">
                <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-ink-faint">Needs attention</div>
                {[
                  { t: "Login redirect loop on SSO", p: "Critical", c: "text-p-critical" },
                  { t: "Repo analysis timing out", p: "High", c: "text-p-high" },
                  { t: "Attachment upload fails >8MB", p: "Medium", c: "text-p-medium" },
                ].map((row) => (
                  <div key={row.t} className="flex items-center justify-between border-t border-line py-2 first:border-0">
                    <span className="truncate text-[12.5px] text-ink">{row.t}</span>
                    <span className={`ml-3 shrink-0 text-[11.5px] font-medium ${row.c}`}>{row.p}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-accent-line bg-accent-soft/40 p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-accent">
                  <Sparkles className="size-3.5" strokeWidth={2} /> AI insight
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-ink">
                  Likely cause: expired refresh token not refreshed before redirect. Suggested fix in{" "}
                  <span className="font-mono text-[11.5px]">auth/session.ts</span>.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Trust strip */}
      <Reveal as="section" className="border-y border-line bg-surface/60">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-8 text-center sm:grid-cols-4">
          {[
            { label: "Real-time sync", icon: Zap },
            { label: "Role-based security", icon: ShieldCheck },
            { label: "Live analytics", icon: BarChart3 },
            { label: "Team workload view", icon: Users },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-2">
              <item.icon className="size-4 text-ink-faint" strokeWidth={2} />
              <span className="text-[12px] font-medium text-ink-muted">{item.label}</span>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-24">
        <Reveal className="mx-auto max-w-xl text-center">
          <span className="text-[12px] font-semibold uppercase tracking-wide text-accent">Features</span>
          <h2 className="mt-2 font-display text-[26px] font-semibold tracking-tight text-ink sm:text-[30px]">
            Everything a support team actually needs
          </h2>
          <p className="mt-3 text-[14px] text-ink-muted">
            No fake widgets, no filler dashboards — every number and every insight comes from real backend data.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 60}>
              <div className="group h-full rounded-xl border border-line bg-surface p-5 transition-all duration-200 hover:-translate-y-1 hover:border-accent-line hover:shadow-md">
                <div className="flex size-9 items-center justify-center rounded-lg bg-accent-soft text-accent transition-transform duration-200 group-hover:scale-110">
                  <f.icon className="size-[18px]" strokeWidth={2} />
                </div>
                <h3 className="mt-4 text-[14.5px] font-semibold text-ink">{f.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{f.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="border-t border-line bg-surface-alt/40 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal className="mx-auto max-w-xl text-center">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-accent">Workflow</span>
            <h2 className="mt-2 font-display text-[26px] font-semibold tracking-tight text-ink sm:text-[30px]">
              From report to resolution
            </h2>
          </Reveal>

          <div className="relative mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div
              className="pointer-events-none absolute top-5 hidden h-px w-full bg-line-strong lg:block"
              aria-hidden="true"
            />
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 90} className="relative">
                <div className="flex size-10 items-center justify-center rounded-full border border-line-strong bg-surface font-display text-[14px] font-semibold text-accent shadow-sm">
                  {i + 1}
                </div>
                <h3 className="mt-4 text-[14px] font-semibold text-ink">{step.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{step.description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Portals / sign in */}
      <section id="portals" className="mx-auto max-w-6xl px-5 py-24">
        <Reveal className="mx-auto max-w-xl text-center">
          <span className="text-[12px] font-semibold uppercase tracking-wide text-accent">Sign in</span>
          <h2 className="mt-2 font-display text-[26px] font-semibold tracking-tight text-ink sm:text-[30px]">
            Choose your workspace
          </h2>
          <p className="mt-3 text-[14px] text-ink-muted">
            Client, employee, and admin experiences each have their own dedicated sign-in.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PORTALS.map((p, i) => (
            <Reveal key={p.role} delay={i * 80}>
              <Link
                to={p.to}
                className="group flex h-full flex-col rounded-xl border border-line bg-surface p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:border-accent-line hover:shadow-md"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-surface-sunken text-ink-muted transition-colors group-hover:bg-accent-soft group-hover:text-accent">
                  <p.icon className="size-5" strokeWidth={2} />
                </div>
                <h3 className="mt-4 text-[15px] font-semibold text-ink">{p.role}</h3>
                <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-ink-muted">{p.description}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-accent">
                  {p.cta}
                  <ArrowRight
                    className="size-3.5 transition-transform duration-200 group-hover:translate-x-1"
                    strokeWidth={2}
                  />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200} className="mx-auto mt-6 max-w-md text-center">
          <p className="text-[12.5px] text-ink-faint">
            New to Threadline?{" "}
            <Link to="/signup" className="font-medium text-accent hover:underline">
              Create a client account
            </Link>{" "}
            to start raising tickets.
          </p>
        </Reveal>
      </section>

      {/* Closing CTA */}
      <Reveal as="section" className="border-t border-line">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center">
          <h2 className="font-display text-[24px] font-semibold tracking-tight text-ink sm:text-[28px]">
            Ready to stop losing track of tickets?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[14px] text-ink-muted">
            Set up takes minutes. Your team can be triaging with AI assistance today.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/signup"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-accent px-6 text-[14px] font-medium text-ink-on-accent shadow-md transition-all hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-lg sm:w-auto"
            >
              Get started free
              <ArrowRight className="size-4" strokeWidth={2} />
            </Link>
            <Link
              to="/admin/login"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-line-strong bg-surface px-6 text-[14px] font-medium text-ink transition-colors hover:bg-surface-alt sm:w-auto"
            >
              Admin sign in
            </Link>
          </div>
        </div>
      </Reveal>

      {/* Footer */}
      <footer className="border-t border-line bg-surface-alt/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-accent text-ink-on-accent">
              <GitBranch className="size-3.5" strokeWidth={2.5} />
            </div>
            <span className="font-display text-[13px] font-semibold tracking-tight text-ink">Threadline</span>
          </div>
          <div className="flex items-center gap-5 text-[12.5px] text-ink-faint">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" strokeWidth={2} /> Built for real teams
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" strokeWidth={2} /> Live status, always
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
