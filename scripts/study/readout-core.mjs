// The readout's words and layout (#4943) — pure: readout.mjs gathers the frames and files, this
// turns them into markdown. The order is fixed by the plan and never changes between studies, so
// the owner learns where to look once (docs/members/study/README.md → "The readout"):
//   1 a picture · 2 the headline · 3 new structural problems, uncapped · 4 the scorecard ·
//   5 the design battle-test · 6 the job map · 7 what it missed · 8 one question.
// Plain words throughout; key items are shown by id, with their wording only when revealed.

import { basename } from "node:path";

export const SECTIONS = [
  "A member, stuck",
  "What it found",
  "New structural problems",
  "Your items, one by one",
  "The design battle-test",
  "What members hire this area for",
  "What it missed",
  "One question",
];
const CLASS_WORDS = {
  members: "simulated members",
  experts: "expert reviews",
  words: "the pass over the words",
  instruments: "the measurements",
};

const pct = (x) => (x === null || x === undefined ? "n/a" : `${Math.round(x * 100)}%`);
const range = (w) => (w ? `${pct(w.lo)}–${pct(w.hi)}` : "n/a");
const img = (alt, path) => (path ? `![${alt}](${path})` : "_none_");
const plural = (k, one, many) => `${k} ${k === 1 ? one : many}`;
const sev = (s) => (/^[0-4]$/.test(String(s)) ? `severity ${s} of 4` : s);
const cell = (s) =>
  String(s ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\n+/g, " ");

/** How a member's action reads in a caption. */
export function actionWords(action, record) {
  const a = action ?? {};
  switch (a.type) {
    case "tap": {
      const name = record?.tap?.hit?.name ?? a.text;
      return name ? `tapped "${name}"` : `tapped at (${a.x}, ${a.y})`;
    }
    case "scroll":
      return `scrolled ${a.dir} ${a.screens === 0.5 ? "half a screen" : "a screen"}`;
    case "type":
      return `typed "${a.text}"`;
    case "key":
      return `pressed ${a.key}`;
    case "back":
      return "went back";
    case "hover":
      return `pointed at (${a.x}, ${a.y})`;
    case "done":
      return `said they were done: "${a.answer ?? ""}"`;
    case "give_up":
      return `gave up: "${a.why ?? ""}"`;
    default:
      return "did nothing the recorder could perform";
  }
}

/**
 * The turn of a session with the most confusion (the first on a tie): its frame before, the action,
 * the frame after (null when the action ended the session), the member's words. Null if no turns.
 */
export function worstMoment(turns, trace) {
  const played = turns.filter((t) => !t.refused && typeof t.confusion === "number");
  if (!played.length) return null;
  const turn = played.reduce((w, t) => (t.confusion > w.confusion ? t : w));
  const record = trace.find((r) => r.step === turn.step);
  const prev = trace.filter((r) => r.step < turn.step && r.frame).at(-1);
  return {
    step: turn.step,
    confusion: turn.confusion,
    before: prev ? basename(prev.frame) : "000.jpg",
    after: record?.frame ? basename(record.frame) : null,
    action: actionWords(turn.action, record),
    quote: [turn.as_member, turn.noticed].filter(Boolean).join(" — "),
  };
}

/** One sentence: what's wrong · the principle it breaks · why it matters · the fix. */
export function formulaSentence(f) {
  const say = (x) => (x ? String(x).replace(/[.\s]+$/, "") : "(not named)");
  return `${say(f.what)} — this breaks ${say(f.principle)}, which matters because ${say(f.why)}; the fix: ${say(f.fix)}.`;
}

const label = (id, titles) => (titles?.[id] ? `${id} — ${titles[id]}` : id);

function picture({ picture: p, ownerShot }) {
  const yours = ownerShot
    ? img("your screenshot", ownerShot)
    : "_your screenshot goes here (`--owner-shot`)_";
  if (!p)
    return ["No member session was recorded, so there is no frame to show.", "", `Yours: ${yours}`];
  return [
    `The ${p.member} member on ${p.viewport === "desktop" ? "a desktop" : "a phone"}, at their most confused (confusion ${p.confusion} of 3):`,
    "",
    "| Before | What they did | After | Yours |",
    "|---|---|---|---|",
    `| ${img("before", p.before)} | ${cell(p.action)} | ${img("after", p.after)} | ${yours} |`,
    "",
    `> "${p.quote}" — ${p.member}`,
  ];
}

