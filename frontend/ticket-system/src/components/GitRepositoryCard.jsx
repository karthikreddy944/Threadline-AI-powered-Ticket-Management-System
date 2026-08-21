import { useEffect, useState } from "react";
import { GitBranch, RotateCw, RefreshCw, Link2Off, CheckCircle2, AlertTriangle } from "lucide-react";
import Button from "./Button";
import {
  getGitHubAuthUrl,
  getGitHubRepos,
  getGitHubStatus,
  selectGitHubRepository,
  disconnectGitHub,
  isGitHubAuthError,
} from "../lib/api";

// NOTE: lucide-react on this project does not export `Github` (importing
// it throws "does not provide an export named 'Github'" at module load).
// GitBranch is used for the header/brand icon instead — see Sidebar.jsx,
// which already relies on the same icon for the same reason.

export default function GitRepositoryCard({ externalAuthExpired = false }) {
  const [status, setStatus] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  // Set when the stored GitHub token itself is expired/revoked (a 401,
  // or a 403 that's clearly a credentials problem) — distinct from any
  // other failure, since only this case is fixed by reconnecting.
  const [authExpired, setAuthExpired] = useState(false);
  const githubAuthExpired = authExpired || externalAuthExpired;

  const load = async () => {
    setLoading(true);
    setError("");
    setAuthExpired(false);
    try {
      const data = await getGitHubStatus();
      setStatus(data);

      if (data.connected && !data.repository) {
        try {
          setRepos(await getGitHubRepos());
        } catch (e) {
          if (isGitHubAuthError(e)) {
            setAuthExpired(true);
            setRepos([]);
          } else {
            throw e;
          }
        }
      } else {
        setRepos([]);
      }
    } catch (e) {
      if (isGitHubAuthError(e)) setAuthExpired(true);
      else setError(e.message || "Could not load GitHub status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Reused by both "Connect GitHub" (first-time) and "Reconnect GitHub"
  // (already connected, or authorization expired) — there is only ever
  // one OAuth flow, started the same way, per the integration brief.
  const startOAuth = async () => {
    setWorking(true);
    setError("");
    try {
      const { url } = await getGitHubAuthUrl();
      window.location.href = url;
    } catch (e) {
      setError(e.message || "Could not start GitHub connection.");
      setWorking(false);
    }
  };

  const choose = async (value) => {
    if (!value) return;
    const [owner, name] = value.split("/");
    setWorking(true);
    setError("");
    try {
      const r = await selectGitHubRepository(owner, name);
      setStatus({ connected: true, username: r.username, repository: r.repository });
      setRepos([]);
      setAuthExpired(false);
    } catch (e) {
      if (isGitHubAuthError(e)) setAuthExpired(true);
      else setError(e.message || "Could not select repository.");
    } finally {
      setWorking(false);
    }
  };

  const disconnect = async () => {
    setWorking(true);
    setError("");
    try {
      await disconnectGitHub();
      setStatus({ connected: false, username: "", repository: null });
      setRepos([]);
      setAuthExpired(false);
    } catch (e) {
      setError(e.message || "Could not disconnect GitHub.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <GitBranch className="size-4 text-ink" />
            <h2 className="text-[13px] font-semibold text-ink">Git Repository</h2>
          </div>
          <p className="mt-1 text-[12px] text-ink-faint">
            Connect one GitHub repository so support can investigate the actual source code.
          </p>
        </div>
        {loading && <RefreshCw className="size-3.5 animate-spin text-ink-faint" />}
      </div>

      {/* STATE 4 — authorization expired/revoked. Takes priority over
          whatever `status` says, since a stale DB record can still say
          "connected" even after GitHub itself has revoked the token. */}
      {!loading && githubAuthExpired && (
        <div className="mt-3 rounded-md border border-danger/40 bg-danger-soft/50 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4 text-danger" />
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-medium text-ink">GitHub authorization expired</div>
              <p className="mt-0.5 text-[11.5px] text-ink-faint">Your GitHub authorization is no longer valid.</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="primary" size="sm" icon={RotateCw} onClick={startOAuth} loading={working}>
              Reconnect GitHub
            </Button>
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={load} loading={working}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* STATE 3 — repository selected. */}
      {!loading && !githubAuthExpired && status?.repository && (
        <div className="mt-3 rounded-md border border-line bg-surface-alt/60 p-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 size-4 text-success" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-medium text-ink">{status.repository.fullName}</div>
              <div className="mt-0.5 flex items-center gap-2 text-[11.5px] text-ink-faint">
                <GitBranch className="size-3" /> {status.repository.branch}
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={load} loading={working}>
              Refresh
            </Button>
            <Button variant="ghost" size="sm" icon={RotateCw} onClick={startOAuth} loading={working}>
              Reconnect GitHub
            </Button>
            <Button variant="ghost" size="sm" icon={Link2Off} onClick={disconnect} loading={working}>
              Disconnect
            </Button>
          </div>
        </div>
      )}

      {/* STATE 2 — connected, repository not selected yet. */}
      {!loading && !githubAuthExpired && !status?.repository && status?.connected && (
        <div className="mt-3 rounded-md border border-accent-line bg-accent-soft/40 p-3">
          <div className="text-[12.5px] font-medium text-ink">GitHub connected as {status.username}</div>
          <p className="mt-1 text-[11.5px] text-ink-faint">Select the repository used for support tickets.</p>
          <select
            className="mt-3 h-8 w-full rounded-md border border-line-strong bg-surface px-2.5 text-[12.5px] text-ink outline-none"
            defaultValue=""
            disabled={working}
            onChange={(e) => choose(e.target.value)}
          >
            <option value="">Select repository…</option>
            {repos.map((r) => (
              <option key={r.id} value={`${r.owner}/${r.name}`}>
                {r.fullName}
                {r.private ? " · private" : ""}
              </option>
            ))}
          </select>
          <div className="mt-3">
            <Button variant="ghost" size="sm" icon={RotateCw} onClick={startOAuth} loading={working}>
              Reconnect GitHub
            </Button>
          </div>
        </div>
      )}

      {/* STATE 1 — nothing connected yet. */}
      {!loading && !githubAuthExpired && !status?.connected && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-line bg-surface-alt/60 p-3">
          <div>
            <div className="text-[12.5px] font-medium text-ink">No repository connected</div>
            <div className="mt-0.5 text-[11.5px] text-ink-faint">Connect GitHub before creating a new support ticket.</div>
          </div>
          <Button variant="primary" size="sm" onClick={startOAuth} loading={working}>
            Connect GitHub
          </Button>
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-[11.5px] text-danger">
          <AlertTriangle className="size-3" />
          {error}
        </div>
      )}
    </div>
  );
}
