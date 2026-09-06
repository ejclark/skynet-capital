import type { ReactElement } from "react";
import type { PlayInfo, PlaysIndex } from "../live/options";
import { navForPlay, type PlayCode, playForNav, type TicketNavState } from "../live/plays";

/**
 * THE FEATURE LAYER'S OWN NAV (#1461, slice 2) — Instrument · Side · Type as segmented controls,
 * the ticket's controls and not the ladder's. Each segment IS a rung (`playForNav`), so choosing
 * one presets `?play=` and the rail above follows; `?play=` arriving from the rail or a learn
 * link presets these the other way. Two views of one state.
 *
 * Spread (#1671) is a third instrument, not a fourth side/type combination: it maps to a single
 * rung (401) with no Side/Type choice of its own — the multi-leg builder's leg form carries
 * buy/sell/put/call per leg once unlocked. Zero-DTE (501) has no ticket of its own at all; it's an
 * attribute any option order can carry, gated at review/submit rather than through this nav.
 *
 * Locked = visible, disabled, explained (the research condition #1461 carries): a segment whose
 * rung is locked stays on the page, disabled, with the rung that opens it named underneath —
 * never hidden, never silently dead. One exception, the server's own rule: while the
 * first-message gate holds, the per-segment reasons are withheld and the gate's one sentence is
 * shown once instead. Sell stock (102) locks like every other rung — it is exempt only from the
 * feedback wall (`trade-api-routes.ts`'s buy-only gate), never from the per-rung ladder lock; an
 * earlier pass here special-cased it as if it were, which reopened the exact ticket the ladder
 * was built to keep shut (fixed 2026-09-06, alongside `trade-gate.tsx` gaining the same check
 * `option-gate.tsx` already had). Nothing here decides anything — locked arrives computed, and
 * the server refuses regardless.
 * @category trading
 */
export function TicketNav({
  plays,
  code,
  gate,
  onPreset,
}: {
  readonly plays: readonly PlayInfo[];
  /** The rung the ticket is preset to (`?play=`). */
  readonly code: string;
  readonly gate?: PlaysIndex["gate"];
  readonly onPreset: (code: PlayCode) => void;
}): ReactElement {
  const nav = navForPlay(code);
  const byCode = new Map(plays.map((p) => [p.code, p]));
  const option = (label: string, next: TicketNavState): Segment => {
    const target = playForNav(next);
    const play = byCode.get(target);
    const locked = Boolean(play?.locked);
    const why =
      locked && !gate && play?.opensAfter
        ? `${label}: opens after ${play.opensAfter.code} fills`
        : undefined;
    return { label, target, locked, why, pressed: target === code };
  };
  const groups: readonly Group[] = [
    {
      label: "Instrument",
      segments: [
        option("Stock", { ...nav, instrument: "stock" }),
        option("Option", { ...nav, instrument: "option" }),
        option("Spread", { ...nav, instrument: "spread" }),
      ],
    },
    // Spread has no Side/Type choice at the nav level — the multi-leg builder's own leg form
    // carries buy/sell/put/call per leg, once the rung is unlocked.
    ...(nav.instrument === "stock"
      ? [
          {
            label: "Side",
            segments: [
              option("Buy", { ...nav, side: "buy" }),
              option("Sell", { ...nav, side: "sell" }),
            ],
          },
        ]
      : nav.instrument === "option"
        ? [
            {
              label: "Side",
              segments: [
                option("Sell to open", { ...nav, side: "sell" }),
                option("Buy to open", { ...nav, side: "buy" }),
              ],
            },
            {
              label: "Type",
              segments: [
                option("Put", { ...nav, optionType: "put" }),
                option("Call", { ...nav, optionType: "call" }),
              ],
            },
          ]
        : []),
  ];
  return (
    <nav className="ticket-nav" aria-label="Ticket">
      {groups.map((group) => (
        <SegmentGroup key={group.label} group={group} onPreset={onPreset} />
      ))}
      {gate ? <p className="ticket-nav-gate">{gate.note}</p> : null}
    </nav>
  );
}

interface Segment {
  readonly label: string;
  readonly target: PlayCode;
  readonly locked: boolean;
  readonly why?: string;
  readonly pressed: boolean;
}

interface Group {
  readonly label: string;
  readonly segments: readonly Segment[];
}

function SegmentGroup({
  group,
  onPreset,
}: {
  readonly group: Group;
  readonly onPreset: (code: PlayCode) => void;
}): ReactElement {
  // One reason per group: the segment you're looking at (the preset) first, else the first locked.
  const why =
    group.segments.find((s) => s.pressed && s.why)?.why ?? group.segments.find((s) => s.why)?.why;
  return (
    <fieldset className="ticket-nav-group">
      <legend className="ticket-nav-label">{group.label}</legend>
      <div className="toggle-group">
        {group.segments.map((s) => (
          <button
            key={s.target}
            type="button"
            aria-pressed={s.pressed}
            disabled={s.locked}
            title={s.why}
            onClick={() => onPreset(s.target)}
          >
            {s.label}
          </button>
        ))}
      </div>
      {why ? <span className="seg-why">🔒 {why}</span> : null}
    </fieldset>
  );
}