function headline({ grade }) {
  const h = grade.headline;
  const t = grade.classes.blind.thoroughness;
  const lines = [
    `**Found ${h.found} of your ${h.renders} without seeing them · ${h.structural} new structural problems · ${h.smaller} new smaller ones.**`,
    "",
    `With ${h.renders} items the range is wide: ${h.found} of ${h.renders} is anywhere from ${t.wilson ? `${pct(t.wilson.lo)} to ${pct(t.wilson.hi)}` : "n/a"} (95% confidence).` +
      (h.struck
        ? ` ${h.struck} of your ${h.total} could not be shown in the test world and ${h.struck === 1 ? "was" : "were"} struck before the run.`
        : ""),
  ];
  const failed = grade.gate.checks
    .filter((c) => !c.pass)
    .map((c) => `${c.name} (${c.value ?? "n/a"}, needs ${c.need})`);
  lines.push(
    "",
    grade.gate.pass
      ? "It passed the bar for a design battle-test."
      : `It missed the bar: ${failed.join(" · ")}.`,
  );
  if (grade.gate.kill.met)
    lines.push(
      "",
      `The stop rule fired (${grade.gate.kill.why.join(", ")}): nothing is revised until you answer.`,
    );
  return lines;
}

function structural({ structural: items }) {
  if (!items.length) return ["None that a checker confirmed."];
  return items.flatMap((s, i) => {
    const f = s.finding;
    const strip = s.frames.length
      ? [
          `| ${s.frames.map((_, n) => `Frame ${n + 1}`).join(" | ")} |`,
          `|${"---|".repeat(s.frames.length)}`,
          `| ${s.frames.map((p) => img("frame", p)).join(" | ")} |`,
        ]
      : ["_No frames were recorded with this finding._"];
    const who = `${CLASS_WORDS[s.class] ?? s.class}${f.member ? ` (${f.member})` : ""}`;
    return [
      `### ${i + 1}. ${f.what}`,
      "",
      ...strip,
      "",
      ...(f.evidence?.quote ? [`> "${f.evidence.quote}"`, ""] : []),
      formulaSentence(f),
      "",
      `_Found by ${who}${f.severity ? ` · ${sev(f.severity)}` : ""}${f.where ? ` · ${f.where}` : ""}${s.also ? ` · reported ${s.also} more time${s.also > 1 ? "s" : ""}` : ""}._`,
      "",
    ];
  });
}

const mark = (score, primed) =>
  (score >= 1 ? "yes" : score >= 0.5 ? "partly" : "—") +
  (score >= 0.5 && primed ? " (hinted)" : "");

function scorecard({ grade, titles }) {
  const rows = grade.gold.filter((g) => g.tier === "main");
  const c = grade.classes;
  const found = (cls) =>
    `${c[cls].thoroughness.found} of ${c[cls].thoroughness.renders} (${range(c[cls].thoroughness.wilson)})`;
  const lines = [
    "| Your item | Members | Experts | Words | Measurements (not blind) | Note |",
    "|---|---|---|---|---|---|",
    ...rows.map((g) => {
      const note = [g.struck && "struck", g.disputed && "**disputed**"].filter(Boolean).join(", ");
      if (g.struck) return `| ${cell(label(g.id, titles))} | — | — | — | — | ${note} |`;
      const s = g.scores;
      return `| ${cell(label(g.id, titles))} | ${mark(s.members, g.primed)} | ${mark(s.experts)} | ${mark(s.words)} | ${mark(s.instruments)} | ${note} |`;
    }),
    `| **Found** | ${found("members")} | ${found("experts")} | ${found("words")} | ${found("instruments")} | |`,
    "",
    "The measurements were designed after reading your list, so they never count as finding anything.",
  ];
  const a = grade.agreement;
  lines.push(
    "",
    `The two matchers agreed on ${pct(a.observed)} of ${plural(a.n, "finding", "findings")} (Cohen's kappa ${a.kappa ?? "n/a"}).`,
  );
  for (const d of a.disputed) {
    const said = (m) => (m ? `${m.gold ?? "none"} (${m.score})` : "nothing");
    const settled =
      d.resolvedBy === "tie-break"
        ? `a third matcher said ${said(d.tiebreak)}`
        : "unsettled, so it counts as no match";
    lines.push(
      `- Disputed ${d.finding}: one matcher said ${said(d.m1)}, the other ${said(d.m2)}; ${settled}.`,
    );
  }
  const v = c.blind.validity;
  lines.push(
    "",
    `Of what the blind evaluators reported, ${v.real} of ${v.reported} were real (${pct(v.rate)})` +
      (v.worldArtifacts
        ? `; ${v.worldArtifacts} came from the test world, not the app, and ${v.worldArtifacts === 1 ? "is" : "are"} left out`
        : "") +
      (v.unchecked
        ? `; ${v.unchecked} ${v.unchecked === 1 ? "was" : "were"} never checked and ${v.unchecked === 1 ? "counts" : "count"} as not real`
        : "") +
      ".",
  );
  const p = grade.primed;
  if (p.primed.length)
    lines.push(
      "",
      `Hinted: ${p.primed.join(", ")} ${p.primed.length > 1 ? "were" : "was"} found only by members whose own description hints at it. Without them: ${p.unprimed.length} of ${grade.headline.renders} (${range(p.unprimedWilson)}).`,
    );
  const per = Object.entries(grade.perMember).map(
    ([m, t]) =>
      `${m} ${t.found} of ${t.renders}${t.primed.length ? ` (${t.primed.length} hinted)` : ""}`,
  );
  if (per.length) lines.push("", `By member: ${per.join(" · ")}.`);
  const e = grade.diagnostics.easyMode;
  if (e.sessions)
    lines.push(
      "",
      e.flagged
        ? `Too easy: members succeeded in ${pct(e.successRate)} of ${e.sessions} sessions with a middle ease of ${e.medianEase} of 7, so they are stronger than the people they stand in for.`
        : `Members succeeded in ${pct(e.successRate)} of ${e.sessions} sessions; middle ease ${e.medianEase ?? "n/a"} of 7.`,
    );
  return lines;
}

