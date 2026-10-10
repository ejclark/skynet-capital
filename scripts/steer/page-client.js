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
(() => {
  const TP = JSON.parse(document.getElementById("tp-data").textContent);
  const ID = TP.id;
  const out = document.getElementById("save-state");
  const doneBtn = document.getElementById("done");
  const copyBtn = document.getElementById("copy");
  const state = { decisions: {}, queue: {}, reel: {} };
  const meta = { id: ID, openedAt: null, doneAt: null, taps: [], shown: TP.shown };
  const chains = {};
  const timers = {};
  let db = null;
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

  const blank = () => ({ pick: null, react: {}, verdict: null, note: "" });
  const rec = (sec, key) => {
    state[sec][key] = state[sec][key] || blank();
    return state[sec][key];
  };
  const answered = (r) =>
    Boolean(
      r && (r.pick || r.verdict || Object.keys(r.react || {}).length || (r.note || "").trim()),
    );

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
    doneBtn.setAttribute("aria-pressed", meta.doneAt ? "true" : "false");
    doneBtn.textContent = meta.doneAt ? "Done" : "I'm done";
    // Done waits for the store too: pressed while connecting, the saved meta would overwrite it.
    doneBtn.disabled = locked() || connecting;
    return TP.decisions.filter((d) => answered(state.decisions[d.key])).length;
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
  function write(path, body) {
    chains[path] = (chains[path] || Promise.resolve())
      .then(() => db.doc(path).set(body))
      .then(
        () => status("Saved"),
        () => status("Not saved — Copy as text"),
      );
  }
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
  function saveMeta(now) {
    if (!db) return;
    clearTimeout(timers.meta);
    const go = () => write(`tp/${ID}`, { ...meta, taps: meta.taps.slice(-3000) });
    if (now) go();
    else timers.meta = setTimeout(go, 2000);
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
  function done() {
    tap();
    meta.doneAt = meta.doneAt ? null : new Date().toISOString();
    saveMeta(true);
    status(meta.doneAt ? "Done — Claude reads it back next" : "Reopened");
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
  document.addEventListener("input", (ev) => {
    const t = ev.target;
    if (t.dataset?.note === undefined || locked()) return;
    const { sec, key } = t.dataset;
    rec(sec, key).note = t.value;
    status("Typing");
    clearTimeout(timers[`${sec}/${key}`]);
    timers[`${sec}/${key}`] = setTimeout(() => {
      tap();
      save(sec, key);
    }, 900);
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
    status("");
  }

  async function boot() {
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
      const taps = [...new Set((prev.taps || []).concat(meta.taps))].sort((a, b) => a - b);
      Object.assign(meta, prev, { shown: TP.shown, taps });
    }
    const early = held.size;
    connected();
    if (!(meta.openedAt || readOnly)) {
      meta.openedAt = new Date().toISOString();
      saveMeta(true);
    } else if (early && !readOnly) saveMeta(false); // the held taps' log, which never reached it
    status("Saves to this page as you go");
  }
  boot().catch(() => offline(UNREAD));
})();
