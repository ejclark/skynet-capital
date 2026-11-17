import type { CapitalFlow } from "./capital-flow.js";

/**
 * THE SHADOW LEDGER, GRADED (#4563, the tuning step). Slice 1 records every inferred capital flow in
 * shadow; slice 2 renders them but holds every mark behind `FLOWS_SHOWN_FROM` until `flowTolerance`
 * is tuned against what was recorded. The lines live only on the production volume, so the tuning
 * needs a read that never prints a member's id or a dollar figure — the repo and its run logs are
 * public. This census is that read: counts only.
 *
 * What it grades. Each line carries its witnesses (`capital-flow.ts`): the equity move (`amount`),
 * the cash our fill journal did not explain (`unexplainedCash`) and, since #7729, the net value of
 * the book the later sample still holds (`heldAfter`). An Alpaca paper reset clears every
 * position, so its cash moves by the equity change PLUS the cleared book's net value: more than
 * equity for a net-long book, less or even the other way for a net-short one (#7729 — the first
 * cut of this rule assumed cash always moved the same way and further, and graded those genuine
 * resets "disagree"). What a reset always leaves is a flat book. So a line agrees when the later
 * book is flat (a reset), or when cash matches the equity move (capital arriving without touching
 * the book). A false line — a market move that happened to share a five-minute window with an
 * unjournaled cash event (an assignment, an expiry, a fee) — leaves the book held and pairs two
 * unrelated numbers. The one false line this cannot catch: that unjournaled event is itself what
 * flattened the book (a covered call assigned away) in a window the market also moved.
 *
 * A line recorded before `heldAfter` existed can prove only the second story; when it does not,
 * it is `ungraded` — counted and named, never folded into either side or the floor table.
 *
 * What it can recommend. Only a RAISE: a line under the current rule was never recorded, so the
 * shadow series cannot show what a lower floor would catch. Each line's equity at the time is not
 * on the line, so the candidates are dollar floors applied to both witnesses, the same way
 * `inferCapitalFlow` applies the tolerance.
 */

/** When the shadow ledger started recording: #5836 (slice 1) merged. */
export const FLOWS_RECORDED_FROM = "2026-10-19T08:04:49Z";

/** How much shadow time the issue asked for before the marks are trusted. */
export const SHADOW_DAYS_WANTED = 7;

/** Dollar floors the census tests, smallest first. $1,000 is today's floor; $5,000 is today's
 *  0.5% rule at the $1,000,000 starting line. */
export const CANDIDATE_FLOORS: readonly number[] = [1_000, 5_000, 10_000, 25_000, 50_000];

export type WitnessVerdict = "agree" | "disagree" | "ungraded";

/**
 * Do the witnesses tell a flow's story? They agree when the later book is flat — a reset, which
 * clears every position whatever the cash then did — or when the unexplained cash matches the
 * equity move (capital that arrived with the book untouched), each give or take `slack` (the
 * tolerance a rounding or a fee is allowed). A line with no `heldAfter` that fails the second test
 * is `ungraded`: it predates the witness that would tell a reset from a false line.
 */
export function witnesses(flow: CapitalFlow, slack = 1_000): WitnessVerdict {
  if (Math.abs(flow.unexplainedCash - flow.amount) <= slack) return "agree";
  if (flow.heldAfter === undefined) return "ungraded";
  return Math.abs(flow.heldAfter) <= slack ? "agree" : "disagree";
}

export interface FloorRow {
  readonly floor: number;
  /** Lines both of whose witnesses clear the floor, by verdict. */
  readonly agree: number;
  readonly disagree: number;
}

export interface FlowCensus {
  readonly lines: number;
  readonly participants: number;
  readonly agree: number;
  readonly disagree: number;
  /** Lines recorded before `heldAfter` that only a reset could explain: out of the floor table. */
  readonly ungraded: number;
  /** Whole days from `FLOWS_RECORDED_FROM` to `now`. */
  readonly shadowDays: number;
  readonly floors: readonly FloorRow[];
  /** The smallest floor no disagreeing line clears, or undefined when none of the candidates does. */
  readonly recommendedFloor: number | undefined;
  /** Agreeing lines the recommended floor would also drop: the cost of the raise. */
  readonly agreeDropped: number;
  /** Enough shadow time has passed for the tuning to be read at all. */
  readonly ready: boolean;
}

const clears = (flow: CapitalFlow, floor: number): boolean =>
  Math.abs(flow.amount) > floor && Math.abs(flow.unexplainedCash) > floor;

