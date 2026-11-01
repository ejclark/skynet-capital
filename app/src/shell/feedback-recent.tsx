import type { ReactElement } from "react";
import { useState } from "react";
import { FEEDBACK_STATUS_LABEL } from "../../../src/domain/feedback-status";
import { type FollowupOutcome, followupRequest, type RecentFiling } from "../live/feedback";
import { InlineResult } from "../ui";
import { Toggle } from "./toggle";

/**
 * "Your recent feedback" (#738 phase 9d) — the member's own filings with live status badges, and
 * the follow-up fold. Ownership is the server's check (against the member's own logged filings);
 * the fold here is a courtesy, never the gate.
 *
 * Shipped items are filtered out by default (#429's still-open EARS box: "completed filtered out
 * by default with a toggle") — a growing ledger of finished items would otherwise bury what's
 * still moving. "Completed" means `status === "shipped"` specifically: `next-slice` still has
 * real work on the issue (docs/FEEDBACK.md's "four ways a build session ends" — sliced waits on
 * nobody, but isn't done), so it stays in the default view alongside `open`/`up-next`/
 * `building`/`needs-info`/`needs-eric`. So does `not-built` (closed as not planned): it is
 * finished, but the member who filed it should see that plainly rather than have it vanish. The `Toggle` only appears once
 * there's something it would reveal.
 *
 * A shipped filing also carries the last piece of #429's acceptance criteria: "stamped with the
 * release version, and celebrate it." `appVersion` is this SERVER's own currently-running
 * version (`APP_VERSION`, semantic-release-bumped) — a filing marked `shipped` right now is, by
 * definition, confirmed live in it. `BRAND.md`'s "celebration pairs with explanation": the version
 * line IS the explanation, so the fanfare stays a caption, not a takeover.
 *
 * Each row carries a small three-step track (filed · being built · shipped) pinned to the right
 * end of its filed line, so every filing's track lines up in one column, with plain words below
 * it (#5253, option B of #5159's round 2). The words carry the meaning; the track is the glance.
 * At desktop width the track and its words share one right-hand column beside a capped title
 * column, so they stay grouped without a wide empty gap (Eric's note on the round).
 *
 * An open filing is in one of three places (#6316): filed and waiting to be picked, up next
 * (`ready`), or being built (`in-progress`) — the only one that lights the middle step. Their
 * words are the server's own (`FEEDBACK_STATUS_LABEL`), so Moneypenny answers with the same ones.
 */

const RECENT_FILTERS = [
  ["active", "Active"],
  ["all", "All"],
] as const;
type RecentFilter = (typeof RECENT_FILTERS)[number][0];

type Status = NonNullable<RecentFiling["status"]>;

/** One step of the track: filled (done), filled with a halo (underway now), striped (paused),
 *  half-filled (part shipped), or outlined and empty (not yet). Each mark rides with its row's words — never alone (BRAND →
 *  Accessibility; #5093's lesson that one shape must keep one meaning). */
type Step = "done" | "now" | "paused" | "part" | "todo";

const STEP_NAMES = ["Filed", "Being built", "Shipped"] as const;

const STEP_WORDS: Record<Step, string> = {
  done: "done",
  now: "underway",
  paused: "paused",
  part: "partly",
  todo: "not yet",
};

/** What each status shows: its words, and its track — `null` where a track would mislead. A
 *  filing closed as not built never reached the build, so it says so in words alone. */
const STATUS_VIEW: Record<
  Status,
  { readonly words: string; readonly track: readonly Step[] | null }
> = {
  open: { words: FEEDBACK_STATUS_LABEL.open, track: ["done", "todo", "todo"] },
  "up-next": { words: FEEDBACK_STATUS_LABEL["up-next"], track: ["done", "todo", "todo"] },
  building: { words: FEEDBACK_STATUS_LABEL.building, track: ["done", "now", "todo"] },
  "needs-info": {
    words: "Waiting on your answer",
    track: ["done", "paused", "todo"],
  },
  "needs-eric": {
    words: "Waiting on Eric's decision",
    track: ["done", "paused", "todo"],
  },
  "next-slice": {
    words: "First part shipped",
    track: ["done", "done", "part"],
  },
  shipped: { words: "Shipped", track: ["done", "done", "done"] },
  "not-built": { words: "Closed, not built", track: null },
};

