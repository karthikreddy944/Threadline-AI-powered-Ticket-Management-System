import { useEffect, useState } from "react";
import { AlertTriangle, Check, CheckCircle2, Copy, GitBranch, RotateCw } from "lucide-react";
import Topbar from "../../components/Topbar";
import Input from "../../components/Input";
import Button from "../../components/Button";
import LoadingState from "../../components/LoadingState";
import { getCurrentUser, getOrganization, getAllocationSettings, updateAllocationSettings, getGitHubAuthUrl, getGitHubStatus, isGitHubAuthError } from "../../lib/api";
import { getInitials } from "../../lib/adapters";
import AppearanceSettings from "../../components/AppearanceSettings";

export default function AdminSettings() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);
  const [allocation, setAllocation] = useState({ mode: "manual", strategy: "round_robin", priorityOrder: ["Critical","High","Medium","Low"] });
  const [allocationNote, setAllocationNote] = useState("");

  const [organization, setOrganization] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [github, setGithub] = useState(null);
  const [githubLoading, setGithubLoading] = useState(true);
  const [githubWorking, setGithubWorking] = useState(false);
  const [githubError, setGithubError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      const [profileResult, organizationResult, allocationResult] = await Promise.allSettled([
        getCurrentUser(),
        getOrganization(),
        getAllocationSettings(),
      ]);

      if (!active) return;

      if (profileResult.status === "fulfilled") setProfile(profileResult.value);
      if (organizationResult.status === "fulfilled") setOrganization(organizationResult.value);
      if (allocationResult.status === "fulfilled") setAllocation(allocationResult.value);

      const failed = [profileResult, organizationResult, allocationResult].find((result) => result.status === "rejected");
      if (failed) setLoadError(failed.reason?.message || "Some settings could not be loaded.");
      setLoading(false);
    };

    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;

    getGitHubStatus()
      .then((status) => { if (active) setGithub(status); })
      .catch((error) => {
        if (!active) return;
        setGithubError(isGitHubAuthError(error) ? "Your GitHub authorization has expired." : error.message || "Could not load GitHub connection.");
      })
      .finally(() => { if (active) setGithubLoading(false); });

    return () => { active = false; };
  }, []);

  const reconnectGitHub = async () => {
    setGithubWorking(true);
    setGithubError("");
    try {
      const { url } = await getGitHubAuthUrl();
      window.location.assign(url);
    } catch (error) {
      setGithubError(error.message || "Could not start GitHub reconnection.");
      setGithubWorking(false);
    }
  };

  if (loading) {
    return (
      <>
        <Topbar eyebrow="Account" title="Admin settings" />
        <div className="flex-1 px-6 py-6">
          <LoadingState rows={3} />
        </div>
      </>
    );
  }

  const roleLabel = profile?.role === "admin" ? "Admin" : profile?.role;

  const copyAdminCode = async () => {
    const code = organization?.adminCode || profile?.organization?.adminCode;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 1500);
    } catch (_) {
      // Clipboard API unavailable — the code remains visible to copy manually.
    }
  };

  return (
    <>
      <Topbar eyebrow="Account" title="Admin settings" />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="flex w-full flex-col gap-5">
          {loadError && <p className="text-[12.5px] text-danger">{loadError}</p>}
          <div className="rounded-lg border border-accent-line bg-accent-soft/30 p-5">
            <h3 className="text-[13px] font-semibold text-ink">Organization</h3>
            <p className="mt-1 text-[12px] text-ink-muted">{organization?.name || profile?.organization?.name || "Organization"}</p>
            <div className="mt-3 rounded-md border border-line bg-surface px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11.5px] text-ink-faint">Admin Code</span>
                <span className="font-mono text-[12px] font-semibold tracking-wide text-ink">
                  {organization?.adminCode || profile?.organization?.adminCode || "—"}
                </span>
              </div>
              {(organization?.adminCode || profile?.organization?.adminCode) && (
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={copyAdminCode}
                    className="inline-flex items-center gap-1.5 rounded-md border border-line-strong px-2.5 py-1.5 text-[11.5px] font-medium text-ink hover:bg-surface-alt"
                  >
                    {codeCopied ? <Check size={14} /> : <Copy size={14} />}
                    {codeCopied ? "Copied" : "Copy code"}
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="rounded-lg border border-line bg-surface p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-full bg-surface-sunken text-[13px] font-semibold text-ink">
                {getInitials(profile?.name)}
              </div>
              <div>
                <p className="text-[13.5px] font-semibold text-ink">{profile?.name}</p>
                <p className="text-[12px] text-ink-faint">{roleLabel}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input id="name" label="Full name" defaultValue={profile?.name} />
              <Input id="email" label="Email" defaultValue={profile?.email} disabled />
              <Input id="role" label="Role" defaultValue={roleLabel} disabled />
              <Input id="phone" label="Phone (optional)" placeholder="+91 " />
            </div>
            <div className="mt-4 flex items-center justify-end gap-3 border-t border-line pt-4">
              {note && <span className="text-[12px] text-ink-faint">{note}</span>}
              <Button variant="primary" onClick={() => setNote("Profile editing isn't available yet.")}>
                Save changes
              </Button>
            </div>
          </div>
          <AppearanceSettings />
          <div className="rounded-lg border border-line bg-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-[13px] font-semibold text-ink"><GitBranch className="size-4" /> GitHub connection</h3>
                <p className="mt-1 text-[12px] text-ink-faint">Reconnect GitHub when access has expired or your account permissions have changed.</p>
              </div>
              {github?.connected && !githubError && <CheckCircle2 className="size-4 shrink-0 text-success" />}
            </div>
            <div className="mt-4 rounded-md border border-line bg-surface-alt/60 p-3">
              {githubLoading ? <p className="text-[12px] text-ink-faint">Checking GitHub connection…</p> : githubError ? <p className="flex items-center gap-1.5 text-[12px] text-danger"><AlertTriangle className="size-3.5" />{githubError}</p> : github?.connected ? <div><p className="text-[12.5px] font-medium text-ink">Connected as {github.username || "GitHub account"}</p>{github.repository && <p className="mt-1 text-[11.5px] text-ink-faint">Repository: {github.repository.fullName}</p>}</div> : <p className="text-[12px] text-ink-faint">No GitHub account is connected yet.</p>}
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" size="sm" icon={RotateCw} onClick={reconnectGitHub} loading={githubWorking}>Reconnect GitHub</Button>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-surface p-5">
            <h3 className="mb-1 text-[13px] font-semibold text-ink">Assignment settings</h3>
            <p className="mb-4 text-[12px] text-ink-faint">Choose whether tickets are assigned to employees manually or automatically.</p>

            <div className="flex flex-col gap-2">
              <span className="text-[12.5px] font-medium text-ink">Assignment mode</span>
              <label className="flex items-center gap-2 text-[12.5px] text-ink">
                <input
                  type="radio"
                  name="assignment-mode"
                  value="manual"
                  checked={allocation.mode !== "automatic"}
                  onChange={() => setAllocation({ ...allocation, mode: "manual" })}
                  className="size-3.5 accent-[#0E6B5C]"
                />
                Manual — admin picks the employee for each ticket
              </label>
              <label className="flex items-center gap-2 text-[12.5px] text-ink">
                <input
                  type="radio"
                  name="assignment-mode"
                  value="automatic"
                  checked={allocation.mode === "automatic"}
                  onChange={() => setAllocation({ ...allocation, mode: "automatic" })}
                  className="size-3.5 accent-[#0E6B5C]"
                />
                Automatic — the system assigns each ticket for you
              </label>
            </div>

            {allocation.mode === "automatic" && (
              <div className="mt-4 border-t border-line pt-4">
                <span className="mb-2 block text-[12.5px] font-medium text-ink">Automatic assignment strategy</span>
                <select value={allocation.strategy} onChange={e=>setAllocation({...allocation,strategy:e.target.value})} className="h-9 w-full rounded-md border border-line-strong bg-surface px-2.5 text-[12.5px] text-ink">
                  <option value="round_robin">Round Robin — rotate assignments evenly</option>
                  <option value="priority">Priority Wise — highest priority tickets first, workload-balanced</option>
                  <option value="fifo">FIFO — oldest unassigned ticket first</option>
                </select>
                <div className="mt-3 rounded-md bg-surface-alt/60 p-3 text-[11.5px] text-ink-faint">
                  Only ACTIVE employees participate in automatic assignment. Priority Wise processes Critical → High → Medium → Low tickets first; FIFO processes the oldest created ticket first.
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center justify-end gap-3">{allocationNote&&<span className="text-[12px] text-ink-faint">{allocationNote}</span>}<Button variant="primary" onClick={async()=>{try{const saved=await updateAllocationSettings(allocation);setAllocation(saved);setAllocationNote("Assignment settings saved.")}catch(e){setAllocationNote(e.message)}}}>Save assignment settings</Button></div>
          </div>
          </div>

          <div className="rounded-lg border border-line bg-surface p-5">
            <h3 className="mb-3 text-[13px] font-semibold text-ink">Notification preferences</h3>
            <div className="flex flex-col gap-3">
              <Toggle label="Notify me when a ticket is unassigned for 1 hour" defaultChecked />
              <Toggle label="Notify me on new Critical priority tickets" defaultChecked />
              <Toggle label="Daily digest of queue activity" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Toggle({ label, defaultChecked = false }) {
  return (
    <label className="flex items-center justify-between">
      <span className="text-[12.5px] text-ink">{label}</span>
      <input type="checkbox" defaultChecked={defaultChecked} className="size-4 rounded border-line-strong accent-[#0E6B5C]" />
    </label>
  );
}
