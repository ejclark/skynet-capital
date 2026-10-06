// THRASH SIGNALS — the pure half of scripts/thrash-scan.mjs (#3939 slice 1): every detector takes
// a state snapshot and a window and returns hits; nothing here touches GitHub. Split from the CLI
// so the detectors stay under the 300-line cap and the specs can drive them directly.
//
// T1's "NEAR-IDENTICAL" RULE, CHOSEN FROM #3720'S 79 COMMENTS, NOT GUESSED. 78 of them are the
// repair lane's "Failed again — run [36080359819](…/runs/36080359819), step `…`. Same signature…";
// the only thing that differs between them is the run id and its URL. So: lowercase, every URL →
// `<url>`, every digit run → `<n>`, whitespace collapsed — then exact equality. That collapses all
// 78 into one key and still keeps a different step or a different message apart. Anything fuzzier
// (edit distance, shingles) would buy nothing #3720 needed and would start merging distinct bot
// messages that share a template.
//

const DAY = 86_400_000;

export const T1_MIN_REPEATS = 5;
export const T2_WINDOW_DAYS = 14;
export const T3_MULTIPLIER = 5;
export const T3_BASELINE_DAYS = 7;
// A trailing median of 0 makes "5× the median" fire on a single filing; a burst worth a digest line
// is double-digit. Tune here, on the record.
export const T3_BURST_FLOOR = 10;
export const T4_MIN_TOGGLES = 3;
export const T5_WINDOW_DAYS = 7;
export const T6_LOOKBACK_DAYS = 30;

// Which signals slice 2 may auto-file a `bottleneck` issue for (the two-scan rule). T6 is digest-
// only: its backtest caught both named clusters (#2953→#3186→#3689, #3527→#3624) but only ~6 of its
// 23 hits were re-plans — the rest were neighbours on a shared route. A digest line costs a glance;
// a wrongly filed issue costs a triage.
export const AUTO_FILE_SIGNALS = ["T1", "T2", "T3", "T4", "T5"];

// The labels `statusForIssue` (moneypenny/projects.mjs) reads a board Status from. `in-progress` is
// left out on purpose: it is the build lease, added and removed by every session by design, so its
// toggling is the pulse, not thrash (the same repetition ≠ thrash call as the research branches).
export const STATUS_LABELS = ["ready", "needs-eric", "needs-info"];

const ms = (iso) => Date.parse(iso);
const dayOf = (iso) => String(iso).slice(0, 10);
export const addDays = (date, n) =>
  new Date(ms(`${date}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);

/** T1's normalization — see the header for why exactly this and nothing fuzzier. */
export function normalizeComment(body) {
  return String(body ?? "")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, "<url>")
    .replace(/\d+/g, "<n>")
    .replace(/\s+/g, " ")
    .trim();
}

/** T2's key: the title, case- and whitespace-folded. The research lane's titles carry the event id
 *  (`[event-research] fomc-blackout-start-2027-07-17`), the repair lane's the failing job, so the
 *  title IS the "event id / failure signature" #3939 names without a per-lane parser. */
export const titleKey = (title) =>
  String(title ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const LANE_LABELS = ["ci-failure", "bottleneck", "feedback", "plan", "bug"];

/** Which lane filed an issue: its `[tag]` title prefix when it has one (every machine lane does),
 *  else its first lane label, else "other". */
export function laneOf({ title, labels = [] }) {
  const tag = /^\s*\[([^\]]+)\]/.exec(String(title ?? ""));
  if (tag) return tag[1].toLowerCase();
  return LANE_LABELS.find((l) => labels.includes(l)) ?? "other";
}

const inWindow = (iso, { since, today }) =>
  ms(iso) >= ms(`${since}T00:00:00Z`) && ms(iso) < ms(`${addDays(today, 1)}T00:00:00Z`);

export function detectT1(comments = [], win) {
  const groups = new Map();
  for (const c of comments) {
    if (!inWindow(c.createdAt, win)) continue;
    const k = `${c.issue}\u0000${c.author}\u0000${normalizeComment(c.body)}`;
    const g = groups.get(k) ?? { issue: c.issue, author: c.author, count: 0, first: c.createdAt };
    g.count += 1;
    g.last = c.createdAt;
    groups.set(k, g);
  }
  return [...groups.values()]
    .filter((g) => g.count >= T1_MIN_REPEATS)
    .map((g) => ({
      signal: "T1",
      key: `#${g.issue}`,
      date: dayOf(g.last),
      detail: `${g.author} posted ${g.count} near-identical comments (${dayOf(g.first)} → ${dayOf(g.last)})`,
      count: g.count,
    }));
}

