import { useEffect, useState } from "react";
import { Paperclip, Download, Loader2, ImageOff } from "lucide-react";
import { fetchAttachmentBlob } from "../lib/api";

/**
 * Renders the "Attachments" strip on a ticket (client or admin view).
 * Downloads are authenticated (JWT via Authorization header), so files
 * are fetched as a blob on click rather than linked directly — see
 * fetchAttachmentBlob in lib/api.js.
 */
export default function AttachmentList({ ticketId, attachments }) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="mt-4 flex flex-col gap-1.5 border-t border-line pt-3">
      {attachments.map((a) => (
        <AttachmentRow key={a.id} ticketId={ticketId} attachment={a} />
      ))}
    </div>
  );
}

function AttachmentRow({ ticketId, attachment }) {
  const [thumbUrl, setThumbUrl] = useState(null);
  const [thumbFailed, setThumbFailed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!attachment.isImage) return;
    let cancelled = false;
    let objectUrl = null;

    fetchAttachmentBlob(ticketId, attachment.id, { inline: true })
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setThumbUrl(url);
      })
      .catch(() => {
        if (!cancelled) setThumbFailed(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId, attachment.id]);

  const handleOpen = async () => {
    setError("");
    setDownloading(true);
    try {
      const url = await fetchAttachmentBlob(ticketId, attachment.id, { inline: true });
      window.open(url, "_blank", "noopener,noreferrer");
      // Give the new tab a moment to load the blob before revoking.
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (err) {
      setError(err.message || "Couldn't open attachment.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-[12.5px] text-ink-muted">
        {attachment.isImage && thumbUrl && !thumbFailed ? (
          <img src={thumbUrl} alt={attachment.name} className="size-6 rounded object-cover border border-line" />
        ) : (
          <Paperclip className="size-3.5 shrink-0 text-ink-faint" strokeWidth={2} />
        )}
        <span className="text-ink">{attachment.name}</span>
        <span className="text-ink-faint">{attachment.size}</span>
        <button
          type="button"
          onClick={handleOpen}
          disabled={downloading}
          className="ml-auto inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline disabled:opacity-50"
        >
          {downloading ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Download className="size-3" strokeWidth={2} />
          )}
          Open
        </button>
      </div>
      {error && (
        <p className="ml-5 flex items-center gap-1 text-[11.5px] text-danger">
          <ImageOff className="size-3" strokeWidth={2} />
          {error}
        </p>
      )}
    </div>
  );
}
