import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Paperclip, CheckCircle2, ArrowRight, X, FileText, Sparkles, Network, MonitorCog, MonitorSmartphone, KeyRound, MoreHorizontal, ShieldCheck } from "lucide-react";
import Topbar from "../../components/Topbar";
import Input from "../../components/Input";
import Textarea from "../../components/Textarea";
import Button from "../../components/Button";
import { CATEGORIES } from "../../data/mockTickets";
import { createTicket, uploadTicketAttachments } from "../../lib/api";
import { adaptTicket } from "../../lib/adapters";
import {
  MAX_FILES_PER_UPLOAD,
  MAX_FILE_SIZE_LABEL,
  validateFile,
  isImageFile,
} from "../../lib/attachments";

// The backend requires a priority on every ticket. AI-suggested priority
// isn't implemented yet (that's the Day 4 LLM phase), so "Let AI decide"
// falls back to this default rather than being sent as blank.
const DEFAULT_PRIORITY = "Medium";
const ACCEPT_ATTR = "image/*";
const CATEGORY_META = {
  Network: Network,
  Hardware: MonitorSmartphone,
  Software: MonitorCog,
  "Account/Login": KeyRound,
  Other: MoreHorizontal,
};

let fileKeySeed = 0;
const nextFileKey = () => `f${(fileKeySeed += 1)}`;

