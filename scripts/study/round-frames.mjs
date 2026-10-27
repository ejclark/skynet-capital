// What the reviewing roles of a study round see (#4943) — PURE, specced in
// tests/scripts/study-round.spec.ts: an analyst's key frames per session and the cap that keeps a
// member's frames under one call's image limit; the census cut into expert batches, verbatim,
// and each batch's frames labelled. round-review.mjs acts on these.

/** At most this many images go in one call (the API's ceiling is 100). */
export const MAX_IMAGES = 90;
/** At most this many census controls go to an expert in one call. */
export const BATCH = 20;

const routeOf = (snap) => (snap ? `${snap.pathname}${snap.search ?? ""}` : null);

/**
 * An analyst's key frames for one session: the first, the last, the frame the member was looking
 * at on any turn with confusion ≥ 2 or a surprise, and the frame after any action the recorder
 * flagged. Chronological, each frame once with every reason it was kept.
 */
export function keyFrames({ turns, trace, opening, start }) {
  const byStep = new Map(trace.filter((r) => !r.refused).map((r) => [r.step, r]));
  const kept = new Map();
  const add = (frame, why, n) => {
    if (!frame?.path) return;
    const e = kept.get(frame.path) ?? { ...frame, why: [], turns: [] };
    if (!e.why.includes(why)) e.why.push(why);
    if (n !== undefined && !e.turns.includes(n)) e.turns.push(n);
    kept.set(frame.path, e);
  };
  let seen = { path: opening, route: start };
  add(seen, "first");
  for (const t of turns) {
    if ((t.confusion ?? 0) >= 2) add(seen, "confusion", t.n);
    if (t.last_expectation?.verdict === "surprise") add(seen, "surprise", t.n);
    const rec = t.step === undefined ? undefined : byStep.get(t.step);
    if (!rec?.frame) continue;
    const after = { path: rec.frame, route: routeOf(rec.after) ?? seen.route };
    if (rec.findings?.length > 0) add(after, "finding", t.n);
    seen = after;
  }
  add(seen, "last");
  return [...kept.values()];
}

/**
 * Hold a member's key frames to `max`: every session's first and last are kept before any other,
 * then the rest in session order. `{sessions: [{…, frames}], dropped, coreDropped}` — coreDropped
 * counts firsts and lasts that did not fit either (only past max/2 sessions).
 */
export function capFrames(sessions, max = MAX_IMAGES) {
  const all = sessions.flatMap((s, si) =>
    s.frames.map((f, fi) => ({ si, fi, core: f.why.includes("first") || f.why.includes("last") })),
  );
  const keep = new Set();
  for (const pass of [true, false]) {
    for (const x of all) {
      if (x.core === pass && keep.size < max) keep.add(`${x.si}:${x.fi}`);
    }
  }
  return {
    sessions: sessions.map((s, si) => ({
      ...s,
      frames: s.frames.filter((_, fi) => keep.has(`${si}:${fi}`)),
    })),
    dropped: all.length - keep.size,
    coreDropped: all.filter((x) => x.core && !keep.has(`${x.si}:${x.fi}`)).length,
  };
}

/**
 * The census as the experts receive it: grouped by census × route × viewport in first-seen order,
 * each group cut into batches of at most `size` controls. Every entry is kept, verbatim, in order.
 * @param {{source: string, entries: {route: string, viewport: string}[]}[]} censuses
 */
export function batchCensus(censuses, size = BATCH) {
  const groups = [];
  for (const c of censuses) {
    for (const e of c.entries) {
      let g = groups.find(
        (x) => x.source === c.source && x.route === e.route && x.viewport === e.viewport,
      );
      if (!g) {
        g = { source: c.source, route: e.route, viewport: e.viewport, entries: [] };
        groups.push(g);
      }
      g.entries.push(e);
    }
  }
  return groups.flatMap((g) => {
    const out = [];
    for (let i = 0; i < g.entries.length; i += size) {
      out.push({ ...g, entries: g.entries.slice(i, i + size) });
    }
    return out;
  });
}

/** A batch's images, labelled F1… in order: each operated control's before, then after. */
export function batchFrames(entries) {
  const out = [];
  for (const e of entries) {
    for (const which of ["before", "after"]) {
      const rel = e.frames?.[which];
      if (rel) out.push({ label: `F${out.length + 1}`, rel, which, order: e.order, name: e.name });
    }
  }
  return out;
}
