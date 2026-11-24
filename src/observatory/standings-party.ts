import type { FieldTone } from "../universe/world-patch.js";
import type { DashboardData } from "./dashboard-data.js";
import type { ParticipantSnapshot } from "./participant-snapshot.js";
import { formatSigned, formatSignedPercent, plClass } from "./render-atoms.js";
import type { TextMap, ToneMap } from "./standings-patch.js";

/**
 * THE PARTY'S TABLE (#8253) — the members together against the house bot, as one server-built block.
 *
 * Shape 5 of #8161 made the Scoreboard's opening co-op: no member is ranked against another, and the
 * party plays one opponent, the house bot. Before this the table lived in the browser (Campaign's
 * Party window summed members' booked P/L itself and named the house bot by a client constant); now
 * the server builds it once, and both the snapshot (`standingsBoardView`) and the live patch
 * producer (`standingsFieldOps`) call this one helper — the way both call `cohortStats` — so a
 * figure can never mean one thing on load and another in the op that moves it.
 *
 * The rules it holds:
 *  - **Per account, never totals.** The party's figure is the AVERAGE 1M return of the seated
 *    accounts that have one, with the count it averages, so neither side wins on headcount or on
 *    account size (`standings-cohort.ts` states the same rule for the cohorts).
 *  - **A seat is earned by evidence.** `isSeated` is injected (like `flowsFor`): the server answers
 *    it from our own journal's first fill (`LadderEvidence.hasFill`), never from a claim.
 *  - **Open seats are a count, never names.** A member who has not traded is not named on a table
 *    they have not joined.
 *  - **An unknown is said, never zeroed.** A seat without a synced 1M return reads "—" and is left
 *    out of the average; a missing house bot shows no lead line.
 *  - **Hue never carries meaning alone.** The lead line is words, a signed figure and a glyph.
 */

/** The house bot's account id — the party's one opponent. Proper names are #6616's; copy says
 *  "the house bot". Moved here from the browser's `TOWER_KEY` so the server owns the role. */
export const HOUSE_BOT_ID = "sauron";

const isHouseBot = (p: ParticipantSnapshot): boolean =>
  p.kind === "bot" && p.id.toLowerCase() === HOUSE_BOT_ID;

/** One seated member's row. Rows sort A to Z: no bar, no ramp, no rank. */
export interface PartySeat {
  readonly key: string;
  readonly name: string;
  /** The 1M return, signed — "—" until the month sync writes one. */
  readonly monthReturn: string;
  readonly monthReturnTone: FieldTone;
  /** "not synced yet" beside a "—"; absent once a return is known. */
  readonly monthReturnNote?: string;
  /** Booked (realized) P/L — "—" when the snapshot carries none, never a zero. */
  readonly booked: string;
  readonly bookedTone: FieldTone;
}

/** Who leads, in words, with a signed figure and a glyph. Absent when either side is unknown. */
export interface PartyLead {
  readonly side: "party" | "house" | "level";
  /** "The party leads the house bot by 1.20 points". */
  readonly line: string;
  /** ▲ party ahead · ▼ house bot ahead · = level. */
  readonly glyph: string;
  /** The party's average minus the house bot's, signed, in points: "+1.20 pts". */
  readonly figure: string;
  readonly tone: FieldTone;
}

export interface PartyView {
  /** Seated members, A to Z. */
  readonly seats: readonly PartySeat[];
  /** The party's average 1M return — "—" when no seat has one yet. */
  readonly partyReturn: string;
  readonly partyReturnTone: FieldTone;
  /** How many seated accounts the average covers, in words. */
  readonly partyCount: string;
  /** The house bot's own 1M return — "—" when unknown. */
  readonly houseReturn: string;
  readonly houseReturnTone: FieldTone;
  /** Said when the house bot's figure is missing, so the gap is never silent. */
  readonly houseNote?: string;
  readonly openSeats: number;
  /** "2 seats open" / "No seat open" — a count, never names. */
  readonly openLine: string;
  readonly lead?: PartyLead;
  /** Why there is no lead line, when there is none. */
  readonly leadNote?: string;
  /** Where the numbers come from. */
  readonly footnote: string;
}

const FOOTNOTE =
  "Paper results. The 1M return is Alpaca's own, net of deposits; booked P/L is what was closed out.";

const plural = (n: number, one: string, many: string): string =>
  `${String(n)} ${n === 1 ? one : many}`;

function seatRow(p: ParticipantSnapshot): PartySeat {
  const r = p.monthReturnPct;
  return {
    key: p.id,
    name: p.displayName,
    monthReturn: r === undefined ? "—" : formatSignedPercent(r),
    monthReturnTone: r === undefined ? "flat" : plClass(r),
    ...(r === undefined ? { monthReturnNote: "not synced yet" } : {}),
    booked: p.realizedPl === undefined ? "—" : formatSigned(p.realizedPl),
    bookedTone: plClass(p.realizedPl ?? 0),
  };
}