export default function CreateTicket() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [attachmentWarning, setAttachmentWarning] = useState("");
  const [created, setCreated] = useState(null);

  // Each entry: { key, file, error, previewUrl }. Entries with an `error`
  // are shown (so the person can see why) but excluded from upload.
  const [pendingFiles, setPendingFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (incoming.length === 0) return;

    setPendingFiles((prev) => {
      let remainingSlots = MAX_FILES_PER_UPLOAD - prev.filter((f) => !f.error).length;

      const additions = incoming.map((file) => {
        let fileError = validateFile(file);
        if (!fileError) {
          if (remainingSlots <= 0) {
            fileError = `You can attach up to ${MAX_FILES_PER_UPLOAD} files.`;
          } else {
            remainingSlots -= 1;
          }
        }
        return {
          key: nextFileKey(),
          file,
          error: fileError,
          previewUrl: !fileError && isImageFile(file.name) ? URL.createObjectURL(file) : null,
        };
      });

      return [...prev, ...additions];
    });
  };

  const removeFile = (key) => {
    setPendingFiles((prev) => {
      const target = prev.find((f) => f.key === key);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.key !== key);
    });
  };

  const handleFileInputChange = (e) => {
    addFiles(e.target.files);
    e.target.value = ""; // so picking the same file again after removing it still fires onChange
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setAttachmentWarning("");
    if (!title.trim() || !description.trim() || !category) {
      setError("Please fill in the subject, description and category.");
      return;
    }

    const filesToUpload = pendingFiles.filter((f) => !f.error).map((f) => f.file);

    setSubmitting(true);
    try {
      const ticket = await createTicket({
        title: title.trim(),
        description: description.trim(),
        category,
        priority: DEFAULT_PRIORITY,
      });

      if (filesToUpload.length > 0) {
        try {
          await uploadTicketAttachments(ticket._id, filesToUpload);
        } catch (uploadErr) {
          // The ticket itself was created successfully — don't block on this,
          // just let them know so they can retry from the ticket page.
          setAttachmentWarning(
            uploadErr.message ||
              "The ticket was created, but the attachments couldn't be uploaded. You can try again from the ticket page."
          );
        }
      }

      setCreated(adaptTicket(ticket));
    } catch (err) {
      setError(err.message || "Couldn't submit the ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    return (
      <>
        <Topbar eyebrow="Support" title="Create ticket" />
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="flex w-full max-w-md flex-col items-center rounded-lg border border-line bg-surface px-8 py-10 text-center shadow-sm">
            <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-success-soft text-success">
              <CheckCircle2 className="size-5" strokeWidth={2} />
            </div>
            <span className="font-mono text-[12px] text-ink-faint">{created.id}</span>
            <h2 className="mt-1 font-display text-[16px] font-semibold text-ink">Ticket submitted</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
              Your ticket is now in the queue. You'll see updates here once an admin picks it up.
            </p>
            <div className="mt-4 flex w-full items-center gap-2 rounded-md border border-line bg-surface-alt/60 px-3 py-2.5 text-left">
              <div className="flex flex-col">
                <span className="text-[12px] font-medium text-ink">{created.category} · AI-assisted triage</span>
                <span className="text-[11.5px] text-ink-faint">Your support team will investigate the issue using the organization repository configured by the administrator.</span>
              </div>
            </div>
            {attachmentWarning && (
              <p className="mt-3 text-[12px] leading-relaxed text-warning">{attachmentWarning}</p>
            )}
            <div className="mt-6 flex w-full gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => navigate("/app/tickets")}>
                View my tickets
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                icon={ArrowRight}
                onClick={() => navigate(`/app/tickets/${created.routeId}`)}
              >
                Track this ticket
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar eyebrow="Support" title="Create ticket" />
      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <div className="mx-auto grid w-full max-w-[1320px] gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <form onSubmit={handleSubmit} className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
            <div className="border-b border-line bg-gradient-to-r from-accent-soft/70 via-surface to-surface px-5 py-5 sm:px-6">
              <div className="flex items-start gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-ink-on-accent shadow-sm"><Sparkles className="size-5" /></div><div><h2 className="text-[16px] font-semibold text-ink">Tell us what happened</h2><p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">Add a clear subject and a little context. Your support team will take it from there.</p></div></div>
            </div>
            <div className="flex flex-col gap-6 p-5 sm:p-6">
            <Input
              id="subject"
              label="Subject"
              placeholder="e.g. Wi-Fi disconnecting every 5 minutes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Textarea
              id="description"
              label="Description"
              placeholder="What's happening? Include when it started, where, and anything you've already tried."
              hint="The more detail you give, the easier it is for the support team to help."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <div>
              <div className="mb-2 flex items-center justify-between"><span className="text-[12.5px] font-medium text-ink">What kind of issue is this?</span><span className="text-[11.5px] text-ink-faint">Choose the closest match</span></div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">{CATEGORIES.map((item) => { const Icon = CATEGORY_META[item]; const active = category === item; return <button key={item} type="button" onClick={() => setCategory(item)} className={`flex min-h-20 flex-col items-start justify-between rounded-xl border p-3 text-left transition-all ${active ? "border-accent bg-accent-soft/70 shadow-xs" : "border-line bg-surface hover:border-accent-line hover:bg-surface-alt/50"}`}><Icon className={`size-4 ${active ? "text-accent" : "text-ink-faint"}`} /><span className={`text-[11.5px] font-medium ${active ? "text-accent" : "text-ink-muted"}`}>{item}</span></button>; })}</div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-accent-line bg-accent-soft/45 p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface text-accent shadow-xs"><Sparkles className="size-4" /></div>
              <div><p className="text-[12.5px] font-medium text-ink">Priority is decided by AI triage</p><p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-muted">We use your ticket details and support context to help the team assess urgency—no manual priority is needed.</p></div>
            </div>

            <div className="flex flex-col gap-1.5 rounded-xl border border-line bg-surface-alt/30 p-4">
              <div><span className="text-[12.5px] font-medium text-ink">Add supporting files</span><p className="mt-0.5 text-[11.5px] text-ink-faint">Screenshots, logs, PDFs, and source files can help us resolve this sooner.</p></div>
              <label
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-5 text-[12.5px] transition-colors ${
                  dragActive
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-line-strong text-ink-faint hover:border-accent hover:text-accent"
                }`}
              >
                <Paperclip className="size-3.5" strokeWidth={2} />
                Drop a file here, or click to browse
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ACCEPT_ATTR}
                  className="hidden"
                  onChange={handleFileInputChange}
                />
              </label>
              <span className="text-[11.5px] text-ink-faint">
                Up to {MAX_FILES_PER_UPLOAD} files, {MAX_FILE_SIZE_LABEL} each. Images, PDFs, and common code/text
                files are supported.
              </span>

              {pendingFiles.length > 0 && (
                <div className="mt-1 flex flex-col gap-1.5">
                  {pendingFiles.map((f) => (
                    <div
                      key={f.key}
                      className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[12.5px] ${
                        f.error ? "border-danger/40 bg-danger-soft/40" : "border-line bg-surface-alt/60"
                      }`}
                    >
                      {f.previewUrl ? (
                        <img src={f.previewUrl} alt="" className="size-6 shrink-0 rounded object-cover border border-line" />
                      ) : (
                        <FileText className="size-3.5 shrink-0 text-ink-faint" strokeWidth={2} />
                      )}
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-ink">{f.file.name}</span>
                        {f.error ? (
                          <span className="text-[11px] text-danger">{f.error}</span>
                        ) : (
                          <span className="text-[11px] text-ink-faint">{formatBytes(f.file.size)}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(f.key)}
                        className="flex size-5 shrink-0 items-center justify-center rounded text-ink-faint hover:bg-surface-alt hover:text-ink"
                      >
                        <X className="size-3.5" strokeWidth={2} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="text-[12.5px] text-danger">{error}</p>}

            <div className="mt-1 flex items-center justify-end gap-2 border-t border-line pt-5">
              <Button as={Link} to="/app" variant="ghost">
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting} >
                {submitting ? "Submitting" : "Submit ticket"}
              </Button>
            </div>
            </div>
          </form>
          <aside className="flex flex-col gap-4 xl:sticky xl:top-5 xl:self-start">
            <div className="rounded-xl border border-accent-line bg-accent-soft/45 p-5"><div className="flex items-center gap-2 text-accent"><Sparkles className="size-4" /><span className="text-[12px] font-semibold">Smarter support starts here</span></div><p className="mt-2 text-[12px] leading-relaxed text-ink-muted">Your ticket is linked to your organization’s support workspace, so the right team can investigate with the right context.</p></div>
            <div className="rounded-xl border border-line bg-surface p-5 shadow-xs"><h3 className="text-[13px] font-semibold text-ink">A useful ticket includes</h3><ul className="mt-4 flex flex-col gap-3">{["What you were trying to do", "When and where the issue started", "Any error message or screenshot", "What you have already tried"].map((tip) => <li key={tip} className="flex items-start gap-2 text-[12px] text-ink-muted"><ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success" />{tip}</li>)}</ul></div>
            <div className="rounded-xl border border-line bg-surface-alt/45 p-4"><p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">What happens next</p><div className="mt-3 flex flex-col gap-2 text-[12px] text-ink-muted"><span><b className="text-ink">1.</b> Your ticket joins the queue</span><span><b className="text-ink">2.</b> Support reviews and investigates</span><span><b className="text-ink">3.</b> You receive status updates</span></div></div>
          </aside>
        </div>
      </div>
    </>
  );
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}