function battle({ battle: b, battleReason }) {
  if (!b) return [`Did not run: ${battleReason}.`];
  const rows = b.shapes.map(
    (s) =>
      `| ${s.name === b.least ? `**${cell(s.name)}**` : cell(s.name)} | ${pct(s.success)} | ${s.wrongTurns} | ${s.involuntaryScroll}px | ${s.ease} of 7 |`,
  );
  return [
    `${b.fork}: the members struggled least with **${b.least}**.`,
    "",
    "| Shape | Success | Wrong turns | Unasked-for scrolling | Ease |",
    "|---|---|---|---|---|",
    ...rows,
    "",
    `| ${b.shapes.map((s) => cell(s.name)).join(" | ")} |`,
    `|${"---|".repeat(b.shapes.length)}`,
    `| ${b.shapes.map((s) => img(s.name, s.frame)).join(" | ")} |`,
  ];
}

function jobMap({ jobMap: j }) {
  if (!j) return ["No job map was given."];
  if (j.kind === "md") return [j.text.trim().replace(/^(#{1,4}) /gm, "#### ")];
  return [
    "| Stage | What members want from it | What the area holds |",
    "|---|---|---|",
    ...j.stages.map(
      (s) =>
        `| ${cell(s.stage)}${s.served === false ? " (not served here)" : ""} | ${cell((s.outcomes ?? []).join("; "))} | ${cell(s.holds ?? "—")} |`,
    ),
    ...(j.measure?.length ? ["", `Measured: ${j.measure.join("; ")}.`] : []),
  ];
}

function missed({ grade, titles }) {
  const main = grade.gold.filter((g) => g.tier === "main");
  const lost = main.filter((g) => !g.struck && g.scores.blind < 0.5);
  const list = (gs) => gs.map((g) => label(g.id, titles)).join(" · ");
  const groups = [
    ["No task went there", lost.filter((g) => g.touched === false)],
    ["Went there and didn't see it", lost.filter((g) => g.touched === true)],
    [
      "Not known whether a task went there (no record of which pages were touched)",
      lost.filter((g) => g.touched === null),
    ],
    ["Could not be shown in the test world, struck before the run", main.filter((g) => g.struck)],
  ].filter(([, gs]) => gs.length);
  if (!groups.length) return ["Nothing on your list was missed."];
  return groups.map(([head, gs]) => `- **${head}:** ${list(gs)}`);
}

function question({ nextArea, cost }) {
  return [
    `Scale to **${nextArea}** next (predicted cost: ${cost}), revise the method first, or stop?`,
    "",
    "If you like, sit one short session yourself on the same tasks.",
  ];
}

const BODIES = [picture, headline, structural, scorecard, battle, jobMap, missed, question];

/** The whole readout, sections in the fixed order. */
export function renderReadout(model) {
  const out = [`# Member study readout — ${model.study}`, ""];
  for (const [i, title] of SECTIONS.entries()) out.push(`## ${title}`, "", ...BODIES[i](model), "");
  return `${out
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()}\n`;
}
