import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Send } from "lucide-react";
import Topbar from "../../components/Topbar";
import StatusBadge from "../../components/StatusBadge";
import PriorityTag from "../../components/PriorityTag";
import TicketTimeline from "../../components/TicketTimeline";
import WorkflowStrip from "../../components/WorkflowStrip";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";
import AttachmentList from "../../components/AttachmentList";
import { getTicketById, getTicketActivity, addTicketActivity } from "../../lib/api";
import { adaptTicket, adaptActivity } from "../../lib/adapters";
import { formatDateTime } from "../../lib/format";
import { FileQuestion } from "lucide-react";

export default function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  const load = () => {
    setLoading(true);
    setNotFound(false);
    Promise.all([getTicketById(id), getTicketActivity(id)])
      .then(([t, a]) => {
        setTicket(adaptTicket(t));
        setActivity(a.map(adaptActivity));
      })
      .catch((err) => {
        if (err.status === 404 || err.status === 403) setNotFound(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSendComment = async () => {
    if (!comment.trim()) return;
    setSending(true);
    try {
      await addTicketActivity(id, comment.trim());
      setComment("");
      load();
    } catch (err) {
      // Surfacing inline is enough here; the activity list simply won't update.
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <>
        <Topbar eyebrow="Support" title="Loading ticket..." />
        <div className="flex-1 px-6 py-6">
          <LoadingState rows={4} />
        </div>
      </>
    );
  }

  if (notFound || !ticket) {
    return (
      <>
        <Topbar eyebrow="Support" title="Ticket not found" />
        <div className="flex-1 px-6 py-6">
          <EmptyState icon={FileQuestion} title="We couldn't find that ticket" description={`No ticket matches ${id}.`} />
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar
        eyebrow={ticket.id}
        title={ticket.title}
        actions={
          <Button variant="ghost" size="sm" icon={ChevronLeft} onClick={() => navigate(-1)}>
            Back
          </Button>
        }
      />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mb-5">
          <WorkflowStrip current={ticket.status} />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_280px]">
          {/* Main column */}
          <div className="flex flex-col gap-5">
            <div className="rounded-lg border border-line bg-surface p-5">
              <div className="mb-1 flex items-center gap-2">
                <span className="font-mono text-[11.5px] text-ink-faint">{ticket.id}</span>
                <span className="text-ink-faint">·</span>
                <span className="text-[11.5px] text-ink-faint">Opened {formatDateTime(ticket.created)}</span>
              </div>
              <p className="text-[13.5px] leading-relaxed text-ink">{ticket.description}</p>

              <AttachmentList ticketId={ticket.routeId} attachments={ticket.attachments} />
            </div>

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
                  placeholder="Add a comment for the support team..."
                  className="min-h-[38px] flex-1 resize-none rounded-md border border-line-strong bg-surface px-3 py-2 text-[13px] outline-none focus:border-accent focus:ring-2 focus:ring-accent-line"
                />
                <Button variant="primary" size="md" icon={Send} onClick={handleSendComment} loading={sending}>
                  Send
                </Button>
              </div>
            </div>
          </div>

          {/* Side column */}
          <div className="flex flex-col gap-3">
            <div className="rounded-lg border border-line bg-surface p-4">
              <h3 className="mb-3 text-[11px] font-medium uppercase tracking-wide text-ink-faint">Details</h3>
              <dl className="flex flex-col gap-3">
                <Row label="Status"><StatusBadge status={ticket.status} /></Row>
                <Row label="Priority"><PriorityTag priority={ticket.priority} /></Row>
                <Row label="Category">
                  <span className="text-[12.5px] text-ink">{ticket.category}</span>
                </Row>
                <Row label="Assigned admin">
                  <span className="text-[12.5px] text-ink">{ticket.assignedTo || "Unassigned"}</span>
                </Row>
                <Row label="Created">
                  <span className="text-[12.5px] text-ink">{formatDateTime(ticket.created)}</span>
                </Row>
                <Row label="Last updated">
                  <span className="text-[12.5px] text-ink">{formatDateTime(ticket.updated)}</span>
                </Row>
              </dl>
            </div>

            <Link to="/app/tickets" className="text-center text-[12.5px] font-medium text-accent hover:underline">
              View all tickets
            </Link>
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
