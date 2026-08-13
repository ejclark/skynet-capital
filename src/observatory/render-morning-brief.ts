/** Plain-text rendering of a `MorningBrief` — meant for a terminal or a scheduled log, not HTML. */
import type { MorningBrief } from "./morning-brief.js";

const fmtMoney = (n: number): string => `$${Math.round(n).toLocaleString("en-US")}`;

function personaSection(brief: MorningBrief): string {
  const lines = brief.personas.map((p) => {
    const status = p.ready ? "READY" : "NOT READY";
    return `  ${p.name} — ${status}\n    ${p.readinessReason}\n    "${p.thesis}"`;
  });
  return `PERSONAS\n${lines.join("\n") || "  (none configured)"}`;
}

function playbookSection(brief: MorningBrief): string {
  const lines = brief.playbooks.map((p) => {
    const state = p.desiredState.toUpperCase();
    return `  ${p.id} (${p.mode}) — ${state} today\n    ${p.thesis}\n    evidence: ${p.evidence}`;
  });
  const warning = brief.rejectedPlaybookTokens.length
    ? `\n  ⚠ SKYNET_PLAYBOOKS has unrecognized token(s): ${brief.rejectedPlaybookTokens.join(", ")}`
    : "";
  return `PLAYBOOKS\n${lines.join("\n") || "  (none enabled)"}${warning}`;
}

function calendarSection(brief: MorningBrief): string {
  const lines = brief.calendar.map((c) => {
    const when = c.daysUntil === 0 ? "TODAY" : c.daysUntil === 1 ? "tomorrow" : `${c.daysUntil}d`;
    return `  ${c.symbol.padEnd(6)} ${c.date}  ${c.status.padEnd(9)} (${when})`;
  });
  return `EARNINGS CALENDAR\n${lines.join("\n") || "  (nothing upcoming in the window)"}`;
}

function liveSignalSection(brief: MorningBrief): string {
  if (!brief.liveSignal.available) {
    return `LIVE SIGNAL (sentiment/momentum)\n  ${brief.liveSignal.note}`;
  }
  const lines = Object.entries(brief.liveSignal.bySymbol).map(
    ([symbol, s]) =>
      `  ${symbol.padEnd(6)} sentiment ${s.sentiment.toFixed(2)}  momentum ${s.momentum.toFixed(3)}`,
  );
  return `LIVE SIGNAL (sentiment/momentum)\n${lines.join("\n")}`;
}

function positionsSection(brief: MorningBrief): string {
  if (brief.positions.length === 0) {
    return "POSITIONS\n  (no bots supplied — run with credentials sourced to include this section)";
  }
  const lines = brief.positions.map((p) => {
    if (p.error) {
      return `  ${p.botName} — ERROR: ${p.error}`;
    }
    const held = p.positions ?? [];
    const header = `  ${p.botName} — ${fmtMoney(p.cash ?? 0)} cash, ${held.length} open position(s)`;
    const rows = held.map(
      (pos) => `    ${pos.symbol.padEnd(6)} x${pos.quantity}  avg ${fmtMoney(pos.avgPrice)}`,
    );
    return [header, ...rows].join("\n");
  });
  return `POSITIONS\n${lines.join("\n")}`;
}

/** The full brief as plain text — sections in reading order for a pre-market skim. */
export function renderMorningBriefText(brief: MorningBrief): string {
  return [
    `SKYNET CAPITAL — MORNING BRIEF`,
    `Generated: ${brief.asOf}`,
    "",
    personaSection(brief),
    "",
    playbookSection(brief),
    "",
    calendarSection(brief),
    "",
    liveSignalSection(brief),
    "",
    positionsSection(brief),
  ].join("\n");
}
