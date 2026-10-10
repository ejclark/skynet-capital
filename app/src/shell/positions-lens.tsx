import { useSearch } from "@tanstack/react-router";
import type { CSSProperties, ReactElement } from "react";
import type { Decision, DeskAllocation, DeskPosition } from "../live/desk";
import { useRefineSearch } from "../live/refine-search";
import { LessonTerm } from "./glossary-term";
import { FactBadge } from "./position-guidance-slot";
import { squarify } from "./treemap";
import type { RowMark } from "./use-row-marks";

/**
 * THE POSITIONS LENSES (#3689 slices 9–10, design handoff 3c): three ways to look at the same
 * (filtered) positions, switched by `?lens=`. It's URL state, not a route. The IA decision on
 * #3689: a lens is a view of one list.
 *  - List: the table (the landing).
 *  - Map: a treemap of where the capital sits. Tile size is money, tile colour is return (red or
 *    green by sign, with the sign in the text too). The options get their own strip, scaled up so
 *    they're readable, and the legend says by how much. The decision engine's cards stack in a
 *    column beside it, "Worth a look", each wearing its row's fact badge (◆ Review · …, ▲ Consider
 *    · …) where the retired verdicts "Needs a decision" / "At risk" stood (#5083), and its lesson.
 *  - Runway: a 90-day expiry timeline. Each option is a bar to its expiry, with its last three
 *    weeks hatched (when time decay speeds up).
 */

export type Lens = "list" | "map" | "runway";
const LENSES: ReadonlyArray<{ id: Lens; label: string }> = [
  { id: "list", label: "List" },
  { id: "map", label: "Map" },
  { id: "runway", label: "Runway" },
];

export const parseLens = (raw: unknown): Lens | undefined =>
  raw === "map" || raw === "runway" || raw === "list" ? raw : undefined;

/** The lens in the URL, and a setter that replaces it (list, the default, leaves the URL clean)
 *  without moving the page: a lens is a view of the list you're already scrolled to (#4944). */
export function useLens(): readonly [Lens, (next: Lens) => void] {
  const search = useSearch({ strict: false }) as { lens?: unknown };
  const refine = useRefineSearch();
  const lens = parseLens(search.lens) ?? "list";
  const set = (next: Lens) =>
    refine((prev) => ({ ...prev, lens: next === "list" ? undefined : next }));
  return [lens, set] as const;
}

export function LensSwitch({
  lens,
  onChange,
}: {
  readonly lens: Lens;
  readonly onChange: (next: Lens) => void;
}): ReactElement {
  return (
    <fieldset className="lens-switch">
      <legend className="visually-hidden">View positions as</legend>
      {LENSES.map((l) => (
        <button
          key={l.id}
          type="button"
          aria-pressed={l.id === lens}
          onClick={() => onChange(l.id)}
        >
          {l.label}
        </button>
      ))}
    </fieldset>
  );
}

