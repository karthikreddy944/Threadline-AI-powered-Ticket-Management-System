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
  Shield,
  FilePenLine,
  Layers3,
  CircleDotDashed,
  TicketCheck,
  Activity,
  UsersRound,
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
  {
    icon: FilePenLine,
    title: "Repository workspace",
    description:
      "Browse, edit, and commit supported source files to the organization’s connected GitHub repository without exposing access tokens.",
  },
  {
    icon: Shield,
    title: "Platform controls",
    description:
      "Platform Operations manages organization subscriptions, company access, and per-organization AI availability from one secure console.",
  },
  {
    icon: Layers3,
    title: "Multi-tenant by design",
    description:
      "Every client, employee, ticket, repository, and AI result stays isolated within its own organization.",
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
  {
    icon: Shield,
    role: "Platform Operations",
    description: "Manage company access, subscriptions, and AI availability across Threadline.",
    to: "/platform/login",
    cta: "Platform sign in",
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
      <HeroSignals />

      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/80 backdrop-blur-md">
        <div className="flex h-16 w-full items-center justify-between px-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-accent text-ink-on-accent shadow-sm">
              <GitBranch className="size-4" strokeWidth={2.5} />
            </div>
            <span className="font-display text-[16px] font-semibold tracking-tight text-ink">Threadline</span>
          </div>
          <nav className="hidden items-center gap-6 lg:flex">
            <a href="#features" className="text-[13px] font-medium text-ink-muted hover:text-ink">Features</a>
            <a href="#workflow" className="text-[13px] font-medium text-ink-muted hover:text-ink">How it works</a>
            <a href="#portals" className="text-[13px] font-medium text-ink-muted hover:text-ink">Workspaces</a>
            <Link to="/platform/login" className="text-[13px] font-medium text-ink-muted hover:text-ink">Platform</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="hidden h-8 items-center rounded-md px-3 text-[13px] font-medium text-ink-muted hover:bg-surface-alt hover:text-ink md:inline-flex"
            >
              Client sign in
            </Link>
            <Link
              to="/admin/signup"
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
              to="/admin/signup"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-accent px-6 text-[14px] font-medium text-ink-on-accent shadow-md transition-all hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-lg sm:w-auto"
            >
              Create your organization
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

      <Reveal as="section" className="mx-auto -mt-8 max-w-6xl px-5 pb-12 sm:-mt-10">
        <div className="grid overflow-hidden rounded-2xl border border-line bg-surface shadow-sm sm:grid-cols-3">
          {[
            ["One workspace", "Tickets, source context, and collaboration in a single flow."],
            ["AI with control", "Platform and organization-level controls keep AI access deliberate."],
            ["Built for teams", "Dedicated client, employee, admin, and platform workspaces."],
          ].map(([title, text], index) => (
            <div key={title} className={`p-5 ${index ? "border-t border-line sm:border-l sm:border-t-0" : ""}`}>
              <p className="text-[13px] font-semibold text-ink">{title}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">{text}</p>
            </div>
          ))}
        </div>
      </Reveal>

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
            From support request to source-level resolution
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

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              Join an organization as a client
            </Link>{" "}
            to start raising tickets.
          </p>
        </Reveal>
      </section>

      {/* Closing CTA */}
      <Reveal as="section" className="relative overflow-hidden border-t border-line bg-surface-alt/40">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden xl:block">
          <div className="absolute left-12 top-12 w-60 animate-float-slow rounded-xl border border-line bg-surface/80 p-4 shadow-sm"><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-warning" /><span className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">Ticket queue</span></div><p className="mt-3 text-[12px] font-medium text-ink">3 tickets waiting for triage</p><div className="mt-3 flex gap-1"><span className="h-1.5 w-12 rounded bg-danger-soft" /><span className="h-1.5 w-8 rounded bg-warning-soft" /><span className="h-1.5 w-16 rounded bg-accent-soft" /></div></div>
          <div className="absolute left-[21rem] top-28 h-px w-36 border-t border-dashed border-accent-line" />
          <div className="absolute right-12 top-16 w-64 animate-float rounded-xl border border-accent-line bg-surface/85 p-4 shadow-sm" style={{ animationDelay: "-3s" }}><div className="flex items-center gap-2"><Sparkles className="size-3.5 text-accent" /><span className="text-[10px] font-semibold uppercase tracking-wide text-accent">AI ready</span></div><p className="mt-3 text-[12px] leading-relaxed text-ink-muted">Repository context, likely causes, and suggested fixes are one click away.</p></div>
          <div className="absolute right-[22rem] top-32 h-px w-32 border-t border-dashed border-accent-line" />
        </div>
        <div className="relative mx-auto max-w-4xl px-5 py-20 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-line bg-accent-soft px-3 py-1 text-[11px] font-medium text-accent"><TicketCheck className="size-3.5" /> Built for the whole support lifecycle</span>
          <h2 className="mt-4 font-display text-[24px] font-semibold tracking-tight text-ink sm:text-[30px]">
            Turn every support ticket into a clear path to resolution.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-ink-muted">
            Set up your organization in minutes, connect GitHub when you are ready, and give every team member the context to move work forward.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/admin/signup"
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
      <footer className="border-t border-line bg-surface">
        <div className="flex w-full flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row sm:px-8 lg:px-12">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-accent text-ink-on-accent">
              <GitBranch className="size-3.5" strokeWidth={2.5} />
            </div>
            <span className="font-display text-[13px] font-semibold tracking-tight text-ink">Threadline</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px] text-ink-faint sm:justify-end">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" strokeWidth={2} /> Built for real teams
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" strokeWidth={2} /> Live status, always
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5" strokeWidth={2} /> Tenant-scoped access
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HeroSignals() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-16 z-0 hidden h-[620px] overflow-hidden 2xl:block">
      <svg className="absolute inset-0 h-full w-full opacity-70" viewBox="0 0 1800 620" fill="none" preserveAspectRatio="none">
        <path d="M0 255 C175 255 160 420 335 420 C440 420 405 520 590 520" stroke="var(--color-accent-line)" strokeWidth="1.5" strokeDasharray="5 8" />
        <path d="M1800 180 C1650 180 1660 350 1490 350 C1380 350 1430 490 1230 490" stroke="var(--color-accent-line)" strokeWidth="1.5" strokeDasharray="5 8" />
        <circle cx="335" cy="420" r="5" fill="var(--color-accent)" /><circle cx="1490" cy="350" r="5" fill="var(--color-accent)" />
      </svg>
      <div className="absolute left-20 top-28 w-56 animate-float-slow rounded-xl border border-line bg-surface/90 p-4 shadow-md backdrop-blur">
        <div className="flex items-center justify-between"><span className="font-mono text-[10px] font-medium text-ink-faint">TKT-00482</span><span className="rounded-full bg-danger-soft px-2 py-0.5 text-[10px] font-medium text-danger">Critical</span></div>
        <p className="mt-3 text-[12.5px] font-semibold text-ink">Checkout timeout</p>
        <div className="mt-3 flex items-center gap-2 text-[10.5px] text-ink-faint"><CircleDotDashed className="size-3 text-accent" /><span>Routing to Payments</span></div>
      </div>
      <div className="absolute left-52 top-[345px] h-36 w-px border-l border-dashed border-accent-line" />
      <div className="absolute left-[17rem] top-[465px] flex size-8 animate-pulse-soft items-center justify-center rounded-full border border-accent-line bg-accent-soft text-accent"><ArrowRight className="size-3.5" /></div>
      <div className="absolute right-20 top-48 w-60 animate-float rounded-xl border border-accent-line bg-surface/95 p-4 shadow-md backdrop-blur" style={{ animationDelay: "-2.5s" }}>
        <div className="flex items-center gap-2 text-accent"><Sparkles className="size-3.5" /><span className="text-[10px] font-semibold uppercase tracking-wide">AI investigation</span></div>
        <p className="mt-3 text-[12px] font-medium leading-relaxed text-ink">Likely root cause found in <span className="font-mono text-[10.5px] text-info">auth/session.ts</span></p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-sunken"><div className="h-full w-3/4 animate-scan rounded-full bg-accent" /></div>
      </div>
      <div className="absolute right-52 top-[410px] w-48 animate-float-slow rounded-xl border border-line bg-surface/90 p-3 shadow-sm backdrop-blur" style={{ animationDelay: "-4s" }}>
        <div className="flex items-center gap-2"><TicketCheck className="size-4 text-success" /><span className="text-[11px] font-semibold text-ink">Resolved</span></div>
        <p className="mt-1 text-[10.5px] text-ink-faint">Customer notified just now</p>
      </div>
      <div className="absolute left-[26rem] top-[495px] flex items-center gap-2 rounded-full border border-line bg-surface/90 px-3 py-2 shadow-sm backdrop-blur">
        <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-success/60" /><span className="relative inline-flex size-2 rounded-full bg-success" /></span>
        <span className="text-[10.5px] font-medium text-ink-muted">All services operational</span>
      </div>
      <div className="absolute right-[25rem] top-[510px] w-52 rounded-xl border border-line bg-surface/90 p-3 shadow-sm backdrop-blur animate-float" style={{ animationDelay: "-1s" }}>
        <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-faint"><UsersRound className="size-3" /> Team load</span><span className="text-[10px] font-medium text-success">Balanced</span></div>
        <div className="mt-3 flex items-end gap-1"><span className="h-3 w-4 rounded-sm bg-accent-soft" /><span className="h-6 w-4 rounded-sm bg-accent-soft" /><span className="h-4 w-4 rounded-sm bg-accent" /><span className="h-8 w-4 rounded-sm bg-accent-soft" /><span className="h-5 w-4 rounded-sm bg-accent-soft" /></div>
      </div>
      <div className="absolute left-[31rem] top-20 flex items-center gap-2 rounded-full border border-info/20 bg-info-soft/60 px-3 py-1.5 text-[10.5px] font-medium text-info animate-float-slow" style={{ animationDelay: "-5s" }}><Activity className="size-3" /> Live ticket activity</div>
    </div>
  );
}