function StatusTrack({ steps }: { readonly steps: readonly Step[] }): ReactElement {
  const label = steps.map((step, i) => `${STEP_NAMES[i]}: ${STEP_WORDS[step]}`).join(" · ");
  return (
    <span className="fb-track" role="img" aria-label={label}>
      {steps.map((step, i) => (
        <span key={STEP_NAMES[i]} className={`fb-step fb-step-${step}`} />
      ))}
    </span>
  );
}

/** What a sent follow-up did (#5848): the server restarts the build only when the claim would
 *  take it, and names why when it didn't, so the line never promises a build that isn't coming.
 *  An unknown or missing outcome gets the plain line — the comment posted, nothing more claimed. */
const SENT = "Sent — it's on your issue.";
const SENT_LINES: Readonly<Record<FollowupOutcome, string>> = {
  restarted: "Sent — it's on your issue, and the build starts again with it.",
  backlog: "Sent — it's on your issue; it builds once it's picked from the queue.",
  held: "Sent — it's on your issue; the build waits on a person first.",
  building: "Sent — it's on your issue; it's being built right now.",
  blocked: "Sent — it's on your issue; the build starts once the issues it waits on close.",
  closed: "Sent — it's on your issue. This one is closed, so nothing rebuilds from it.",
  stranded: "Sent — it's on your issue, but the build couldn't be restarted.",
  unchanged: SENT,
};
const sentLine = (outcome: FollowupOutcome | undefined): string =>
  outcome && Object.hasOwn(SENT_LINES, outcome) ? SENT_LINES[outcome] : SENT;

function FollowupFold({ filing }: { readonly filing: RecentFiling }): ReactElement {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | undefined>();
  const send = async () => {
    setBusy(true);
    try {
      const reply = await followupRequest({
        issueNumber: filing.issueNumber,
        details,
      });
      setNote(
        reply.ok
          ? { ok: true, text: sentLine(reply.outcome) }
          : { ok: false, text: reply.error ?? "Couldn't send that." },
      );
      if (reply.ok) setDetails("");
    } catch (err) {
      setNote({
        ok: false,
        text: err instanceof Error ? err.message : String(err),
      });
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
            maxLength={8000}
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
          {note ? <InlineResult tone={note.ok ? "ok" : "err"}>{note.text}</InlineResult> : null}
        </div>
      ) : null}
    </div>
  );
}

/** @category feedback */
export function RecentFeedback({
  recent,
  followupEnabled,
  appVersion,
}: {
  readonly recent: readonly RecentFiling[];
  readonly followupEnabled: boolean;
  /** This server's currently-running version — stamped on shipped filings. Empty string when
   *  it couldn't be read; the celebration line is simply omitted in that case. */
  readonly appVersion?: string;
}): ReactElement | null {
  const [filter, setFilter] = useState<RecentFilter>("active");
  if (recent.length === 0) return null;
  const shippedCount = recent.filter((f) => f.status === "shipped").length;
  const visible = filter === "all" ? recent : recent.filter((f) => f.status !== "shipped");
  return (
    <section className="fb-recent">
      <div className="fb-recent-head">
        <h2 className="fb-h">Your recent feedback</h2>
        {shippedCount > 0 ? (
          <Toggle label="Show" value={filter} options={RECENT_FILTERS} onPick={setFilter} />
        ) : null}
      </div>
      {visible.length === 0 ? (
        <p className="note fb-all-shipped">
          🎉 Everything you've filed has shipped — nice work closing the loop.
        </p>
      ) : (
        <ul className="fb-list">
          {visible.map((filing) => {
            const shipped = filing.status === "shipped";
            const view = filing.status ? STATUS_VIEW[filing.status] : undefined;
            return (
              <li key={filing.issueNumber} className={shipped ? "fb-row fb-row-shipped" : "fb-row"}>
                <a className="fb-title" href={filing.url} target="_blank" rel="noopener noreferrer">
                  #{filing.issueNumber} · {filing.title}
                </a>
                <span className="fb-meta fb-filed num">
                  {filing.kind} · filed {filing.filedAt.slice(0, 10)}
                </span>
                {view?.track ? <StatusTrack steps={view.track} /> : null}
                {view ? (
                  <span className={`fb-status fb-${filing.status}`}>
                    {shipped ? <span aria-hidden="true">🚀 </span> : null}
                    {view.words}
                  </span>
                ) : null}
                {shipped && appVersion ? (
                  <span className="fb-meta fb-shipped-version num">
                    confirmed live in v{appVersion}
                  </span>
                ) : null}
                {followupEnabled ? <FollowupFold filing={filing} /> : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
