import { CALL_WORDS, LEVER_NAME, pct, usd } from "./position-guidance-rules.js";
import type { Confidence, PositionGuidance, PulseStatus } from "./position-guidance-types.js";

/**
 * POSITION GUIDANCE AS MARKDOWN — the same fixed-order template the UI renders, for chat, the companion and
 * issue comments, at zero model tokens (#3729). Section order and headings are a contract pinned by
 * `tests/options/position-guidance-markdown.spec.ts`; every section always renders, and an empty one
 * says why rather than disappearing (a missing section reads as "nothing to see", which is a claim).
 *
 * Hue never carries meaning (a standing reader is red/green colourblind — CLAUDE.md): confidence and
 * freshness are words plus a shape (●●○, ✓ ~ ✕), never a colour alone.
 */

const DOTS: Readonly<Record<Confidence, string>> = {
  high: "●●●",
  medium: "●●○",
  low: "●○○",
  none: "○○○",
};

const PULSE_MARK: Readonly<Record<PulseStatus, string>> = { fresh: "✓", aging: "~", stale: "✕" };

const DTE_WORD = {
  in: "✓ usable",
  "too-short": "✕ under 7 days",
  "after-decision": "✕ after your hold-or-sell date",
  "spans-print": "✕ crosses earnings",
} as const;

/** Escape the one character that breaks a table cell. */
const tableCell = (s: string): string => s.replaceAll("|", "\\|");

function header(b: PositionGuidance): string[] {
  const session = b.sessionOpen ? "market open" : "market closed — quotes as of close";
  return [`## ${b.symbol} · ${usd(b.spot)} · as of ${b.asOf} · ${session}`, ""];
}

function pulse(b: PositionGuidance): string[] {
  const rows = b.pulse.map(
    (p) =>
      `| ${PULSE_MARK[p.status]} ${p.status} | ${p.id} | ${tableCell(p.source)} | ${p.asOf ?? "—"} | ${tableCell(p.note)} |`,
  );
  return [
    "### 1 · Pulse",
    "",
    ...(rows.length
      ? ["| Status | Input | Source | As of | Note |", "|---|---|---|---|---|", ...rows]
      : ["_No pulse reported — treat every number below as unverified._"]),
    "",
  ];
}

function stake(b: PositionGuidance): string[] {
  const s = b.stake;
  const parts = [
    `Shares **${s.shares ?? 0}**`,
    s.costBasis !== undefined ? `basis **${usd(s.costBasis)}**` : "basis —",
    s.unrealizedPnl !== undefined
      ? `unrealized **${s.unrealizedPnl >= 0 ? "+" : "−"}${usd(Math.abs(s.unrealizedPnl))}** (${pct(s.unrealizedPct ?? 0, 1)})`
      : undefined,
    s.cash !== undefined ? `cash **${usd(s.cash)}**` : "cash —",
    s.goal ? `goal **${s.goal}**` : "goal — (not set)",
    s.happyToOwnAt !== undefined ? `happy to own at **${usd(s.happyToOwnAt)}**` : undefined,
    s.concentration !== undefined ? `**${pct(s.concentration)}** of portfolio` : undefined,
  ].filter(Boolean);
  return ["### 2 · Your stake", "", parts.join(" · "), ""];
}

function calls(b: PositionGuidance): string[] {
  const rows = b.calls.map((c) => {
    const call = `**${CALL_WORDS[c.call] ?? c.call}**${c.atOpen ? " _(plan for the open)_" : ""}`;
    const reasons = c.reasons.map((r) => tableCell(r.text)).join("<br>");
    const until = c.until ? `<br>_Until ${c.until.date}: ${tableCell(c.until.why)}_` : "";
    return `| ${LEVER_NAME[c.lever]} | ${call} | ${DOTS[c.confidence]} ${c.confidence} | ${reasons}${until} | ${tableCell(c.provesWrong)} |`;
  });
  return [
    "### 3 · The calls",
    "",
    "| | Call | Confidence | Why | Come back if |",
    "|---|---|---|---|---|",
    ...rows,
    "",
  ];
}

