import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ChevronLeft, Send, FileQuestion, TriangleAlert } from "lucide-react";
import Topbar from "../../components/Topbar";
import StatusBadge from "../../components/StatusBadge";
import PriorityTag from "../../components/PriorityTag";
import CodeAnalysis from "../../components/CodeAnalysis";
import RepoAnalysis from "../../components/RepoAnalysis";
import TicketTimeline from "../../components/TicketTimeline";
import WorkflowStrip from "../../components/WorkflowStrip";
import Button from "../../components/Button";
import Select from "../../components/Select";
import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";
import AttachmentList from "../../components/AttachmentList";
import Badge from "../../components/Badge";
import { STATUSES } from "../../data/mockTickets";
import {
  getTicketById,
  getTicketActivity,
  addTicketActivity,
  updateTicket,
  getEmployees,
  getAllocationSettings,
  autoAssignTicket,
  analyzeTicketCode,
  analyzeTicketRepository,
} from "../../lib/api";
import { adaptTicket, adaptActivity } from "../../lib/adapters";
import { formatDateTime } from "../../lib/format";

export default function AdminTicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [activity, setActivity] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [allocation, setAllocation] = useState({ mode: "manual" });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [status, setStatus] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveNote, setSaveNote] = useState("");

  const [autoAssigning, setAutoAssigning] = useState(false);
  const [autoAssignNote, setAutoAssignNote] = useState("");

  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiNotice, setAiNotice] = useState("");
  const [repoAnalyzing, setRepoAnalyzing] = useState(false);
  const [repoError, setRepoError] = useState("");

  const load = () => {
    setLoading(true);
    setNotFound(false);
    Promise.all([getTicketById(id), getTicketActivity(id), getEmployees(), getAllocationSettings()])
      .then(([t, a, employeeUsers, settings]) => {
        const adapted = adaptTicket(t);
        setTicket(adapted);
        setStatus(adapted.status);
        setAssignedToId(adapted.assignedToId || "");
        setActivity(a.map(adaptActivity));
        setAdmins(employeeUsers);
        setAllocation(settings);
      })
      .catch((err) => {
        if (err.status === 404 || err.status === 403) setNotFound(true);
      })
      .finally(() => setLoading(false));
  };

  const handleAutoAssign = async () => {
    setAutoAssigning(true);
    setAutoAssignNote("");
    try {
      const updated = await autoAssignTicket(ticket.routeId);
      const adapted = adaptTicket(updated);
      setTicket(adapted);
      setStatus(adapted.status);
      setAssignedToId(adapted.assignedToId || "");
      setAutoAssignNote(`Assigned to ${adapted.assignedTo || "an employee"}.`);
      getTicketActivity(id).then((a) => setActivity(a.map(adaptActivity)));
    } catch (err) {
      setAutoAssignNote(err.message || "Automatic assignment failed.");
    } finally {
      setAutoAssigning(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setSaveNote("");
    try {
      const updated = await updateTicket(id, {
        status,
        assignedTo: assignedToId || null,
      });
      const adapted = adaptTicket(updated);
      setTicket(adapted);
      setStatus(adapted.status);
      setAssignedToId(adapted.assignedToId || "");
      setSaveNote("Saved.");
      // Status/assignment changes are logged as activity server-side; refresh the timeline.
      getTicketActivity(id).then((a) => setActivity(a.map(adaptActivity)));
    } catch (err) {
      setSaveNote(err.message || "Couldn't save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyzeCode = async () => {
    setAiAnalyzing(true);
    setAiError("");
    setAiNotice("");
    try {
      const result = await analyzeTicketCode(ticket.routeId);
      if (result.status === "no_code_attachment") {
        setAiNotice(result.message);
      } else {
        setTicket((prev) => ({ ...prev, aiAnalysis: result.analysis }));
        // Analysis is logged as activity server-side; refresh the timeline.
        getTicketActivity(id).then((a) => setActivity(a.map(adaptActivity)));
      }
    } catch (err) {
      setAiError(err.message || "AI analysis failed.");
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleAnalyzeRepository = async () => {
    setRepoAnalyzing(true); setRepoError("");
    try {
      const result = await analyzeTicketRepository(ticket.routeId);
      setTicket((prev) => ({ ...prev, repoAnalysis: result.analysis }));
      getTicketActivity(id).then((a) => setActivity(a.map(adaptActivity)));
    } catch (err) { setRepoError(err.message || "Repository analysis failed."); }
    finally { setRepoAnalyzing(false); }
  };

  const handleSendComment = async () => {
    if (!comment.trim()) return;
    setSending(true);
    try {
      await addTicketActivity(id, comment.trim());
      setComment("");
      const a = await getTicketActivity(id);
      setActivity(a.map(adaptActivity));
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <>
        <Topbar eyebrow="Ticket queue" title="Loading ticket..." />
        <div className="flex-1 px-6 py-6">
          <LoadingState rows={4} />
        </div>
      </>
    );
  }

  if (notFound || !ticket) {
    return (
      <>
        <Topbar eyebrow="Ticket queue" title="Ticket not found" />
        <div className="flex-1 px-6 py-6">
          <EmptyState icon={FileQuestion} title="We couldn't find that ticket" description={`No ticket matches ${id}.`} />
        </div>
      </>
    );
  }

  // Only ACTIVE employees may receive a ticket, manually or automatically.
  // Only active employees can be *newly* assigned, but if the ticket
  // is currently assigned to someone who has since been deactivated,
  // keep them selectable (marked Inactive) so the dropdown reflects
  // reality and re-saving without changing it doesn't break.
  const activeEmployees = admins.filter((a) => a.isActive !== false);
  const currentAssignee = admins.find((a) => a._id === assignedToId);
  const dropdownEmployees =
    currentAssignee && currentAssignee.isActive === false
      ? [...activeEmployees, currentAssignee]
      : activeEmployees;
  const assigneeOptions = dropdownEmployees.map((a) => ({
    value: a._id,
    label: a.isActive === false ? `${a.name} · ${a.email} (Inactive)` : `${a.name} · ${a.email}`,
  }));
  const isAutomaticMode = allocation.mode === "automatic";

  return (
    <>
      <Topbar
        eyebrow={`${ticket.id} · ${ticket.requester || "Unknown requester"}`}
        title={ticket.title}
        actions={
          <div className="flex items-center gap-2">
            {ticket.escalation?.escalatedToAdmin && (
              <Badge tone="warning" className="gap-1">
                <TriangleAlert className="size-3" strokeWidth={2} />
                Escalated
              </Badge>
            )}
            <Button variant="ghost" size="sm" icon={ChevronLeft} onClick={() => navigate(-1)}>
              Back to queue
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mb-5">
          <WorkflowStrip current={status} />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
          <div className="flex flex-col gap-5">
            <div className="rounded-lg border border-line bg-surface p-5">
              <div className="mb-1 flex items-center gap-2">
                <span className="font-mono text-[11.5px] text-ink-faint">{ticket.id}</span>
                <span className="text-ink-faint">·</span>
                <span className="text-[11.5px] text-ink-faint">Opened {formatDateTime(ticket.created)}</span>
                {ticket.requester && (
                  <>
                    <span className="text-ink-faint">·</span>
                    <span className="text-[11.5px] text-ink-faint">Reported by {ticket.requester}</span>
                  </>
                )}
              </div>
              <p className="text-[13.5px] leading-relaxed text-ink">{ticket.description}</p>

              {ticket.githubRepo && (
                <div className="mt-4 rounded-md border border-line bg-surface-alt/60 p-3">
                  <div className="flex items-center gap-2"><span className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">Connected repository</span></div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px] text-ink">
                    <span className="font-medium">{ticket.githubRepo.fullName}</span><span className="text-ink-faint">·</span><span className="font-mono text-[11.5px] text-ink-faint">{ticket.githubRepo.branch}</span>
                    {ticket.githubRepo.htmlUrl && <a href={ticket.githubRepo.htmlUrl} target="_blank" rel="noreferrer" className="ml-auto text-[11.5px] text-accent hover:underline">View repository ↗</a>}
                  </div>
                </div>
              )}

              <AttachmentList ticketId={ticket.routeId} attachments={ticket.attachments} />
            </div>

            {ticket.escalation?.escalatedToAdmin && (
              <div className="rounded-lg border border-line bg-warning-soft/40 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <TriangleAlert className="size-4 text-warning" strokeWidth={2} />
                  <h3 className="text-[13px] font-semibold text-ink">Employee Escalation</h3>
                </div>
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">Escalated by</dt>
                    <dd className="mt-0.5 text-[13px] text-ink">{ticket.escalation.escalatedByName || "Unknown"}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">Escalated at</dt>
                    <dd className="mt-0.5 text-[13px] text-ink">{formatDateTime(ticket.escalation.escalatedAt)}</dd>
                  </div>
                </dl>
                <div className="mt-3">
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">Reason</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-ink">{ticket.escalation.reason}</dd>
                </div>
                <p className="mt-3 text-[11.5px] text-ink-faint">
                  Reassign this ticket below to resolve the escalation — the previous employee's history is kept.
                </p>
              </div>
            )}

            {ticket.githubRepo ? <RepoAnalysis repository={ticket.githubRepo} analysis={ticket.repoAnalysis} analyzing={repoAnalyzing} error={repoError} onAnalyze={handleAnalyzeRepository} /> : (
              <CodeAnalysis
              analysis={ticket.aiAnalysis}
              analyzing={aiAnalyzing}
              error={aiError}
              notice={aiNotice}
              onAnalyze={handleAnalyzeCode}
              />
            )}

            <div className="rounded-lg border border-line bg-surface p-5">
              <h3 className="mb-4 text-[13px] font-semibold text-ink">Activity</h3>
              {activity.length > 0 ? (
                <TicketTimeline events={activity} />
              ) : (
                <p className="text-[12.5px] text-ink-faint">No activity yet.</p>
              )}

              <div className="mt-5 flex items-start gap-2 border-t border-line pt-4">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add an internal note or reply to the requester..."
                  className="min-h-[38px] flex-1 resize-none rounded-md border border-line-strong bg-surface px-3 py-2 text-[13px] outline-none focus:border-accent focus:ring-2 focus:ring-accent-line"
                />
                <Button variant="primary" size="md" icon={Send} onClick={handleSendComment} loading={sending}>
                  Send
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="rounded-lg border border-line bg-surface p-4">
              <h3 className="mb-3 text-[11px] font-medium uppercase tracking-wide text-ink-faint">Triage</h3>
              <div className="flex flex-col gap-3">
                <Select
                  id="status-update"
                  label="Status"
                  options={STATUSES}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                />
                {isAutomaticMode ? (
                  <div className="flex flex-col gap-2">
                    <span className="text-[12.5px] font-medium text-ink">Assigned to</span>
                    <span className="text-[12.5px] text-ink">{ticket.assignedTo || "Unassigned"}</span>
                    <Button variant="secondary" className="w-full" onClick={handleAutoAssign} loading={autoAssigning}>
                      Automatically assign
                    </Button>
                    {autoAssignNote && <p className="text-[11.5px] text-ink-faint">{autoAssignNote}</p>}
                  </div>
                ) : (
                  <Select
                    id="assignee-update"
                    label="Assigned to"
                    options={assigneeOptions}
                    value={assignedToId}
                    placeholder="Unassigned"
                    onChange={(e) => setAssignedToId(e.target.value)}
                  />
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[12px] text-ink-faint">Priority</span>
                  <PriorityTag priority={ticket.priority} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-ink-faint">Category</span>
                  <span className="text-[12.5px] text-ink">{ticket.category}</span>
                </div>
                <Button variant="primary" className="mt-1 w-full" onClick={handleSave} loading={saving}>
                  Save changes
                </Button>
                {saveNote && (
                  <p className={`text-[11.5px] ${saveNote === "Saved." ? "text-success" : "text-danger"}`}>
                    {saveNote}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-line bg-surface p-4">
              <h3 className="mb-3 text-[11px] font-medium uppercase tracking-wide text-ink-faint">Details</h3>
              <dl className="flex flex-col gap-3">
                <Row label="Current status"><StatusBadge status={status} /></Row>
                <Row label="Created">
                  <span className="text-[12.5px] text-ink">{formatDateTime(ticket.created)}</span>
                </Row>
                <Row label="Last updated">
                  <span className="text-[12.5px] text-ink">{formatDateTime(ticket.updated)}</span>
                </Row>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-[12px] text-ink-faint">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