/** Points between two percents, rounded to the figure shown so "level" and "+0.00" never disagree. */
function leadOf(party: number, house: number): PartyLead {
  const gap = Math.round((party - house) * 100) / 100;
  const pts = `${Math.abs(gap).toFixed(2)} ${Math.abs(gap) === 1 ? "point" : "points"}`;
  if (gap === 0) {
    return {
      side: "level",
      line: "The party and the house bot are level",
      glyph: "=",
      figure: "±0.00 pts",
      tone: "flat",
    };
  }
  const partyAhead = gap > 0;
  return {
    side: partyAhead ? "party" : "house",
    line: partyAhead
      ? `The party leads the house bot by ${pts}`
      : `The house bot leads the party by ${pts}`,
    glyph: partyAhead ? "▲" : "▼",
    figure: `${partyAhead ? "+" : "−"}${Math.abs(gap).toFixed(2)} pts`,
    tone: partyAhead ? "pos" : "neg",
  };
}

/**
 * The party's table from one dashboard state. Pure: `isSeated` is the only outside read, and it is
 * the server's journal answer. Without it nobody is seated — no evidence, no seat.
 *
 * A seated account whose read failed this tick (`error`) leaves the table until it reads again; the
 * Field drops it the same way (`rowViews`), so the two never disagree on one page.
 */
export function partyView(
  data: DashboardData,
  isSeated: (participantId: string) => boolean = () => false,
): PartyView {
  const humans = data.participants.filter((p) => p.kind === "human");
  const seated = humans
    .filter((p) => !p.error && isSeated(p.id))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
  const openSeats = humans.filter((p) => !isSeated(p.id)).length;

  const synced = seated.flatMap((p) => (p.monthReturnPct === undefined ? [] : [p.monthReturnPct]));
  const partyAvg = synced.length ? synced.reduce((s, r) => s + r, 0) / synced.length : undefined;
  const unsynced = seated.length - synced.length;
  const partyCount =
    seated.length === 0
      ? "No seat taken yet"
      : `Average of ${plural(synced.length, "seated account", "seated accounts")}${
          unsynced > 0 ? ` · ${String(unsynced)} not synced yet` : ""
        }`;

  const house = data.participants.find(isHouseBot);
  const houseRead = house && !house.error ? house.monthReturnPct : undefined;
  const houseNote = !house
    ? "The house bot isn't on the board right now"
    : house.error
      ? "The house bot's account didn't read this time"
      : houseRead === undefined
        ? "not synced yet"
        : undefined;

  const lead =
    partyAvg !== undefined && houseRead !== undefined ? leadOf(partyAvg, houseRead) : undefined;
  const leadNote = lead
    ? undefined
    : !house || house.error
      ? houseNote
      : houseRead === undefined
        ? "No lead to call until the house bot's 1M return syncs"
        : "No lead to call until a seated account's 1M return syncs";

  return {
    seats: seated.map(seatRow),
    partyReturn: partyAvg === undefined ? "—" : formatSignedPercent(partyAvg),
    partyReturnTone: partyAvg === undefined ? "flat" : plClass(partyAvg),
    partyCount,
    houseReturn: houseRead === undefined ? "—" : formatSignedPercent(houseRead),
    houseReturnTone: houseRead === undefined ? "flat" : plClass(houseRead),
    ...(houseNote ? { houseNote } : {}),
    openSeats,
    openLine: openSeats === 0 ? "No seat open" : `${plural(openSeats, "seat", "seats")} open`,
    ...(lead ? { lead } : {}),
    ...(leadNote ? { leadNote } : {}),
    footnote: FOOTNOTE,
  };
}

/** The seat keys in order — when they differ between two states, the table's structure moved. */
export const seatKeys = (view: PartyView): string => view.seats.map((s) => s.key).join("\n");

/**
 * The table flattened to one keyed `field` op's text and tone maps (key `party`). A seat's figures
 * ride as `seat:<id>:return` / `seat:<id>:booked`, so a client applies the op to the row it already
 * drew. Who sits at the table is structure, not a figure: when it changes, the producer reframes.
 */
export function partyFields(view: PartyView): { text: TextMap; tone: ToneMap } {
  const text: TextMap = {
    partyReturn: view.partyReturn,
    partyCount: view.partyCount,
    houseReturn: view.houseReturn,
    houseNote: view.houseNote ?? "",
    openLine: view.openLine,
    lead: view.lead?.line ?? "",
    leadGlyph: view.lead?.glyph ?? "",
    leadFigure: view.lead?.figure ?? "",
    leadNote: view.leadNote ?? "",
  };
  const tone: ToneMap = {
    partyReturn: view.partyReturnTone,
    houseReturn: view.houseReturnTone,
    lead: view.lead?.tone ?? "flat",
  };
  for (const s of view.seats) {
    text[`seat:${s.key}:return`] = s.monthReturn;
    text[`seat:${s.key}:returnNote`] = s.monthReturnNote ?? "";
    text[`seat:${s.key}:booked`] = s.booked;
    tone[`seat:${s.key}:return`] = s.monthReturnTone;
    tone[`seat:${s.key}:booked`] = s.bookedTone;
  }
  return { text, tone };
}