export function detectT2(issues = [], win) {
  const byKey = new Map();
  for (const i of issues.filter((x) => !x.isPr).sort((a, b) => ms(a.createdAt) - ms(b.createdAt))) {
    const k = titleKey(i.title);
    byKey.set(k, [...(byKey.get(k) ?? []), i]);
  }
  const hits = [];
  for (const [k, list] of byKey) {
    const dupes = list.filter(
      (i, n) =>
        n > 0 &&
        inWindow(i.createdAt, win) &&
        list.slice(0, n).some((p) => ms(i.createdAt) - ms(p.createdAt) <= T2_WINDOW_DAYS * DAY),
    );
    if (!dupes.length) continue;
    hits.push({
      signal: "T2",
      key: k,
      lane: laneOf(list[0]),
      date: dayOf(dupes.at(-1).createdAt),
      detail: `filed ${dupes.length + 1}× within ${T2_WINDOW_DAYS}d: ${list.map((i) => `#${i.number}`).join(" ")}`,
      count: dupes.length,
    });
  }
  return hits;
}

const median = (xs) => {
  const ys = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(ys.length / 2);
  return ys.length % 2 ? ys[mid] : (ys[mid - 1] + ys[mid]) / 2;
};

export function detectT3(issues = [], win) {
  const perLaneDay = new Map();
  for (const i of issues.filter((x) => !x.isPr)) {
    const lane = laneOf(i);
    const days = perLaneDay.get(lane) ?? new Map();
    days.set(dayOf(i.createdAt), (days.get(dayOf(i.createdAt)) ?? 0) + 1);
    perLaneDay.set(lane, days);
  }
  const hits = [];
  for (const [lane, days] of perLaneDay) {
    for (let d = win.since; d <= win.today; d = addDays(d, 1)) {
      const count = days.get(d) ?? 0;
      const base = median(
        Array.from({ length: T3_BASELINE_DAYS }, (_, n) => days.get(addDays(d, -1 - n)) ?? 0),
      );
      if (count >= T3_BURST_FLOOR && count > T3_MULTIPLIER * base) {
        hits.push({
          signal: "T3",
          key: `${lane}@${d}`,
          lane,
          date: d,
          detail: `${count} ${lane} filings vs trailing ${T3_BASELINE_DAYS}d median ${base}`,
          count,
        });
      }
    }
  }
  return hits;
}

export function detectT4(events = [], win) {
  const groups = new Map();
  for (const e of events) {
    if (!(STATUS_LABELS.includes(e.label) && inWindow(e.createdAt, win))) continue;
    if (e.event !== "labeled" && e.event !== "unlabeled") continue;
    const k = `${e.issue}\u0000${e.label}`;
    const g = groups.get(k) ?? { issue: e.issue, label: e.label, count: 0 };
    g.count += 1;
    g.last = e.createdAt;
    groups.set(k, g);
  }
  return [...groups.values()]
    .filter((g) => g.count >= T4_MIN_TOGGLES)
    .map((g) => ({
      signal: "T4",
      key: `#${g.issue}:${g.label}`,
      date: dayOf(g.last),
      detail: `\`${g.label}\` added/removed ${g.count}×`,
      count: g.count,
    }));
}

/** The PR a revert title points at. An explicit `#N` that is itself a merged PR wins; a `#N` that
 *  is an ISSUE (the house convention — `revert(playbooks): scrap the requireWarmup opt-in (#3543)`
 *  names the plan, and the PR it reverts, #3563, only cites #3543 in its body) resolves to the
 *  latest PR merged before the revert that cites it. No `#N` → the quoted original title. */
