import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Send, AlertTriangle, TriangleAlert } from "lucide-react";
import Topbar from "../../components/Topbar";
import Button from "../../components/Button";
import Select from "../../components/Select";
import LoadingState from "../../components/LoadingState";
import EmptyState from "../../components/EmptyState";
import StatusBadge from "../../components/StatusBadge";
import PriorityTag from "../../components/PriorityTag";
import CodeAnalysis from "../../components/CodeAnalysis";
import RepoAnalysis from "../../components/RepoAnalysis";
import TicketTimeline from "../../components/TicketTimeline";
import Modal from "../../components/Modal";
import Textarea from "../../components/Textarea";
import Badge from "../../components/Badge";
import AttachmentList from "../../components/AttachmentList";
import {
  getTicketById,
  getTicketActivity,
  updateTicket,
  addTicketActivity,
  analyzeTicketCode,
  analyzeTicketRepository,
  escalateTicket,
} from "../../lib/api";
import { adaptTicket, adaptActivity } from "../../lib/adapters";
import { STATUSES } from "../../data/mockTickets";

export default function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [activity, setActivity] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiNotice, setAiNotice] = useState("");

  // "Unable to Resolve" / escalate-to-admin state
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [escalateReason, setEscalateReason] = useState("");
  const [escalating, setEscalating] = useState(false);
  const [escalateError, setEscalateError] = useState("");

  const reload = async () => {
    const [t, a] = await Promise.all([getTicketById(id), getTicketActivity(id)]);
    const x = adaptTicket(t);
    setTicket(x);
    setStatus(x.status);
    setActivity(a.map(adaptActivity));
  };

  useEffect(() => {
    reload()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <>
        <Topbar eyebrow="My tickets" title="Loading ticket..." />
        <div className="p-6">
          <LoadingState rows={5} />
        </div>
      </>
    );
  }

  if (error || !ticket) {
    return (
      <>
        <Topbar eyebrow="My tickets" title="Ticket not found" />
        <div className="p-6">
          <EmptyState icon={AlertTriangle} title="Couldn't load ticket" description={error} />
        </div>
      </>
    );
  }

  const save = async () => {
    setSaving(true);
    try {
      await updateTicket(id, { status });
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const analyze = async () => {
    setAnalyzing(true);
    setAiError("");
    try {
      const r = await analyzeTicketRepository(id);
      setTicket((x) => ({ ...x, repoAnalysis: r.analysis }));
      await reload();
    } catch (e) {
      setAiError(e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const analyzeCode = async () => {
    setAnalyzing(true);
    setAiError("");
    setAiNotice("");
    try {
      const result = await analyzeTicketCode(id);
      if (result.status === "no_code_attachment") {
        setAiNotice(result.message);
      } else {
        setTicket((current) => ({ ...current, aiAnalysis: result.analysis }));
        const events = await getTicketActivity(id);
        setActivity(events.map(adaptActivity));
      }
    } catch (e) {
      setAiError(e.message || "AI analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  const send = async () => {
    if (!comment.trim()) return;
    setSending(true);
    try {
      await addTicketActivity(id, comment.trim());
      setComment("");
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const openEscalateModal = () => {
    setEscalateReason("");
    setEscalateError("");
    setEscalateOpen(true);
  };

  const submitEscalate = async () => {
    if (!escalateReason.trim()) {
      setEscalateError("A reason is required to escalate this ticket.");
      return;
    }
    setEscalating(true);
    setEscalateError("");
    try {
      await escalateTicket(id, escalateReason.trim());
      setEscalateOpen(false);
      await reload();
    } catch (e) {
      setEscalateError(e.message || "Couldn't escalate this ticket.");
    } finally {
      setEscalating(false);
    }
  };

  const isEscalated = !!ticket.escalation?.escalatedToAdmin;

  return (
    <>
      <Topbar
        eyebrow={`${ticket.id} · Assigned to you`}
        title={ticket.title}
        actions={
          <div className="flex items-center gap-2">
            {isEscalated && (
              <Badge tone="warning" className="gap-1">
                <TriangleAlert className="size-3" strokeWidth={2} />
                Escalated to Admin
              </Badge>
            )}
            <Button variant="ghost" size="sm" icon={ChevronLeft} onClick={() => navigate(-1)}>
              Back
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
          <div className="flex flex-col gap-5">
            <div className="rounded-lg border border-line bg-surface p-5">
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={ticket.status} />
                <PriorityTag priority={ticket.priority} />
              </div>
              <p className="mt-4 text-[13.5px] leading-relaxed text-ink">{ticket.description}</p>
              <AttachmentList ticketId={ticket.routeId} attachments={ticket.attachments} />
              {ticket.githubRepo && (
                <div className="mt-4 rounded-md border border-line bg-surface-alt/60 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
                      Connected repository
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px] text-ink">
                    <span className="font-medium">{ticket.githubRepo.fullName}</span>
                    <span className="text-ink-faint">·</span>
                    <span className="font-mono text-[11.5px] text-ink-faint">{ticket.githubRepo.branch}</span>
                    {ticket.githubRepo.htmlUrl && (
                      <a
                        href={ticket.githubRepo.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-auto text-[11.5px] text-accent hover:underline"
                      >
                        View repository ↗
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {isEscalated && (
              <div className="rounded-lg border border-line bg-warning-soft/40 p-5">
                <div className="mb-2 flex items-center gap-2">
                  <TriangleAlert className="size-4 text-warning" strokeWidth={2} />
                  <h3 className="text-[13px] font-semibold text-ink">Escalated to Admin</h3>
                </div>
                <p className="text-[12.5px] text-ink-faint">
                  {ticket.escalation.escalatedAt ? `Escalated on ${new Date(ticket.escalation.escalatedAt).toLocaleString()}. ` : ""}
                  Admin will review and may reassign this ticket.
                </p>
                <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-ink">
                  {ticket.escalation.reason}
                </p>
              </div>
            )}

            {ticket.githubRepo ? (
              <RepoAnalysis
                repository={ticket.githubRepo}
                analysis={ticket.repoAnalysis}
                analyzing={analyzing}
                error={aiError}
                onAnalyze={analyze}
              />
            ) : (
              <CodeAnalysis
                analysis={ticket.aiAnalysis}
                analyzing={analyzing}
                error={aiError}
                notice={aiNotice}
                onAnalyze={analyzeCode}
              />
            )}

            <div className="rounded-lg border border-line bg-surface p-5">
              <h3 className="mb-4 text-[13px] font-semibold text-ink">Activity & notes</h3>
              <TicketTimeline events={activity} />
              <div className="mt-5 flex gap-2 border-t border-line pt-4">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add an investigation or resolution note..."
                  className="min-h-[42px] flex-1 rounded-md border border-line-strong bg-surface px-3 py-2 text-[13px] outline-none"
                />
                <Button variant="primary" icon={Send} onClick={send} loading={sending}>
                  Send
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="rounded-lg border border-line bg-surface p-4 h-fit">
              <h3 className="mb-3 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
                Update ticket
              </h3>
              <Select
                id="employee-status"
                label="Status"
                options={STATUSES}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              />
              <Button className="mt-3 w-full" variant="primary" onClick={save} loading={saving}>
                Save status
              </Button>
            </div>

            <div className="rounded-lg border border-line bg-surface p-4 h-fit">
              <h3 className="mb-3 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
                Need help?
              </h3>
              {isEscalated ? (
                <div className="flex flex-col gap-1.5">
                  <Badge tone="warning" className="w-fit gap-1">
                    <TriangleAlert className="size-3" strokeWidth={2} />
                    Escalated to Admin
                  </Badge>
                  <p className="text-[11.5px] text-ink-faint">
                    Admin has been notified and will follow up or reassign this ticket.
                  </p>
                </div>
              ) : (
                <>
                  <p className="mb-3 text-[11.5px] text-ink-faint">
                    Stuck on this ticket? Send it back to Admin for further investigation or reassignment.
                  </p>
                  <Button
                    variant="secondary"
                    className="w-full border-warning/40 text-warning hover:bg-warning-soft"
                    icon={TriangleAlert}
                    onClick={openEscalateModal}
                  >
                    Unable to Resolve
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={escalateOpen}
        onClose={() => (escalating ? null : setEscalateOpen(false))}
        title="Escalate ticket to Admin?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEscalateOpen(false)} disabled={escalating}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submitEscalate} loading={escalating}>
              Escalate to Admin
            </Button>
          </>
        }
      >
        <p className="text-[12.5px] leading-relaxed text-ink-muted">
          Are you unable to resolve this ticket? It will be sent back to Admin for further
          investigation or reassignment.
        </p>
        <Textarea
          id="escalate-reason"
          label="Reason (required)"
          hint='e.g. "AI suggested a fix but the issue still occurs."'
          className="mt-3"
          value={escalateReason}
          onChange={(e) => setEscalateReason(e.target.value)}
          error={escalateError}
        />
      </Modal>
    </>
  );
}
