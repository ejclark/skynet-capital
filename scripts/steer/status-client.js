// WHAT BECAME OF DONE, IN WORDS — inlined by render.mjs ahead of page-client.js, which takes these
// from `globalThis.steerStatus` and keeps the state: whether the watch is live, the turn, the bar
// and its timers. Never run by node.
//
// The lines the bar says after a Done (telling, sent, saved-but-unheard, refused), the read-back
// and the ack as the session stamped them on the round's document, and the clock time a line
// carries. Pure: no page state, no store, no DOM — a line that needs the watch's state
// (`waiting`, `sent`) stays on the page.
globalThis.steerStatus = (() => {
  // What became of Done, in words. Never a colour, never a spinner alone.
  const TELLING = "Done — telling Claude…";
  const WAIT = "“Received” shows here once the session reads it.";
  const RELOAD = "Reload the page to see the read-back once it's posted.";
  const NOT_LISTENING =
    "Done — saved. No Claude session is listening right now; the next page reads it back.";
  const NO_REACH = "Done — saved. This view can't reach Claude; the next page reads it back.";
  const NOT_REACHED =
    "Done — saved. Claude couldn't be reached just now; the next page reads it back.";
  const REOPENED = "Reopened — press Done again when you're finished.";
  /** An answer changed after the read-back on the bar (#7119): Done is armed again to send it. */
  const NEWER = "New answers since Claude read this back — press Done to send them.";
  /** The session stamped the round after this Done: it read the press, and the read-back follows. */
  const ACK = "✓ Received — Claude is reading your answers back…";
  // A sent Done no session answers (Eric, 2026-10-13: "I've had to click 'done'.. nothing
  // happens"): a session's page watch drops after hours idle, yet the send still reads
  // "available". Two minutes after the press with nothing read (#6606), the bar says so and what
  // to do. It says what is known, never why: a session deep in a long turn is still there.
  const QUIET_MS = 2 * 60 * 1000;
  const UNHEARD =
    "Not received yet: no session has read your Done. Open the session that drew this page and say “done”.";
  // A rejected send is not proof nothing was posted (comments.d.ts), so only a code that says the
  // send was refused before writing earns "wasn't told"; any other rejection of the send hedges.
  const UNTOLD = "wasn't told";
  const MAYBE = "may not have been told";
  const UNPOSTED = [
    "claude_unavailable",
    "consent_required",
    "forbidden",
    "invalid",
    "transform_error",
    "rate_limited",
  ];
  const LIFECYCLE = ["not_granted", "capability_disabled", "capability_removed"];
  const notSaved = (told) =>
    `Done didn't save, and Claude ${told} — use Copy as text and paste it in chat.`;
  const notTold = (why, told) =>
    `Done — saved, but Claude ${told}: ${why}. Say “done” in chat to start the read-back.`;
  /** `canSendToClaude` said no (comments.d.ts): only `no_session` means no session is listening;
   *  `writers_only`, `off` or a value it doesn't know means this view can't send. */
  const unable = (can) => (can === "no_session" ? NOT_LISTENING : NO_REACH);
  /** A refused send, by its code (comments.d.ts). None is retried: a new press is the retry. */
  function refused(code, told) {
    if (code === "claude_unavailable") return NOT_REACHED;
    if (LIFECYCLE.includes(code)) return NO_REACH;
    if (code === "consent_required") return notTold("the page wasn't allowed to comment", told);
    if (code === "forbidden") return notTold("commenting from this page is off here", told);
    return notTold("sending it failed", told);
  }
  /** A clock time in the viewer's own zone; another day's carries its weekday. */
  function clock(ms) {
    const t = new Date(ms);
    const day = t.toDateString() === new Date().toDateString() ? {} : { weekday: "short" };
    return t.toLocaleString([], { ...day, hour: "numeric", minute: "2-digit" });
  }
  /** The session's read-back on the round's document, or null when there is none to show. */
  function readBackOf(d) {
    const at = typeof d?.readBackAt === "string" ? d.readBackAt : "";
    const ms = Date.parse(at);
    if (!at || Number.isNaN(ms)) return null;
    const raw = typeof d.readBackSummary === "string" ? d.readBackSummary : "";
    const summary = raw.replace(/\s+/g, " ").trim().slice(0, 200);
    return {
      key: `${at}|${summary}`,
      ms,
      line: `Read back ${clock(ms)}${summary ? ` · ${summary}` : ""}`,
    };
  }
  // A read-back's time is a session's guess too: of 50 `readBackAt` stamps in the transcripts, 49
  // were a whole minute and 7 sat behind the real time (docs/IDEAS.md). A page opened later can't
  // see it land, so a read-back stamped up to this far behind the press still answers it (#6730).
  // Order still counts past it: a Done re-armed after an older read-back (#7119) has none yet.
  const SKEW_MS = 5 * 60 * 1000;
  /** Does the read-back `rb` (readBackOf) on the round's document answer the Done at `doneAt`, as a
   *  page opening reads it? One at or after the press does; one within SKEW_MS behind it does too,
   *  unless the session's `ackFor` names another press — then the read-back was that press's. */
  function readsBack(rb, d, doneAt) {
    if (!rb) return false;
    const doneMs = doneAt ? Date.parse(doneAt) : Number.NaN;
    if (Number.isNaN(doneMs) || rb.ms >= doneMs) return true;
    if (typeof d?.ackFor === "string" && d.ackFor !== doneAt) return false;
    return rb.ms > doneMs - SKEW_MS;
  }
  /** Does the session's stamp answer the press at `doneAt`? A session has no clock: of 4 `ackAt`
   *  stamps in the transcripts (#6606), 3 were a whole-minute guess minutes ahead and 1 sat 21 seconds
   *  behind, so the times can't decide it. `ackFor`, the press's own stamp copied from the Done
   *  comment, decides when it is there. Without it (a page or a session from before it), a stamp that
   *  `landed` after the press answers it, whatever time it claims; on opening a page, where a landing
   *  can't be seen, the times are all there is. */
  function acks(d, doneAt, landed) {
    if (!doneAt) return false;
    if (typeof d?.ackFor === "string") return d.ackFor === doneAt;
    const ms = typeof d?.ackAt === "string" ? Date.parse(d.ackAt) : Number.NaN;
    return landed ? !Number.isNaN(ms) : ms >= Date.parse(doneAt);
  }
  return {
    ACK,
    LIFECYCLE,
    MAYBE,
    NEWER,
    NOT_LISTENING,
    NOT_REACHED,
    NO_REACH,
    QUIET_MS,
    REOPENED,
    RELOAD,
    TELLING,
    UNHEARD,
    UNPOSTED,
    UNTOLD,
    WAIT,
    acks,
    clock,
    notSaved,
    notTold,
    readBackOf,
    readsBack,
    refused,
    unable,
  };
})();