export function revertTarget(revert, prs, lookup = () => undefined) {
  const quoted = /revert\s+"(.+)"/i.exec(revert.title)?.[1];
  const ref = Number(/#(\d+)/.exec(quoted ?? revert.title)?.[1]);
  if (ref) {
    const direct = prs.find((p) => p.number === ref) ?? lookup(ref);
    if (direct?.mergedAt) return direct;
    return prs
      .filter((p) => p.mergedAt && p.number !== revert.number && p.refs?.includes(ref))
      .filter((p) => ms(p.mergedAt) <= ms(revert.createdAt))
      .sort((a, b) => ms(b.mergedAt) - ms(a.mergedAt))[0];
  }
  return quoted ? prs.find((p) => titleKey(p.title) === titleKey(quoted)) : undefined;
}

export function detectT5(issues = [], win, { lookup = () => undefined } = {}) {
  const prs = issues.filter((x) => x.isPr);
  const hits = [];
  for (const r of prs) {
    if (!(/^\s*revert\b/i.test(r.title) && inWindow(r.createdAt, win))) continue;
    const target = revertTarget(r, prs, lookup);
    if (!target?.mergedAt) continue;
    const gap = ms(r.createdAt) - ms(target.mergedAt);
    if (gap < 0 || gap > T5_WINDOW_DAYS * DAY) continue;
    hits.push({
      signal: "T5",
      key: `#${target.number}`,
      date: dayOf(r.createdAt),
      detail: `#${r.number} reverts #${target.number} ${Math.round((gap / DAY) * 10) / 10}d after it merged`,
      count: 1,
    });
  }
  return hits;
}

/** T6: the surfaces a plan's metadata table names — backticked routes (`/app` prefix folded, so
 *  `/accounts` and `/app/accounts` are one surface) and code paths two segments deep or more
 *  (`src/` alone would overlap everything). Bare identifiers are not surfaces. */
export function surfacesOf(body) {
  const cell = /\|\s*\*\*Surface\*\*\s*\|([^\n]*)/.exec(String(body ?? ""))?.[1] ?? "";
  const out = new Set();
  for (const [, tok] of cell.matchAll(/`([^`]+)`/g)) {
    const t = tok.trim().toLowerCase().replace(/\/+$/, "");
    if (t.startsWith("/")) {
      const route = t.replace(/^\/app(?=\/|$)/, "");
      if (route.length > 1) out.add(route);
    } else if (t.includes("/") && t.split("/").filter(Boolean).length >= 2) out.add(t);
  }
  return [...out];
}

const overlaps = (a, b) => a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`);

/** Jaccard over surfaces, a prefix counting as a match (`src/playbooks` ⊇ `src/playbooks/x.ts`).
 *  Any-overlap was the first rule and the backtest killed it: `/trade` alone is named by 10 plans
 *  (an earnings badge, a multi-leg builder…) that are neighbours, not re-plans — 35 hits in 31 days. */
export function surfaceSimilarity(a, b) {
  const matched = a.filter((s) => b.some((t) => overlaps(s, t))).length;
  const union = a.length + b.length - matched;
  return union ? matched / union : 0;
}
export const T6_MIN_SIMILARITY = 0.5;

export function detectT6(issues = [], win) {
  const plans = issues
    .filter((i) => !i.isPr && i.labels?.includes("plan"))
    .map((i) => ({ ...i, surfaces: surfacesOf(i.body) }))
    .filter((i) => i.surfaces.length)
    .sort((a, b) => ms(a.createdAt) - ms(b.createdAt));
  const hits = [];
  for (const [n, p] of plans.entries()) {
    if (!inWindow(p.createdAt, win)) continue;
    const cited = new Set((String(p.body).match(/#\d+/g) ?? []).map((r) => Number(r.slice(1))));
    const prior = plans
      .slice(0, n)
      .filter((q) => ms(p.createdAt) - ms(q.createdAt) <= T6_LOOKBACK_DAYS * DAY)
      .filter((q) => !cited.has(q.number))
      .filter((q) => surfaceSimilarity(p.surfaces, q.surfaces) >= T6_MIN_SIMILARITY);
    if (!prior.length) continue;
    hits.push({
      signal: "T6",
      key: `#${p.number}`,
      date: dayOf(p.createdAt),
      detail: `re-plans ${prior.map((q) => `#${q.number}`).join(" ")}'s surface without citing it`,
      count: prior.length,
    });
  }
  return hits;
}

/** Pure. Every signal over one state snapshot, oldest first. */
export function scan(state = {}, win, opts = {}) {
  const { issues = [], comments = [], events = [] } = state;
  return [
    ...detectT1(comments, win),
    ...detectT2(issues, win),
    ...detectT3(issues, win),
    ...detectT4(events, win),
    ...detectT5(issues, win, opts),
    ...detectT6(issues, win),
  ]
    .map((h) => ({ ...h, autoFile: AUTO_FILE_SIGNALS.includes(h.signal) }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.signal.localeCompare(b.signal));
}

/** Pure. Per-signal counts plus hits/day — the falsifier's number (#3939 open question 1). */
export function summarize(hits, { since, today }) {
  const days = Math.round((ms(`${today}T00:00:00Z`) - ms(`${since}T00:00:00Z`)) / DAY) + 1;
  const bySignal = Object.fromEntries(
    ["T1", "T2", "T3", "T4", "T5", "T6"].map((s) => [s, hits.filter((h) => h.signal === s).length]),
  );
  return { days, total: hits.length, perDay: Math.round((hits.length / days) * 10) / 10, bySignal };
}

/** Pure. Human report: counts first, then one line per hit — T2 folded per lane, since one lane's
 *  duplicate storm is one fact to act on, not 164 lines to read. */
export function renderReport(hits, win) {
  const s = summarize(hits, win);
  const counts = Object.entries(s.bySignal).map(([k, v]) => `${k} ${v}`);
  const lines = [
    `Thrash scan — ${win.since} → ${win.today} · ${s.total} hit(s), ${s.perDay}/day · ${counts.join(" · ")}`,
  ];
  const t2 = hits.filter((h) => h.signal === "T2");
  for (const lane of [...new Set(t2.map((h) => h.lane))]) {
    const mine = t2.filter((h) => h.lane === lane);
    const extra = mine.reduce((a, h) => a + h.count, 0);
    const top = [...mine].sort((a, b) => b.count - a.count).slice(0, 3);
    lines.push(
      `  T2 ${lane}: ${mine.length} key(s) re-filed, ${extra} extra issue(s) — worst: ` +
        top.map((h) => `${h.key} (${h.count + 1}×)`).join(", "),
    );
  }
  for (const h of hits.filter((x) => x.signal !== "T2")) {
    lines.push(
      `  ${h.signal} ${h.date} ${h.key} — ${h.detail}${h.autoFile ? "" : " (digest-only)"}`,
    );
  }
  return lines.join("\n");
}
