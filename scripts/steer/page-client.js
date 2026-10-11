// The decisions page's own script (#5056) — inlined into the page by render.mjs, never run by node.
//
// SAVING. Answers go to the artifact's store (`claude.use("db")`, contract 0.2.75 db.d.ts), one
// document per answer at `tp/<round>/{decisions,queue,reel}/<key>`, and the round's own document
// `tp/<round>` holds its meta: when it was opened, when Done was pressed, and the tap log the
// read-back turns into active minutes. Writes to one document are chained (one at a time, only on
// a change); the meta is written on a pause, and at once on Done.
//
// THE STORE IS THE ONLY COPY. The read-back reads the store and nothing else, so the page never
// counts or presses an answer the store does not hold. A view with no store — the desktop app's
// own browser, which is not signed in to claude.ai, or a saved file — says so in words and locks
// the controls (Eric, 2026-10-10: "the version in the inline browser shows 0 of 7 answered. I
// answered 5 of 7"); one whose store can't be read does the same. Until the store answers, the bar
// says it is loading, never a count.
//
// DONE TELLS CLAUDE (#5135; Eric, 2026-10-10: "clicking 'done' with that form doesn't do
// anything"). A saved answer wakes no session, so Done also sends a comment to Claude
// (`claude.use("comments")`, contract 0.2.75 comments.d.ts `sendToClaude`), which notifies the
// session watching the page. The session reads the round back and writes `readBackAt`,
// `readBackBy` and `readBackSummary` on `tp/<round>`; the page watches that one document and shows
// the line. So the page's own meta writes MERGE (`update`), never replace: a `set` would erase what
// the session wrote. Done is one way; Reopen is its own control.
(() => {
  const TP = JSON.parse(document.getElementById("tp-data").textContent);
  const ID = TP.id;
  const out = document.getElementById("save-state");
  const told = document.getElementById("told");
  const doneBtn = document.getElementById("done");
  const bar = doneBtn.closest(".bar");
  const reopenBtn = document.getElementById("reopen");
  const copyBtn = document.getElementById("copy");
  const state = { decisions: {}, queue: {}, reel: {} };
  const meta = { id: ID, openedAt: null, doneAt: null, taps: [], shown: TP.shown };
  const chains = {};
  const timers = {};
  /** Notes typed but not yet saved (they wait for a pause): Done saves them first. */
  const pendingNotes = new Map();
  let db = null;
  /** `claude.use("comments")`, asked at boot and awaited only on Done. */
  let comments = Promise.resolve(null);
  /** Has the round's document been seen or written? Until then a meta write reads first. */
  let metaStored = false;
  let readOnly = false;
  /** The line shown in place of the count when the store can't be reached or read; locks the page. */
  let blocked = null;
  const NO_STORE = "Answers save only on claude.ai — open this page there to see or change them";
  const UNREAD = "Couldn't read your saved answers — reload the page to try again";
  const locked = () => readOnly || blocked !== null;
  // Until the store answers, a tap is held here and written once it does — a tap in the first
  // second would otherwise be lost, and the read-back would never see it.
  let connecting = true;
  const held = new Map();

  // What became of Done, in words. Never a colour, never a spinner alone.
  const TELLING = "Done — telling Claude…";
  /** Is the round's doc still watched? A dead watch can't show the read-back, so the line says reload. */
  let live = true;
  const WAIT = "The read-back shows here when it's posted.";
  const RELOAD = "Reload the page to see the read-back once it's posted.";
  const waiting = () => (live ? WAIT : RELOAD);
  const sent = () => `Done — sent to Claude. ${waiting()}`;
  const NOT_LISTENING =
    "Done — saved. No Claude session is listening right now; the next page reads it back.";
  const NO_REACH = "Done — saved. This view can't reach Claude; the next page reads it back.";
  const NOT_REACHED =
    "Done — saved. Claude couldn't be reached just now; the next page reads it back.";
  const REOPENED = "Reopened — press Done again when you're finished.";
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
  /** Bumped by every Done, Reopen and new read-back: a send still pending never covers a later line. */
  let turn = 0;
  let toldLine = "";
  /** The read-back already shown (its time and summary), so a re-delivered snapshot repeats nothing. */
  let heardKey = null;

  const blank = () => ({ pick: null, react: {}, verdict: null, note: "" });
  const rec = (sec, key) => {
    state[sec][key] = state[sec][key] || blank();
    return state[sec][key];
  };
  const answered = (r) =>
    Boolean(
      r && (r.pick || r.verdict || Object.keys(r.react || {}).length || (r.note || "").trim()),
    );
  const count = () => TP.decisions.filter((d) => answered(state.decisions[d.key])).length;

  /** Is this button's value the saved one? An option row reads its pick/react, else the verdict. */
  const pressed = (r, opt, v) => {
    if (!opt) return r.verdict === v;
    return v === "build" ? r.pick === opt : r.react[opt] === v;
  };
  function paintRow(row) {
    const r = state[row.dataset.sec][row.dataset.key] || blank();
    for (const b of row.querySelectorAll(".rb")) {
      b.setAttribute("aria-pressed", pressed(r, row.dataset.opt, b.dataset.v) ? "true" : "false");
      b.disabled = locked();
    }
    const reveal = row.parentElement.querySelector(".reveal");
    if (reveal) reveal.hidden = !r.verdict;
  }
  function paint() {
    for (const row of document.querySelectorAll(".react")) paintRow(row);
    for (const t of document.querySelectorAll("[data-note]")) {
      const r = state[t.dataset.sec][t.dataset.key];
      if (document.activeElement !== t) t.value = r?.note || "";
      t.disabled = locked();
    }
    const isDone = Boolean(meta.doneAt);
    doneBtn.setAttribute("aria-pressed", isDone ? "true" : "false");
    doneBtn.textContent = isDone ? "Done" : "I'm done";
    // Done waits for the store too: pressed while connecting, the saved meta would overwrite it.
    // Pressed, it stays pressed: one way, so a second press after "nothing happened" can't reopen.
    doneBtn.disabled = locked() || connecting || isDone;
    reopenBtn.hidden = !isDone || locked();
    // Only on a change: rewriting the same words would have the live region read them again.
    if (told.textContent !== toldLine) told.textContent = toldLine;
    told.hidden = !toldLine;
    return count();
  }
  /** The line under the count. Text only: a session-written summary is never markup. */
  function tell(line) {
    toldLine = line;
    paint();
  }
  /** The bar's line. A count shows only once the store has answered — it is the store's count. */
  function status(msg) {
    const n = paint();
    out.dataset.state = blocked ? "blocked" : connecting ? "loading" : "ready";
    if (blocked) {
      out.textContent = blocked;
      return;
    }
    if (connecting) {
      out.textContent = msg || "Loading your answers…";
      return;
    }
    // The copy fallback shows only when a write to the store failed.
    if (/Copy as text/.test(msg || "")) copyBtn.hidden = false;
    const head = readOnly ? "View only" : msg;
    out.textContent = `${head ? `${head} · ` : ""}${n} of ${TP.decisions.length} answered`;
  }
  /** One write to one document, after the last one there; resolves whether it landed. */
  function chain(path, run) {
    const next = (chains[path] || Promise.resolve())
      .then(() => run(db.doc(path)))
      .then(
        () => {
          status("Saved");
          return true;
        },
        () => {
          status("Not saved — Copy as text");
          return false;
        },
      );
    chains[path] = next;
    return next;
  }
  const write = (path, body) => chain(path, (ref) => ref.set(body));
  function save(sec, key) {
    if (connecting) {
      const r = state[sec][key];
      held.set(`${sec}/${key}`, { sec, key, rec: { ...r, react: { ...r.react } } });
      return status("Sending once your answers load");
    }
    if (!db) return status("");
    const r = state[sec][key];
    const d = sec === "decisions" ? TP.decisions.find((x) => x.key === key) : null;
    write(`tp/${ID}/${sec}/${key}`, {
      round: ID,
      section: sec,
      key,
      issue: d ? d.issue : Number(key),
      kind: d ? d.kind : sec,
      pick: r.pick,
      react: r.react,
      verdict: r.verdict,
      note: r.note || "",
      at: new Date().toISOString(),
    });
  }
  /** The page's own fields on `tp/<round>` — the only ones it ever writes there. */
  const metaBody = () => ({
    id: ID,
    openedAt: meta.openedAt,
    doneAt: meta.doneAt,
    taps: meta.taps.slice(-3000),
    shown: meta.shown,
  });
  /** Merge the page's fields into the round's document, so the session's read-back fields stay.
   *  `update` needs the document, so a first write reads to choose; a failed update reads again. */
  function putMeta(ref) {
    const body = metaBody();
    const exists = metaStored ? Promise.resolve(true) : ref.get().then((s) => s.exists);
    return exists
      .then((yes) => (yes ? ref.update(body) : ref.set(body)))
      .then(
        () => {
          metaStored = true;
        },
        (err) => {
          metaStored = false;
          throw err;
        },
      );
  }
  /** Write the meta now (resolves whether it landed) or on a pause (resolves null at once). */
  function saveMeta(now) {
    if (!db) return Promise.resolve(false);
    clearTimeout(timers.meta);
    const go = () => chain(`tp/${ID}`, putMeta);
    if (now) return go();
    timers.meta = setTimeout(go, 2000);
    return Promise.resolve(null);
  }
  function tap() {
    meta.taps.push(Date.now());
    saveMeta(false);
  }

  /** One press: an option row toggles its pick or its More/Not mark; any other row its verdict. */
  function toggle(r, opt, v) {
    if (!opt) {
      r.verdict = r.verdict === v ? null : v;
      return;
    }
    if (v === "build") {
      r.pick = r.pick === opt ? null : opt;
      if (r.pick === opt && r.react[opt] === "not") delete r.react[opt];
      return;
    }
    if (r.react[opt] === v) delete r.react[opt];
    else r.react[opt] = v;
    if (v === "not" && r.pick === opt) r.pick = null;
  }
  function runNote(k) {
    const go = pendingNotes.get(k);
    pendingNotes.delete(k);
    if (go) go();
  }
  function flushNotes() {
    for (const k of [...pendingNotes.keys()]) {
      clearTimeout(timers[k]);
      runNote(k);
    }
  }

  /** Done: save it, then tell the watching session — from this press, never again on a timer. */
  function done() {
    if (meta.doneAt || locked() || connecting) return;
    const focused = document.activeElement === doneBtn;
    flushNotes();
    tap();
    meta.doneAt = new Date().toISOString();
    const saved = saveMeta(true);
    status("Saving");
    // Pressed Done can't hold focus (it is disabled now); hand it to the Reopen beside it.
    if (focused) reopenBtn.focus();
    sendDone(count(), saved).catch(() => tell(refused(undefined, MAYBE)));
  }
  async function sendDone(n, saved) {
    const mine = ++turn;
    const say = (line) => {
      if (mine === turn) tell(line);
    };
    say(TELLING);
    let line;
    let told = UNTOLD;
    try {
      const c = await comments;
      const can = c ? await c.canSendToClaude() : null;
      if (!c) line = NO_REACH;
      else if (can !== "available") line = unable(can);
      else {
        // Anchored on the bar Done sits in, at the press; the text names the round for the session.
        const anchor = await c.anchorFor(bar);
        const text = `Done with steering round ${ID}: ${n} of ${TP.decisions.length} answered. Read it back.`;
        await c.sendToClaude({ anchor, text }).catch((err) => {
          if (![...UNPOSTED, ...LIFECYCLE].includes(err?.code)) told = MAYBE;
          throw err;
        });
        return say(sent());
      }
    } catch (err) {
      line = refused(err?.code, told);
    }
    say((await saved) === false ? notSaved(told) : line);
  }
  function reopen() {
    if (!meta.doneAt || locked()) return;
    const focused = document.activeElement === reopenBtn;
    turn++;
    tap();
    meta.doneAt = null;
    saveMeta(true);
    tell(REOPENED);
    status("Saving");
    // Reopen just hid itself; focus goes to the Done it hands back.
    if (focused) doneBtn.focus();
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
  /** The round's document as it opened: a read-back after the last Done shows; a Done without one
   *  says it is waiting. */
  function opened(d) {
    const rb = readBackOf(d);
    heardKey = rb ? rb.key : null;
    const doneMs = meta.doneAt ? Date.parse(meta.doneAt) : Number.NaN;
    if (rb && (Number.isNaN(doneMs) || rb.ms >= doneMs)) toldLine = rb.line;
    else if (!Number.isNaN(doneMs)) toldLine = `Done at ${clock(doneMs)}. ${waiting()}`;
  }
  /** A new read-back on the round's document (the session wrote it): show it, without a reload. */
  function heard(d) {
    const rb = readBackOf(d);
    if (!rb || rb.key === heardKey) return;
    heardKey = rb.key;
    turn++;
    tell(rb.line);
  }
  /** The watch is gone: the bar stops promising a live read-back, and says a reload shows it. */
  function deaf() {
    live = false;
    if (toldLine.endsWith(WAIT)) tell(toldLine.slice(0, -WAIT.length) + RELOAD);
  }
  /** Watch the round's own document, once, for the session's read-back. */
  function watch() {
    try {
      // A terminal error (db.d.ts) is never resubscribed; the next load reads the read-back.
      db.doc(`tp/${ID}`).onSnapshot((snap) => {
        if (snap.exists) heard(snap.data());
      }, deaf);
    } catch {
      deaf(); // a runtime without onSnapshot
    }
  }

  document.addEventListener("click", (ev) => {
    const b = ev.target.closest?.(".rb");
    if (!b || locked()) return;
    if (b === doneBtn) return done();
    const row = b.closest(".react");
    toggle(rec(row.dataset.sec, row.dataset.key), row.dataset.opt, b.dataset.v);
    tap();
    status("Saving");
    save(row.dataset.sec, row.dataset.key);
  });
  reopenBtn.addEventListener("click", reopen);
  document.addEventListener("input", (ev) => {
    const t = ev.target;
    if (t.dataset?.note === undefined || locked()) return;
    const { sec, key } = t.dataset;
    const k = `${sec}/${key}`;
    rec(sec, key).note = t.value;
    status("Typing");
    clearTimeout(timers[k]);
    pendingNotes.set(k, () => {
      tap();
      save(sec, key);
    });
    timers[k] = setTimeout(() => runNote(k), 900);
  });

  function decisionText(d) {
    const r = state.decisions[d.key] || blank();
    const bits = [r.pick && `build ${r.pick}`, r.verdict].filter(Boolean);
    for (const o of Object.keys(r.react).sort()) bits.push(`${r.react[o]} ${o}`);
    const note = (r.note || "").trim().replace(/\s+/g, " ");
    return `#${d.issue} ${d.title}: ${bits.join(", ") || "—"}${note ? ` | ${note}` : ""}`;
  }
  function text() {
    const lines = [`Decisions page ${ID}`, ...TP.decisions.map(decisionText)];
    for (const sec of ["queue", "reel"]) {
      for (const [k, r] of Object.entries(state[sec])) {
        if (r.verdict) lines.push(`${sec} #${k}: ${r.verdict}${r.note ? ` | ${r.note}` : ""}`);
      }
    }
    lines.push(meta.doneAt ? `Done at ${meta.doneAt}` : "Not marked done");
    return lines.join("\n");
  }
  copyBtn.addEventListener("click", () => {
    const flash = (m) => {
      copyBtn.textContent = m;
      setTimeout(() => {
        copyBtn.textContent = "Copy as text";
      }, 1800);
    };
    try {
      navigator.clipboard.writeText(text()).then(
        () => flash("Copied"),
        () => flash("Copy blocked"),
      );
    } catch {
      flash("Copy blocked");
    }
  });

  status("");

  const use = (name) =>
    window.claude?.use ? window.claude.use(name).catch(() => null) : Promise.resolve(null);
  const fromDoc = (v = {}) => ({
    pick: v.pick || null,
    react: v.react || {},
    verdict: v.verdict || null,
    note: v.note || "",
  });
  /** One section from the store; false when it can't be read, so no count is drawn from a gap. */
  const loadSection = (sec) =>
    db
      .collection(`tp/${ID}/${sec}`)
      .get()
      .then(
        (snap) => {
          for (const doc of snap.docs) state[sec][doc.id] = fromDoc(doc.data());
          return true;
        },
        () => false,
      );

  /** The store has answered (or never will): taps held while it was connecting go out now, over
   *  whatever the store held for the same answer — they are newer than anything it had. */
  function connected() {
    connecting = false;
    for (const { sec, key, rec: r } of held.values()) {
      state[sec][key] = r;
      if (!readOnly) save(sec, key);
    }
    held.clear();
  }

  /** No store here, or one that can't be read: say which, show no answers, lock the controls.
   *  Taps held while connecting are dropped — nowhere would keep them. */
  function offline(line) {
    blocked = line;
    db = null;
    connecting = false;
    held.clear();
    for (const sec of Object.keys(state)) state[sec] = {};
    meta.doneAt = null;
    turn++; // a send still pending must not report on a page that has gone dark
    toldLine = "";
    status("");
  }

  async function boot() {
    // Asked now, awaited only on Done: resolving it writes nothing and prompts no one.
    comments = use("comments");
    const [d, user] = await Promise.all([use("db"), use("user")]);
    if (!d) return offline(NO_STORE);
    db = d;
    if (user && (await user.can("data.write")) === false) readOnly = true;
    const saved = await db
      .doc(`tp/${ID}`)
      .get()
      .then(
        (s) => ({ ok: true, data: s.exists ? s.data() : null }),
        () => ({ ok: false, data: null }),
      );
    const loaded = await Promise.all(["decisions", "queue", "reel"].map(loadSection));
    if (!saved.ok || loaded.includes(false)) return offline(UNREAD);
    if (saved.data) {
      const prev = saved.data;
      metaStored = true;
      meta.taps = [...new Set((prev.taps || []).concat(meta.taps))].sort((a, b) => a - b);
      meta.openedAt = prev.openedAt || null;
      meta.doneAt = prev.doneAt || null;
      opened(prev);
    }
    const early = held.size;
    connected();
    if (!(meta.openedAt || readOnly)) {
      meta.openedAt = new Date().toISOString();
      saveMeta(true);
    } else if (early && !readOnly) saveMeta(false); // the held taps' log, which never reached it
    status("Saves to this page as you go");
    watch();
  }
  boot().catch(() => offline(UNREAD));
})();
