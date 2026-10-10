// The decisions page's own script (#5056) — inlined into the page by render.mjs, never run by node.
//
// SAVING. Answers go to the artifact's store (`claude.use("db")`, contract 0.2.75 db.d.ts), one
// document per answer at `tp/<round>/{decisions,queue,reel}/<key>`, and the round's own document
// `tp/<round>` holds its meta: when it was opened, when Done was pressed, and the tap log the
// read-back turns into active minutes. Writes to one document are chained (one at a time, only on
// a change); the meta is written on a pause, and at once on Done. With no store — a saved file, a
// signed-out view — everything still works in this browser and "Copy as text" carries it out.
(() => {
  const TP = JSON.parse(document.getElementById("tp-data").textContent);
  const ID = TP.id;
  const LKEY = `steer-${ID}`;
  const out = document.getElementById("save-state");
  const doneBtn = document.getElementById("done");
  const copyBtn = document.getElementById("copy");
  const state = { decisions: {}, queue: {}, reel: {} };
  const meta = { id: ID, openedAt: null, doneAt: null, taps: [], shown: TP.shown };
  const chains = {};
  const timers = {};
  let db = null;
  let readOnly = false;

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
      b.disabled = readOnly;
    }
    const reveal = row.parentElement.querySelector(".reveal");
    if (reveal) reveal.hidden = !r.verdict;
  }
  function paint() {
    for (const row of document.querySelectorAll(".react")) paintRow(row);
    for (const t of document.querySelectorAll("[data-note]")) {
      const r = state[t.dataset.sec][t.dataset.key];
      if (document.activeElement !== t) t.value = r?.note || "";
      t.disabled = readOnly;
    }
    doneBtn.setAttribute("aria-pressed", meta.doneAt ? "true" : "false");
    doneBtn.textContent = meta.doneAt ? "Done" : "I'm done";
    doneBtn.disabled = readOnly;
    return TP.decisions.filter((d) => answered(state.decisions[d.key])).length;
  }
  function status(msg) {
    const n = paint();
    // The copy fallback shows only when the store can't keep the answers.
    if (/Copy as text/.test(msg || "")) copyBtn.hidden = false;
    const head = readOnly ? "View only" : msg;
    out.textContent = `${head ? `${head} · ` : ""}${n} of ${TP.decisions.length} answered`;
  }
  function saveLocal() {
    try {
      localStorage.setItem(LKEY, JSON.stringify({ state, meta }));
    } catch {
      /* private window or blocked storage: the store, or Copy as text, still carries it */
    }
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
    saveLocal();
    if (!db) return status("This browser only — Copy as text");
    const r = state[sec][key];
    const d = TP.decisions.find((x) => x.key === key);
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
    saveLocal();
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
    if (!b || readOnly) return;
    if (b === doneBtn) return done();
    const row = b.closest(".react");
    toggle(rec(row.dataset.sec, row.dataset.key), row.dataset.opt, b.dataset.v);
    tap();
    status("Saving");
    save(row.dataset.sec, row.dataset.key);
  });
  document.addEventListener("input", (ev) => {
    const t = ev.target;
    if (t.dataset?.note === undefined || readOnly) return;
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

  try {
    const l = JSON.parse(localStorage.getItem(LKEY) || "null");
    if (l?.state) Object.assign(state, l.state);
    if (l?.meta) Object.assign(meta, l.meta, { shown: TP.shown });
  } catch {
    /* nothing saved in this browser yet */
  }
  status("");

  const use = (name) =>
    window.claude?.use ? window.claude.use(name).catch(() => null) : Promise.resolve(null);
  const fromDoc = (v = {}) => ({
    pick: v.pick || null,
    react: v.react || {},
    verdict: v.verdict || null,
    note: v.note || "",
  });
  const loadSection = (sec) =>
    db
      .collection(`tp/${ID}/${sec}`)
      .get()
      .then(
        (snap) => {
          for (const doc of snap.docs) state[sec][doc.id] = fromDoc(doc.data());
        },
        () => null,
      );

  async function boot() {
    const [d, user] = await Promise.all([use("db"), use("user")]);
    db = d;
    if (!db) return status("This browser only — Copy as text");
    if (user && (await user.can("data.write")) === false) readOnly = true;
    const saved = await db
      .doc(`tp/${ID}`)
      .get()
      .then(
        (s) => (s.exists ? s.data() : null),
        () => null,
      );
    await Promise.all(["decisions", "queue", "reel"].map(loadSection));
    if (saved) {
      const taps = [...new Set((saved.taps || []).concat(meta.taps))].sort((a, b) => a - b);
      Object.assign(meta, saved, { shown: TP.shown, taps });
    }
    if (!(meta.openedAt || readOnly)) {
      meta.openedAt = new Date().toISOString();
      saveMeta(true);
    }
    saveLocal();
    status("Saves to this page as you go");
  }
  boot().catch(() => status("This browser only — Copy as text"));
})();