function waiting(b: PositionGuidance): string[] {
  return [
    "### 4 · Until / waiting on",
    "",
    ...(b.waitingOn.length
      ? b.waitingOn.map((w) => `- [ ] **${w.date}** — ${w.label} _(${w.source})_`)
      : ["_Nothing dated on the calendar — the calls stand until prices or the research change._"]),
    "",
  ];
}

function strip(b: PositionGuidance): string[] {
  return [
    "### 5 · Expiry dates",
    "",
    ...(b.dteStrip.length
      ? [
          "| Expiry | Days left | Usable? | Events before it |",
          "|---|---|---|---|",
          ...b.dteStrip.map(
            (m) =>
              `| ${m.expiration} | ${m.dte} | ${DTE_WORD[m.verdict]} | ${tableCell(m.catalysts.join("; ")) || "—"} |`,
          ),
        ]
      : ["_No expirations listed._"]),
    "",
  ];
}

function ladder(b: PositionGuidance): string[] {
  const rows = b.ladder.map((r) => {
    const kind = r.lever === "covered-calls" ? "call" : "put";
    const outcome =
      r.returnIfCalled !== undefined
        ? `sold at ${usd(r.strike)}: ${pct(r.returnIfCalled, 1)} over what you paid`
        : `you buy at ${usd(r.effectiveEntry ?? r.strike)} a share`;
    const flag = r.deltaDisagreement !== undefined ? " ⚠ data check: feed and model disagree" : "";
    return `| ${r.expiration} (${r.dte}d) | ${usd(r.strike)} ${kind} | ${usd(r.bid * 100)} | ${pct(r.annualizedYield, 1)} | ${pct(r.probAssigned)} / ${pct(r.probTouch)} | ${outcome} | 1 of ${r.maxContracts}${flag} |`;
  });
  return [
    "### 6 · Strike ladder",
    "",
    ...(rows.length
      ? [
          "| Expiry | Strike | You receive now | ≈ a year, if repeated | Chance exercised: at expiry / at any point | If exercised | Contracts |",
          "|---|---|---|---|---|---|---|",
          ...rows,
        ]
      : ["_No strike passes our checks — see the calls above for why._"]),
    "",
  ];
}

function changes(lines: readonly string[] | undefined): string[] {
  const body =
    lines === undefined
      ? ["_First look at this symbol — nothing to compare yet._"]
      : lines.length
        ? lines.map((l) => `- ${l}`)
        : ["_Nothing moved since you last looked._"];
  return ["### 7 · What changed since you last looked", "", ...body, ""];
}

function assumptions(b: PositionGuidance): string[] {
  const r = b.richness;
  const richLine =
    r.basis === "iv-rank"
      ? `Option prices judged against their own past year (${r.ivRank?.toFixed(0)} on a 0–100 scale).`
      : r.basis === "iv-vs-realized"
        ? "Option prices judged against how much the stock has actually moved — a full year of option-price history isn't collected yet."
        : "No read yet on whether option prices are high or low.";
  return [
    "### 8 · Assumptions & disclosure",
    "",
    ...[richLine, ...b.assumptions].map((a) => `- ${a}`),
    "",
    `_${b.disclosure}_`,
  ];
}

/** Render guidance. `changed` is `diffGuidance(previous, guidance)` — undefined on a first visit. */
export function guidanceToMarkdown(
  guidance: PositionGuidance,
  changed?: readonly string[],
): string {
  return [
    ...header(guidance),
    ...pulse(guidance),
    ...stake(guidance),
    ...calls(guidance),
    ...waiting(guidance),
    ...strip(guidance),
    ...ladder(guidance),
    ...changes(changed),
    ...assumptions(guidance),
  ].join("\n");
}
