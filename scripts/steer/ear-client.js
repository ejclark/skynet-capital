// IS CLAUDE LISTENING? — inlined by render.mjs ahead of page-client.js, which calls
// `steerEar(api)` once and hands it every snapshot of the round's own document. Never run by node.
//
// Eric, 2026-10-13: "is there a way to get a more responsive 'reconnected to session' feedback?"
// A session's page watch drops after hours, and canSendToClaude still answers "available", so
// the page only learned of it 5 minutes after Done. The session now stamps `tp/<round>` itself
// (.claude/skills/steer/SKILL.md steps 5–6): `listening: {at, by, lost: false}` after each publish
// or re-watch, `listening: {lost: true, at}` on a watch-lost notice. This line reads that stamp:
//   ● Claude is listening · since 9:41 AM     a fresh stamp
//   ⊘ Claude isn't listening — say …          a lost one, shown the moment it lands
//   (nothing)                                 no stamp, one it can't parse, or one over 6 hours old
// Glyph and word on each — colour never carries it alone. The page never writes these fields.
globalThis.steerEar = (api) => {
  const el = api.el;
  /** Older than this, a stamp says nothing: a watch can drop silently in that time. */
  const STALE_MS = 6 * 60 * 60 * 1000;
  const LOST = "⊘ Claude isn't listening — say “watch my page” in its session";
  const listening = (ms) => `● Claude is listening · since ${api.clock(ms)}`;
  let timer = null;

  function show(state, line) {
    if (el.textContent !== line) el.textContent = line;
    el.dataset.state = state;
    el.hidden = !line;
  }
  /** `{at, lost}` from a stamp, or null when there is none or it doesn't parse. */
  function read(v) {
    if (!v || typeof v !== "object" || typeof v.at !== "string") return null;
    const ms = Date.parse(v.at);
    return Number.isNaN(ms) ? null : { ms, lost: v.lost === true };
  }
  return {
    /** The round's document as the snapshot delivered it. Returns what the line now says:
     *  "listening", "lost" or "unknown". */
    hear(d) {
      clearTimeout(timer);
      const s = read(d?.listening);
      const left = s ? s.ms + STALE_MS - Date.now() : 0;
      if (!s || left <= 0) {
        show("unknown", "");
        return "unknown";
      }
      const state = s.lost ? "lost" : "listening";
      show(state, s.lost ? LOST : listening(s.ms));
      // The stamp turns stale while the page is open: it goes quiet then, with no new snapshot.
      timer = setTimeout(() => show("unknown", ""), left);
      return state;
    },
    /** The watch is gone, or the view went dark: the line can no longer tell. */
    off() {
      clearTimeout(timer);
      show("unknown", "");
    },
  };
};
