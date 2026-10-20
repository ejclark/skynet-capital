import { cachedDateTimeFormat } from "../domain/intl-format.js";
import type { CapitalFlow } from "./capital-flow.js";
import { formatCurrency } from "./render-atoms.js";

/**
 * THE WORDS A CAPITAL FLOW IS SHOWN IN (#4563 slice 2) — the standings row's mark and the equity
 * curve's annotations, both from the ledger `capital-flow-watch.ts` fills.
 *
 * The voice is the lifecycle rows' (#4559): what happened, what it did to the number, and nothing
 * else. A flow is never a scarlet letter — no gain or loss tone rides with it, and the row keeps
 * its place — and it is never a gain either, which is the whole point: raw equity counts a refund
 * as money made, and the mark is what says otherwise. Every line says `inferred` (or, on the
 * curve, sits under a caption that does), because it is a deduction from two of our own records,
 * never a broker report.
 */

/** The standings row's mark: present only when the participant has a recorded flow. */
export interface FlowMark {
  readonly direction: "added" | "removed";
  /** The visible line, read after the member's rank and equity. */
  readonly text: string;
  /** The longer why, for a hover title and a screen reader. */
  readonly title: string;
}

/** One annotation on the equity curve, at the flow's instant. */
export interface CurveFlow {
  readonly t: string;
  readonly direction: "added" | "removed";
  readonly label: string;
}

/** The day a flow landed, as the market reads it ("Oct 5"). */
const flowDay = (iso: string): string =>
  cachedDateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  }).format(new Date(iso));

const notA = (direction: "added" | "removed"): string =>
  direction === "added" ? "not a gain" : "not a loss";

/** "Capital added $300,000 on Oct 5 — not a gain": one flow, in plain words. */
function flowLine(flow: CapitalFlow): string {
  const amount = formatCurrency(Math.abs(flow.amount));
  return `Capital ${flow.direction} ${amount} on ${flowDay(flow.at)} — ${notA(flow.direction)}`;
}

const TITLE =
  "This balance changed with no trade to explain it — a paper-balance top-up or reset, " +
  "inferred from our own records (the equity samples and the fill journal), not reported by the " +
  "broker. The row keeps its place; the mark says capital arrived or left, and that it is not " +
  "a gain or a loss — a flow-adjusted metric such as the 1M return already leaves it out.";

/**
 * The row's mark, or undefined when there is nothing to say — a row with no flow renders exactly
 * as it did before flows were recorded. Several flows net into one line that counts them.
 */
export function flowMark(flows: readonly CapitalFlow[]): FlowMark | undefined {
  const [only] = flows;
  if (!only) return undefined;
  if (flows.length === 1) {
    return { direction: only.direction, text: `${flowLine(only)} · inferred`, title: TITLE };
  }
  const net = flows.reduce((sum, flow) => sum + flow.amount, 0);
  const over = `over ${flows.length} balance changes`;
  const direction = net >= 0 ? "added" : "removed";
  const text =
    Math.round(net) === 0
      ? `Capital moved, net $0 ${over} — not a gain or a loss · inferred`
      : `Capital ${direction}, net ${formatCurrency(Math.abs(net))} ${over} — ${notA(direction)} · inferred`;
  return { direction, text, title: TITLE };
}

/**
 * The curve's annotations: each flow at or after the curve's first point, oldest first. A flow
 * from before the range starts happened on a day this curve does not draw, so it is left out.
 */
export function curveFlows(
  flows: readonly CapitalFlow[],
  points: readonly { readonly t: string }[],
): CurveFlow[] {
  const start = points[0]?.t;
  if (start === undefined) return [];
  const startMs = Date.parse(start);
  return flows
    .filter((flow) => Date.parse(flow.at) >= startMs)
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
    .map((flow) => ({ t: flow.at, direction: flow.direction, label: flowLine(flow) }));
}
