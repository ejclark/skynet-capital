// THE PAGE'S WRITES TO THE STORE — inlined by render.mjs ahead of page-client.js, which calls
// `globalThis.steerSave(...)` once and keeps the state, the taps held while the store connects and
// the bar's line. Never run by node.
//
// What goes into the store and how: one write at a time to one document (`chain`), an answer's
// whole record (`save`) or only the keys of it this view touched (`saveKeys`), and the round's own
// document (`tp/<round>`) merged with `update` so the session's read-back fields stay (`putMeta`,
// `saveMeta`). The page's header says why each write merges or replaces. The store (`db`) is read
// through `db()` at each write, since the page drops it when the store can't be reached.
globalThis.steerSave = ({ id: ID, tp: TP, state, meta, stored, touched, db, status }) => {
  const { MAPS, liveOf, keyValue } = globalThis.steerRecord;
  const chains = {};
  let metaTimer = null;
  /** Has the round's document been seen or written? Until then a meta write reads first. */
  let metaStored = false;

  /** One write to one document, after the last one there; resolves whether it landed. */
  function chain(path, run) {
    const next = (chains[path] || Promise.resolve())
      .then(() => run(db().doc(path)))
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
  /** A write that lands; the path is then one the store holds. */
  const landed = (path, run) => () =>
    run().then(
      () => {
        stored.add(path);
      },
      (err) => {
        stored.delete(path);
        throw err;
      },
    );
  const write = (path, body) => chain(path, (ref) => landed(path, () => ref.set(body))());
  /** The whole record of one answer, as the page holds it. */
  function body(sec, key) {
    const r = state[sec][key];
    const d = sec === "decisions" ? TP.decisions.find((x) => x.key === key) : null;
    return {
      round: ID,
      section: sec,
      key,
      issue: d ? d.issue : Number(key),
      kind: d ? d.kind : sec,
      pick: r.pick,
      react: r.react,
      verdict: r.verdict,
      note: r.note || "",
      ...(sec === "decisions" ? Object.fromEntries(MAPS.map((f) => [f, liveOf(f, r[f])])) : {}),
      ...(sec === "decisions" ? { revealAt: r.revealAt || null } : {}),
      at: new Date().toISOString(),
    };
  }
  /** One keyed field as the store has it, with this view's own keys laid over it. */
  function mergeKeys(field, key, there, mine) {
    const merged = liveOf(field, there);
    for (const id of touched[field].get(key) ?? []) {
      const v = keyValue(field, mine?.[id]);
      if (v) merged[id] = v;
      else delete merged[id];
    }
    return merged;
  }
  /** Write one answer's whole record. */
  function save(sec, key) {
    if (sec !== "decisions") return write(`tp/${ID}/${sec}/${key}`, body(sec, key));
    // A whole decision record replaces what is stored, so it first takes the stored pins and pin
    // notes and keeps every one this view didn't touch: another view's survive this view's tap.
    const path = `tp/${ID}/decisions/${key}`;
    chain(path, (ref) =>
      ref.get().then((snap) => {
        const live = snap.exists ? snap.data() : null;
        const r = state.decisions[key];
        for (const f of MAPS) r[f] = mergeKeys(f, key, live?.[f], r[f]);
        r.revealAt = r.revealAt || live?.revealAt || null; // a reveal is never taken back
        return landed(path, () => ref.set(body("decisions", key)))();
      }),
    );
  }
  /** Pins' reactions or notes, marks (`[field, id]` pairs) or a merged field alone (`[field]`),
   *  merged into their decision's record in one write, each key alone (null clears it); a record
   *  the store doesn't hold yet is written whole. */
  function saveKeys(key, pairs) {
    const path = `tp/${ID}/decisions/${key}`;
    const merge = { at: new Date().toISOString() };
    for (const [field, id] of pairs)
      if (id === undefined) merge[field] = state.decisions[key]?.[field] ?? null;
      else
        merge[field] = {
          ...merge[field],
          [id]: keyValue(field, state.decisions[key]?.[field]?.[id]),
        };
    chain(path, (ref) => {
      const there = stored.has(path) ? Promise.resolve(true) : ref.get().then((s) => s.exists);
      return there.then((yes) =>
        landed(path, () => (yes ? ref.update(merge) : ref.set(body("decisions", key))))(),
      );
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
  /** Merge the page's fields (or `body`, a note about the page) into the round's document, so the
   *  session's read-back fields stay. `update` needs the document, so a first write reads to
   *  choose; a failed update reads again. */
  function putMeta(ref, body = metaBody()) {
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
    if (!db()) return Promise.resolve(false);
    clearTimeout(metaTimer);
    const go = () => chain(`tp/${ID}`, putMeta);
    if (now) return go();
    metaTimer = setTimeout(go, 2000);
    return Promise.resolve(null);
  }
  /** A note about the page: one key of `pageNotes` merged into the round's document. */
  const savePageNoteKey = (id, entry) =>
    chain(`tp/${ID}`, (ref) => putMeta(ref, { pageNotes: { [id]: entry } }));
  /** The round's document is in the store: a meta write is an `update` from here on. */
  const seen = () => {
    metaStored = true;
  };
  return { save, saveKeys, saveMeta, savePageNoteKey, seen };
};