/** Grade the shadow ledger. Pure: `now` is passed in so the spec pins the clock. */
export function censusFlows(flows: readonly CapitalFlow[], now: Date): FlowCensus {
  const verdicts = flows.map((flow) => ({ flow, verdict: witnesses(flow) }));
  const graded = verdicts.filter((v) => v.verdict !== "ungraded");
  const agree = graded.filter((v) => v.verdict === "agree").length;
  const floors = CANDIDATE_FLOORS.map((floor) => {
    const kept = graded.filter((v) => clears(v.flow, floor));
    const keptAgree = kept.filter((v) => v.verdict === "agree").length;
    return { floor, agree: keptAgree, disagree: kept.length - keptAgree };
  });
  const recommended = floors.find((row) => row.disagree === 0);
  const shadowDays = Math.max(
    0,
    Math.floor((now.getTime() - Date.parse(FLOWS_RECORDED_FROM)) / 86_400_000),
  );
  return {
    lines: flows.length,
    participants: new Set(flows.map((flow) => flow.participantId)).size,
    agree,
    disagree: graded.length - agree,
    ungraded: flows.length - graded.length,
    shadowDays,
    floors,
    recommendedFloor: recommended?.floor,
    agreeDropped: recommended ? agree - recommended.agree : 0,
    ready: shadowDays >= SHADOW_DAYS_WANTED,
  };
}

const usd = (n: number): string => `$${n.toLocaleString("en-US")}`;

function verdictLine(census: FlowCensus): string {
  if (!census.ready) {
    return `Not ready: ${census.shadowDays} of ${SHADOW_DAYS_WANTED} shadow days recorded.`;
  }
  if (census.lines === 0) {
    return "No flows recorded. Nobody topped up or reset, and no false line appeared: keep today's rule.";
  }
  if (census.agree + census.disagree === 0) {
    return "No line can be graded yet: every one predates the held-book witness (#7729). Wait for lines recorded since.";
  }
  if (census.disagree === 0) {
    return census.ungraded === 0
      ? "Every line's witnesses agree: keep today's rule."
      : "Every graded line's witnesses agree: keep today's rule.";
  }
  if (census.recommendedFloor === undefined) {
    return `A disagreeing line clears every candidate floor up to ${usd(CANDIDATE_FLOORS.at(-1) ?? 0)}: a floor alone will not separate them; read the detector, not the tolerance.`;
  }
  return `Raise the floor to ${usd(census.recommendedFloor)}: no disagreeing line clears it, at a cost of ${census.agreeDropped} agreeing line(s).`;
}

/**
 * The census as Markdown for a run summary. Counts and the candidate floors only — never a
 * participant id, a timestamp of a flow or an amount, because the run log is public.
 */
export function censusMarkdown(census: FlowCensus): string {
  const rows = census.floors.map((row) => `| ${usd(row.floor)} | ${row.agree} | ${row.disagree} |`);
  return [
    "## Capital-flow shadow census (#4563)",
    "",
    `**${verdictLine(census)}**`,
    "",
    `- Lines: ${census.lines} across ${census.participants} participant(s); witnesses agree on ${census.agree}, disagree on ${census.disagree}.`,
    ...(census.ungraded > 0
      ? [
          `- Ungraded: ${census.ungraded}, recorded before lines carried the held book (#7729) and not a plain top-up, so only a reset or a false line could explain them. Left out of the floor table.`,
        ]
      : []),
    `- Shadow time: ${census.shadowDays} day(s) since recording began.`,
    "",
    "| Floor on both witnesses | Agree kept | Disagree kept |",
    "|---|---|---|",
    ...rows,
    "",
  ].join("\n");
}

/** Read JSONL text into flows, skipping a blank or unparseable line rather than failing the read. */
export function parseFlowLines(text: string): CapitalFlow[] {
  const flows: CapitalFlow[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    try {
      const value = JSON.parse(line) as Partial<CapitalFlow>;
      if (
        typeof value.participantId === "string" &&
        typeof value.amount === "number" &&
        typeof value.unexplainedCash === "number"
      ) {
        // A held book that is not a number would read as a disagreeing line; drop it to ungraded.
        const { heldAfter, ...rest } = value as CapitalFlow;
        flows.push(typeof heldAfter === "number" ? { ...rest, heldAfter } : rest);
      }
    } catch {
      // A torn last line from a write in flight: skip it, the rest still counts.
    }
  }
  return flows;
}
