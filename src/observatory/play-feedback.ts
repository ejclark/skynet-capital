/**
 * The play-feedback log — a game-combat model for how the board reports what its characters are doing.
 * A character invokes a play (an attack/defense move from its playbook); the play resolves against the
 * market and reports back: HIT (paid off), MISS (stopped out), or LIVE (still playing out). The
 * "damage/reward" is realized P/L. Unlike a single terminal narrating one play, this is a *log that
 * holds many characters at once* — every bot's actions stack, so the board can show a whole team acting.
 *
 * A self-contained, pure board piece (see the composable-board direction in docs/IDEAS.md): outcomes
 * in, HTML out. Drops into the observatory now and is portable to the login canvas next.
 */
type PlayResult = "hit" | "miss" | "live";

export interface PlayOutcome {
  /** The character (persona alias) invoking the play. */
  readonly character: string;
  /** The play from its playbook, e.g. "IRON CONDOR". */
  readonly play: string;
  readonly result: PlayResult;
  /** Damage dealt / reward earned — realized P/L of the play (negative = damage taken). */
  readonly pnl: number;
  /** One-line flavor of the resolution, e.g. "premium kept" / "stopped out". */
  readonly note?: string;
}

const RESULT_LABEL: Record<PlayResult, string> = { hit: "HIT", miss: "MISS", live: "LIVE" };

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;",
  );
}

function money(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
}

/** One feedback row: character · play · result badge · damage/reward · note. */
function row(o: PlayOutcome): string {
  const plCls = o.pnl > 0 ? "pf-pos" : o.pnl < 0 ? "pf-neg" : "pf-flat";
  return `<li class="pf-row pf-${o.result}">
      <span class="pf-char">${esc(o.character)}</span>
      <span class="pf-play">${esc(o.play)}</span>
      <span class="pf-result">${RESULT_LABEL[o.result]}</span>
      <span class="pf-pnl ${plCls}">${o.result === "live" ? "…" : money(o.pnl)}</span>
      ${o.note ? `<span class="pf-note">${esc(o.note)}</span>` : ""}
    </li>`;
}

/** Render the multi-character feedback log. Empty → an honest idle line, never a fake row. */
export function renderPlayFeedbackLog(outcomes: readonly PlayOutcome[]): string {
  if (outcomes.length === 0) {
    return `<div class="play-feedback play-feedback-idle"><span class="pf-idle">No plays in flight — the desk is watching.</span></div>`;
  }
  return `<ul class="play-feedback">${outcomes.map(row).join("")}</ul>`;
}
