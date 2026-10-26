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
  const WAIT = "The read-back shows here when it's posted.";
  const RELOAD = "Reload the page to see the read-back once it's posted.";
  const NOT_LISTENING =
    "Done — saved. No Claude session is listening right now; the next page reads it back.";
  const NO_REACH = "Done — saved. This view can't reach Claude; the next page reads it back.";
  const NOT_REACHED =
    "Done — saved. Claude couldn't be reached just now; the next page reads it back.";
  const REOPENED = "Reopened — press Done again when you're finished.";
  /** The session stamped `ackAt` after this Done: it heard, and the read-back is on its way. */
  const ACK = "Claude got your Done, reading back…";
  // A sent Done no session answers (Eric, 2026-10-13: "I've had to click 'done'.. nothing
  // happens"): a session's page watch drops after hours idle, yet the send still reads
  // "available". Five minutes after the press with no read-back, the bar says how to wake it.
  const QUIET_MS = 5 * 60 * 1000;
  const UNHEARD =
    "No reply yet: the session that drew this page isn't listening. Open it and say “done” (or “watch my page”).";
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
  /** The session's `ackAt` as a time, or NaN. NaN compares false, so a missing one never counts. */
  const ackOf = (d) => (typeof d?.ackAt === "string" ? Date.parse(d.ackAt) : Number.NaN);
  return {
    ACK,
    LIFECYCLE,
    MAYBE,
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
    ackOf,
    clock,
    notSaved,
    notTold,
    readBackOf,
    refused,
    unable,
  };
})();
