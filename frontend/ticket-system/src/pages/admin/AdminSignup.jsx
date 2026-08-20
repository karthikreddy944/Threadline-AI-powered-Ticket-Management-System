import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Copy } from "lucide-react";
import AuthShell from "../../components/AuthShell";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { registerAdmin } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export default function AdminSignup() {
  const navigate = useNavigate();
  const { loginWithData } = useAuth();
  const [form, setForm] = useState({ organizationName: "", name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState(""); const [submitting, setSubmitting] = useState(false);
  // Holds the freshly-created organization/admin code so it can be shown
  // once, right after registration, before the admin continues on to the
  // dashboard. `pendingSession` defers loginWithData/navigate until the
  // admin has acknowledged the code.
  const [createdOrg, setCreatedOrg] = useState(null);
  const [pendingSession, setPendingSession] = useState(null);
  const [copied, setCopied] = useState(false);

  const update = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await registerAdmin(form);
      setPendingSession(data);
      setCreatedOrg(data?.user?.organization || null);
    } catch (err) {
      setError(err.message || "Could not create organization");
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = async () => {
    if (!createdOrg?.adminCode) return;
    try {
      await navigator.clipboard.writeText(createdOrg.adminCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (_) {
      // Clipboard API may be unavailable (e.g. insecure context); the
      // code is still visible on screen for the admin to copy manually.
    }
  };

  const continueToDashboard = () => {
    if (pendingSession) loginWithData(pendingSession);
    navigate("/admin", { replace: true });
  };

  if (createdOrg) {
    return (
      <AuthShell
        eyebrow="Organization created"
        title="Save your Admin Code"
        description="Share this code with your clients so they can register under your organization. You can always find it again in Settings."
        footer={null}
      >
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-accent-line bg-accent-soft/30 p-5">
            <p className="text-[12px] text-ink-muted">{createdOrg.name}</p>
            <div className="mt-3 flex items-center justify-between rounded-md border border-line bg-surface px-3 py-2.5">
              <span className="font-mono text-[15px] font-semibold tracking-wide text-ink">{createdOrg.adminCode}</span>
              <Button type="button" variant="secondary" size="sm" icon={copied ? Check : Copy} onClick={copyCode}>
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
          <p className="text-[12px] text-ink-faint">
            This code is not a password — it only identifies your organization so clients can join it.
            Keep it handy; it will not be shown as a one-time secret again, but you can always view it under Admin &rsaquo; Settings.
          </p>
          <Button type="button" variant="primary" size="lg" className="w-full" onClick={continueToDashboard}>
            Continue to dashboard
          </Button>
        </div>
      </AuthShell>
    );
  }

  return <AuthShell eyebrow="Threadline for Admins" title="Create your organization" description="Create the workspace that will own your clients, employees, tickets and GitHub repository." footer={<>Already have an admin account? <Link to="/admin/login" className="font-medium text-accent hover:underline">Admin sign in</Link></>}>
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Input id="org-name" label="Organization name" placeholder="e.g. Acme Technologies" value={form.organizationName} onChange={update("organizationName")} required />
      <Input id="admin-name" label="Admin name" placeholder="Your full name" value={form.name} onChange={update("name")} required />
      <Input id="admin-email" label="Admin email" type="email" placeholder="admin@company.com" value={form.email} onChange={update("email")} required />
      <Input id="admin-password" label="Password" type="password" placeholder="At least 6 characters" value={form.password} onChange={update("password")} required />
      <Input id="admin-confirm" label="Confirm password" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={update("confirmPassword")} required />
      {error && <p className="text-[12.5px] text-danger">{error}</p>}
      <Button type="submit" variant="primary" size="lg" className="w-full" loading={submitting}>{submitting ? "Creating organization" : "Create organization"}</Button>
    </form>
  </AuthShell>;
}
