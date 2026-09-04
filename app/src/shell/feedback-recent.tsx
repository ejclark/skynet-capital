import type { ReactElement } from "react";
import { useState } from "react";
import { followupRequest, type RecentFiling } from "../live/feedback";

/**
 * "Your recent feedback" (#738 phase 9d) — the member's own filings with live status badges, and
 * the follow-up fold. Ownership is the server's check (against the member's own logged filings);
 * the fold here is a courtesy, never the gate.
 */

const STATUS_LABELS: Record<string, string> = {
  open: "open",
  "needs-info": "needs your info",
  "needs-eric": "with Eric",
  "next-slice": "next slice",
  shipped: "shipped",
};

function FollowupFold({ filing }: { readonly filing: RecentFiling }): ReactElement {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | undefined>();
  const send = async () => {
    setBusy(true);
    try {
      const reply = await followupRequest({ issueNumber: filing.issueNumber, details });
      setNote(
        reply.ok
          ? { ok: true, text: "Sent — it lands on your issue and re-triggers the build." }
          : { ok: false, text: reply.error ?? "Couldn't send that." },
      );
      if (reply.ok) setDetails("");
    } catch (err) {
      setNote({ ok: false, text: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="fb-followup">
      <button type="button" className="fb-followup-toggle" onClick={() => setOpen(!open)}>
        {open ? "▾" : "▸"} Follow up
      </button>
      {open ? (
        <div className="fb-followup-body">
          <textarea
            rows={2}
            value={details}
            placeholder="What changed, or what to add…"
            onChange={(e) => setDetails(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-primary mc-btn"
            disabled={busy || details.trim() === ""}
            onClick={() => void send()}
          >
            {busy ? "Sending…" : "Send follow-up"}
          </button>
          {note ? <p className={note.ok ? "set-ok" : "set-err"}>{note.text}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

/** @category feedback */
export function RecentFeedback({
  recent,
  followupEnabled,
}: {
  readonly recent: readonly RecentFiling[];
  readonly followupEnabled: boolean;
}): ReactElement | null {
  if (recent.length === 0) return null;
  return (
    <section className="fb-recent">
      <h2 className="fb-h">Your recent feedback</h2>
      <ul className="fb-list">
        {recent.map((filing) => (
          <li key={filing.issueNumber} className="fb-row">
            <a href={filing.url} target="_blank" rel="noopener noreferrer">
              #{filing.issueNumber} · {filing.title}
            </a>
            <span className="fb-meta num">
              {filing.kind} · filed {filing.filedAt.slice(0, 10)}
            </span>
            {filing.status ? (
              <span className={`fb-status fb-${filing.status}`}>
                {STATUS_LABELS[filing.status] ?? filing.status}
              </span>
            ) : null}
            {followupEnabled ? <FollowupFold filing={filing} /> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
