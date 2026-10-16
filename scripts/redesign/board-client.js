// THE FEEDBACK BOARD's Start buttons (#5143), inlined into board.html by board-page.mjs.
//
// Each screen's Start sends one comment to Claude, anchored on that screen's section:
// "Start redesign: <id> (<route>)". A session reading it spawns one redesign session for the
// screen with Eric's pinned notes (docs/process/REDESIGN.md → Refresh the board). Every refusal
// the comments capability can give gets its own honest line, and none of them claims a send.
(() => {
  const LABEL = "Start a redesign session for this screen";
  const SENT =
    "Sent to Claude. A card to open this screen's session appears in your Claude Code chat.";
  const noReach = (id) => `Couldn't reach Claude from here — say 'start ${id}' in chat.`;
  const offHere = (id) =>
    `Starting sessions from this page is off here — say 'start ${id}' in chat.`;
  const buttons = [...document.querySelectorAll("button.go")];
  const say = (id, text) => {
    const el = document.getElementById(`status-${id}`);
    if (el) el.textContent = text;
  };
  const claude = window.claude;
  if (!(typeof claude === "object" && claude !== null && typeof claude.use === "function")) {
    for (const b of buttons) {
      b.disabled = true;
      b.textContent = "Open this page on claude.ai to start a session";
    }
    return;
  }

  let off = false; // `forbidden` is permanent for this view
  const retried = new Set(); // ids that already spent their one retry of a transient failure

  function finish(b, id, text, disable = false) {
    say(id, text);
    b.disabled = disable;
    b.textContent = LABEL;
  }

  /** The line for a failed send, and whether the button stays off. */
  function refusal(code, id) {
    switch (code) {
      case "consent_required":
        return [
          "Not sent — allow this page to comment for you when claude.ai asks, then press again.",
        ];
      case "forbidden":
        off = true;
        for (const other of buttons) if (!other.classList.contains("done")) other.disabled = true;
        return [offHere(id), true];
      case "claude_unavailable":
        return [noReach(id)];
      case "rate_limited":
        return ["Too many sends at once — wait a moment, then press again."];
      case "invalid":
      case "transform_error":
      case "not_granted":
      case "capability_disabled":
      case "capability_removed":
        return [noReach(id), true];
      default: // unavailable, upstream_error, anything unknown: one retry, from a fresh press only
        if (retried.has(id)) return [noReach(id), true];
        retried.add(id);
        return ["Couldn't send just now — press again to try once more."];
    }
  }

  async function start(b) {
    const id = b.dataset.screen;
    if (off) return finish(b, id, offHere(id), true);
    b.disabled = true;
    b.textContent = "Sending…";
    say(id, "");
    let c = null;
    try {
      c = await claude.use("comments");
    } catch {
      c = null;
    }
    let can = "off";
    try {
      can = c ? await c.canSendToClaude() : "off";
    } catch {
      can = "off";
    }
    if (can !== "available") return finish(b, id, noReach(id));
    try {
      const anchor = await c.anchorFor(document.getElementById(id));
      await c.sendToClaude({ anchor, text: `Start redesign: ${id} (${b.dataset.route})` });
      b.classList.add("done");
      b.textContent = "✓ Session requested";
      say(id, SENT);
    } catch (e) {
      const code = e && typeof e.code === "string" ? e.code : "upstream_error";
      const [text, disable] = refusal(code, id);
      finish(b, id, text, disable);
    }
  }

  for (const b of buttons) b.addEventListener("click", () => start(b));
})();