/** "+5.17%" → 5.17; anything unreadable → 0 (a neutral tile, never a made-up direction). */
const returnOf = (p: DeskPosition): number => {
  const n = Number(p.returnPct.replace(/[^0-9.+-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

/** The design's tint: stronger with a bigger move, capped so a tile never shouts. Options move
 *  faster than shares, so their scale is flatter. */
function tint(ret: number, option: boolean): CSSProperties {
  const n = Math.min(option ? Math.abs(ret) : Math.abs(ret) * 7, 40) + 8;
  const hue = ret > 0 ? "var(--pos)" : ret < 0 ? "var(--neg)" : "var(--muted)";
  return {
    background: `color-mix(in srgb, ${hue} ${n}%, var(--surface))`,
    borderColor: `color-mix(in srgb, ${hue} ${n + 14}%, var(--surface))`,
  };
}

type MapItem =
  | { readonly kind: "cash"; readonly weight: number }
  | { readonly kind: "position"; readonly weight: number; readonly p: DeskPosition };

const pct = (x: number) => `${x}%`;

/** The legend's line on the options strip. `optionsPct` counts held options only, so a book of
 *  sold ones read "Its true share of your account is 0.0%", as though nothing were owed (#4964).
 *  A liability is no share of the account: it is named, signed as the positions table shows it. */
function optionsNote(allocation: DeskAllocation): string {
  const held = allocation.optionsPct > 0;
  const sold = allocation.optionsSold;
  if (sold === undefined || held) {
    const share = `The options strip is scaled up so you can read it. ${
      sold === undefined ? "Its true share" : "Held options' share"
    } of your account is ${allocation.optionsPct.toFixed(1)}%.`;
    return sold === undefined ? share : `${share} Sold ones are owed: ${sold} to buy them back.`;
  }
  return `Sold options are owed, not held, so they take no share of your account: ${sold} to buy them back.`;
}

function PositionTile({
  p,
  style,
  small = false,
}: {
  readonly p: DeskPosition;
  readonly style: CSSProperties;
  /** Too small to hold its words: they drop out, and the tooltip carries them instead. */
  readonly small?: boolean;
}) {
  return (
    <a
      className={small ? "map-tile is-small" : "map-tile"}
      href={`#pos-${encodeURIComponent(p.symbol)}`}
      style={style}
      title={`${p.display} · ${p.value} · ${p.returnPct}`}
    >
      <span className="map-tile-name">{p.display}</span>
      <span className="map-tile-value num">{p.value}</span>
      <span className={`map-tile-ret num tone-${p.totalTone}`}>{p.returnPct}</span>
    </a>
  );
}

/** One decision card on the Map: its row's badge (a playbook idea says so in words), the figure,
 *  the name, the sentence, the lesson and the way on. */
function MapDecision({
  d,
  row,
}: {
  readonly d: Decision;
  readonly row: RowMark | undefined;
}): ReactElement {
  return (
    <article className={`map-decision decision--${d.kind}`}>
      <span className="map-decision-top">
        {d.kind === "idea" ? (
          <span className="decision-kind">Playbook idea</span>
        ) : row ? (
          <FactBadge row={row} />
        ) : (
          <span />
        )}
        <span className={`num tone-${d.plTone}`}>{d.pl}</span>
      </span>
      <span className="map-decision-sym">{d.display}</span>
      <span className="map-decision-title">{d.title}</span>
      <LessonTerm learn={d.learn} />
      <a className="decision-btn decision-btn--primary" href={d.primary.href}>
        {d.primary.label}
      </a>
    </article>
  );
}

export function MapLens({
  positions,
  allocation,
  decisions,
  marks,
}: {
  readonly positions: readonly DeskPosition[];
  readonly allocation: DeskAllocation;
  readonly decisions: readonly Decision[];
  /** Every row's fact badge, so a card reads as its row does. */
  readonly marks?: ReadonlyMap<string, RowMark>;
}): ReactElement {
  // Every weight is a share of the whole account (shares + options + cash = 100), from the server's
  // own percentages: a position's weightPct is of what's invested, so it scales by invested's share.
  const investedShare = allocation.sharesPct + allocation.optionsPct;
  const shareOfTotal = (p: DeskPosition) => (p.weightPct / 100) * investedShare;
  const shares = positions.filter((p) => !p.isOption);
  const options = positions.filter((p) => p.isOption);
  const items: MapItem[] = [
    ...(allocation.cashPct > 0 ? [{ kind: "cash" as const, weight: allocation.cashPct }] : []),
    ...shares.map((p) => ({ kind: "position" as const, weight: shareOfTotal(p), p })),
  ];
  const tiles = squarify(items, (i) => i.weight);
  const optionTotal = options.reduce((s, p) => s + shareOfTotal(p), 0);

  return (
    <div className="map-lens">
      <div className="map-main">
        <div className="map-tree" role="img" aria-label="Where the capital sits, sized by money">
          {tiles.map((t) => {
            const box: CSSProperties = {
              left: pct(t.x),
              top: pct(t.y),
              width: pct(t.w),
              height: pct(t.h),
            };
            return t.item.kind === "cash" ? (
              <div key="cash" className="map-tile map-tile--cash" style={box}>
                <span className="map-tile-name">Cash</span>
                <span className="map-tile-value num">{allocation.cash}</span>
                <span className="map-tile-ret">ready to use</span>
              </div>
            ) : (
              <PositionTile
                key={t.item.p.symbol}
                p={t.item.p}
                small={t.w < 12 || t.h < 12}
                style={{ ...box, ...tint(returnOf(t.item.p), false) }}
              />
            );
          })}
        </div>
        {options.length > 0 ? (
          <div className="map-options">
            {options.map((p) => (
              <PositionTile
                key={p.symbol}
                p={p}
                style={{
                  flexGrow: optionTotal > 0 ? shareOfTotal(p) / optionTotal : 1,
                  ...tint(returnOf(p), true),
                }}
              />
            ))}
          </div>
        ) : null}
        <div className="map-legend">
          <span className="map-legend-scale" aria-hidden="true" />
          <span className="map-legend-ends num">
            <span>−40%</span>
            <span>+40%</span>
          </span>
          {options.length > 0 ? (
            <span className="map-legend-note">{optionsNote(allocation)}</span>
          ) : null}
        </div>
      </div>
      {decisions.length > 0 ? (
        <aside className="map-decisions" aria-label="Worth a look">
          <span className="decisions-eyebrow">Worth a look</span>
          {decisions.map((d) => (
            <MapDecision key={d.id} d={d} row={marks?.get(d.symbol)} />
          ))}
        </aside>
      ) : null}
    </div>
  );
}

const RUNWAY_DAYS = 90;
const DECAY_WINDOW = 21;

export function RunwayLens({
  positions,
}: {
  readonly positions: readonly DeskPosition[];
}): ReactElement {
  const dated = positions
    .filter((p) => p.isOption && p.expiresInDays !== undefined)
    .sort((a, b) => (a.expiresInDays ?? 0) - (b.expiresInDays ?? 0));
  const undated = positions.length - dated.length;
  const at = (days: number) => `${(Math.min(days, RUNWAY_DAYS) / RUNWAY_DAYS) * 100}%`;
  return (
    <div className="runway">
      <div className="runway-axis num" aria-hidden="true">
        <span>today</span>
        <span style={{ left: at(30) }}>30 days</span>
        <span style={{ left: at(60) }}>60 days</span>
        <span style={{ left: "100%" }}>90 days</span>
      </div>
      {dated.length === 0 ? (
        <p className="note">Nothing expires in your book: shares don't have a runway.</p>
      ) : (
        <ul className="runway-rows">
          {dated.map((p) => {
            const days = p.expiresInDays ?? 0;
            const decayFrom = Math.max(0, days - DECAY_WINDOW);
            return (
              <li key={p.symbol} className="runway-row">
                <span className="runway-name">
                  {p.display}
                  <span className="runway-when">
                    {days === 0 ? "expires today" : `expires in ${p.expiresIn}`}
                    {days > RUNWAY_DAYS ? " →" : ""}
                  </span>
                </span>
                <span className="runway-track">
                  <span className="runway-bar" style={{ width: at(days) }} />
                  {days <= RUNWAY_DAYS ? (
                    <span
                      className="runway-decay"
                      style={{ left: at(decayFrom), width: `calc(${at(days)} - ${at(decayFrom)})` }}
                      title="The last three weeks, when time decay speeds up"
                    />
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <p className="runway-note">
        Hatched: the last three weeks before each expiry, when an option loses value fastest.
        {undated > 0
          ? ` ${undated} share position${undated === 1 ? "" : "s"} not shown: shares don't expire.`
          : ""}
      </p>
    </div>
  );
}
