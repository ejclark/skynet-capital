import { Link } from "@tanstack/react-router";
import { type ReactElement, type ReactNode, useEffect, useRef } from "react";
import {
  type BotPlaybooks,
  CARD_WORDS,
  type CountedState,
  cardFact,
  type PlaybookCard,
  plainReason,
} from "../live/bot-playbooks";
import { laneFor, laneSummary, tradesFor } from "../live/check-week";
import {
  type CheckWeek,
  type PlaybookHeartbeat,
  type RollCallLine,
  sinceText,
  UNMANAGED_WORDS,
} from "../live/heartbeat";
import { landingCard, type PlaybookLanding } from "../live/playbook-landing";
import { land } from "./landing";
import { PlaybookOpen, WhenOpened } from "./playbook-open";
import { LaneKey, LaneTrades, WeekLaneRow } from "./week-lanes";

/**
 * THE PLAYBOOK CARDS (#5073) — one per playbook, under the bot's checks strip
 * (`bot-playbooks.tsx`). Progressive reveal, per Eric's 0e71d5f8 ("too many icons"): a closed card
 * shows its name, its one state (a glyph and a word) and one fact; it opens in place to its mode,
 * how long it has held that state, the whole reason, and the one way to change it. Changing or
 * pausing stays on R&D → Playbooks (#4642: "configure on R&D → Playbooks; observe on Activity +
 * Heartbeat") — there is no per-playbook address there yet, so every link lands on this bot's
 * playbooks in the Store.
 *
 * Each card carries its lane (#5073 slice 2): its answers across the week on the strip's own clock,
 * with ▲/▼ where it traded, the key to the shapes and the trades in words once opened. Opened, a
 * named card also draws its rule as a picture, what the bot holds in its ticker and whose say-so it
 * runs on (#5073 slice 3, `playbook-open.tsx`), read only once the card is first opened.
 *
 * An order's playbook link arrives on its card (#5073 slice 4a — round 2's R2-act): that card opens
 * in place and lands like any linked row (`landing.ts`), the order's mark is ringed on its lane, and
 * the opened card carries one way back to the order's row on Activity. An order older than this
 * week has no mark to ring, and the card says so rather than ringing a neighbour.
 */

function changeHref(deskId: string): string {
  return `/app/research?section=playbooks&account=${encodeURIComponent(deskId)}`;
}

/** "● 1 trading on live signals · ◷ 4 waiting for a window · ⊘ 2 can't fire" — counted from the
 *  cards' own words, in the order the cards follow. */
export function CountedLine({
  counts,
}: {
  readonly counts: readonly CountedState[];
}): ReactElement | null {
  if (counts.length === 0) return null;
  return (
    <p className="pbb-count">
      {counts.map(({ state, count }) => (
        <span key={state} data-state={state}>
          <span aria-hidden="true">{CARD_WORDS[state].glyph}</span> {count}{" "}
          {CARD_WORDS[state].counted(count)}
        </span>
      ))}
    </p>
  );
}

/** Mode and how long it has held its state. "since" belongs to the verdict, so a card whose word
 *  came from the roll call instead (can't fire, paused) never borrows the verdict's clock. */
function metaOf(card: PlaybookCard, named: boolean): string {
  const since =
    card.verdict && card.verdict.state === card.state ? sinceText(card.verdict) : undefined;
  return [named ? card.mode : undefined, since].filter(Boolean).join(" · ");
}

/** A playbook's name, or on a bot the viewer does not own (#885) the mode it runs in. */
function titleOf(card: PlaybookCard, named: boolean): string {
  if (named && card.playbookId) return card.playbookId;
  const mode = card.mode ?? "unnamed";
  return `${mode.charAt(0).toUpperCase()}${mode.slice(1)} mode`;
}

function StateWord({ glyph, word }: { readonly glyph: string; readonly word: string }) {
  return (
    <span className="pbb-state">
      <span aria-hidden="true">{glyph}</span> <b>{word}</b>
    </span>
  );
}

/** One card: a `<details>` whose summary is the closed card, so it opens in place with the
 *  keyboard and a screen reader for free. A card with nothing more to say is a plain row. */
function Card({
  name,
  state,
  glyph,
  word,
  wide,
  fact,
  lane,
  arrived = false,
  children,
}: {
  readonly name: string;
  readonly state: string;
  readonly glyph: string;
  readonly word: string;
  /** Beside the state from the bench width up; on a phone it waits in the opened card. */
  readonly wide?: string;
  readonly fact?: string;
  /** The card's week, under its name on a phone and in the wide column from the bench width. */
  readonly lane?: ReactNode;
  /** The card an order's link named: it arrives open and lands. */
  readonly arrived?: boolean;
  readonly children?: ReactNode;
}): ReactElement {
  const row = useRef<HTMLLIElement>(null);
  useEffect(() => {
    const el = row.current;
    if (!(arrived && el)) return;
    return land(el);
  }, [arrived]);
  const head = (
    <>
      <span className="pbb-name">{name}</span>
      <span className="pbb-word">
        <StateWord glyph={glyph} word={word} />
        {wide ? <span className="pbb-meta pbb-wide"> · {wide}</span> : null}
      </span>
      {fact ? <span className="pbb-fact">{fact}</span> : null}
      {lane ? <span className="pbb-lane">{lane}</span> : null}
    </>
  );
  return (
    <li className="pbb-card" data-state={state} ref={row}>
      {children ? (
        // Opened from the first render when arrived at, so `WhenOpened` reads its blocks at once;
        // React leaves the attribute alone after that, and the reader's own toggles stand.
        <details open={arrived || undefined}>
          <summary className="pbb-row pbb-sum">
            {head}
            <span className="pbb-chev" aria-hidden="true">
              ›
            </span>
          </summary>
          <div className="pbb-open">{children}</div>
        </details>
      ) : (
        <div className="pbb-row">{head}</div>
      )}
    </li>
  );
}

/** The card's lane and the trades its playbook placed this week; nothing without a week. */
function weekOf(
  card: PlaybookCard,
  week: CheckWeek | undefined,
  playbooks: readonly PlaybookHeartbeat[] | null,
  ringAt: number | undefined,
) {
  if (!week) return undefined;
  const trades = tradesFor(card, week);
  const lane = laneFor(card, week, playbooks);
  // Ring only a mark this lane actually draws — never a neighbour's, never an empty spot.
  const ringed = ringAt !== undefined && trades.some((t) => t.at === ringAt) ? ringAt : undefined;
  return {
    trades,
    ringed,
    lane: (
      <WeekLaneRow
        week={week}
        lane={lane}
        trades={trades}
        state={card.state}
        label={`${laneSummary(lane, trades, card.state === "blocked")}${ringed ? " The order you came from is ringed." : ""}`}
        {...(ringed ? { ringAt: ringed } : {})}
      />
    ),
  };
}

/** The account's Activity with the order's row named — the card's one way back to it. */
function BackToOrder({ deskId, orderId }: { readonly deskId: string; readonly orderId: string }) {
  return (
    <Link
      className="door-link pbb-back"
      to="/accounts"
      search={{ account: deskId, section: "activity" }}
      hash={`act-${orderId}`}
    >
      ← Back to the order in Activity
    </Link>
  );
}

/** What an arrival says above the card's other blocks: the way back, and — when the order's check
 *  is not on this week's lane — why nothing is ringed. */
function Arrival({
  deskId,
  landing,
  ringed,
  hasWeek,
}: {
  readonly deskId: string;
  readonly landing: PlaybookLanding;
  readonly ringed: number | undefined;
  readonly hasWeek: boolean;
}): ReactElement {
  return (
    <div className="pbb-arrival">
      {landing.from ? <BackToOrder deskId={deskId} orderId={landing.from} /> : null}
      {landing.fill !== undefined && hasWeek && ringed === undefined ? (
        <p className="pbb-meta">
          That order was placed before this week, so its lane has no mark to ring.
        </p>
      ) : null}
    </div>
  );
}

function PlaybookRow({
  card,
  named,
  deskId,
  week,
  playbooks,
  arrival,
}: {
  readonly card: PlaybookCard;
  readonly named: boolean;
  readonly deskId: string;
  readonly week?: CheckWeek;
  readonly playbooks: readonly PlaybookHeartbeat[] | null;
  /** Set on the one card an order's link named. */
  readonly arrival?: PlaybookLanding;
}): ReactElement {
  const { glyph, word } = CARD_WORDS[card.state];
  const meta = metaOf(card, named);
  const fact = cardFact(card);
  const drawn = weekOf(card, week, playbooks, arrival?.fill);
  // A non-owner's card has no reason to read: its mode and since are the fact, and there is
  // nothing behind it to open.
  if (!named) {
    return (
      <Card
        name={titleOf(card, named)}
        state={card.state}
        glyph={glyph}
        word={word}
        {...(meta ? { fact: meta } : {})}
        {...(drawn ? { lane: drawn.lane } : {})}
      />
    );
  }
  return (
    <Card
      name={titleOf(card, named)}
      state={card.state}
      glyph={glyph}
      word={word}
      {...(meta ? { wide: meta } : {})}
      {...(fact.short ? { fact: fact.short } : {})}
      {...(drawn ? { lane: drawn.lane } : {})}
      arrived={arrival !== undefined}
    >
      {arrival ? (
        <Arrival
          deskId={deskId}
          landing={arrival}
          ringed={drawn?.ringed}
          hasWeek={drawn !== undefined}
        />
      ) : null}
      {drawn ? <LaneKey /> : null}
      {fact.more ? <p className="pbb-why">{fact.more}</p> : null}
      {meta ? <p className="pbb-meta pbb-narrow">{meta}</p> : null}
      {card.playbookId ? (
        <WhenOpened>
          <PlaybookOpen
            deskId={deskId}
            playbookId={card.playbookId}
            {...(card.mode ? { mode: card.mode } : {})}
          />
        </WhenOpened>
      ) : null}
      {drawn && drawn.trades.length > 0 ? (
        <section className="pbo-block" aria-label="Its trades this week">
          <h4 className="pbo-h">Its trades this week ({drawn.trades.length})</h4>
          <LaneTrades trades={drawn.trades} {...(drawn.ringed ? { ringAt: drawn.ringed } : {})} />
        </section>
      ) : null}
      <a className="hb-link pbo-change" href={changeHref(deskId)}>
        Change or pause it in R&amp;D ›
      </a>
    </Card>
  );
}

/** "BETA-SCOUT is off" · "A and B are off" · "A, B and C are off" — on this bot. */
function offSentence(off: readonly RollCallLine[]): string {
  const ids = off.map((l) => l.playbookId);
  const names =
    ids.length === 1 ? ids[0] : `${ids.slice(0, -1).join(", ")} and ${ids[ids.length - 1]}`;
  return `${names} ${ids.length === 1 ? "is" : "are"} off on this bot`;
}

/** The footer: every house playbook nobody switched on for this bot, named once, opening to why
 *  (some "off" lines say more than off — exits only, or a second option play on one ticker), and
 *  the way to change any of them. */
function OffFooter({
  off,
  deskId,
}: {
  readonly off: readonly RollCallLine[];
  readonly deskId: string;
}): ReactElement {
  return (
    <div className="pbb-foot">
      {off.length > 0 ? (
        <details className="pbb-off">
          <summary className="pbb-sum">
            <span aria-hidden="true">○</span> {offSentence(off)}{" "}
            <span className="pbb-chev" aria-hidden="true">
              ›
            </span>
          </summary>
          <ul>
            {off.map((line) => (
              <li key={line.playbookId}>
                <span className="num">{line.playbookId}</span> {plainReason(line.reason)}
              </li>
            ))}
          </ul>
        </details>
      ) : (
        <span />
      )}
      <a className="hb-link" href={changeHref(deskId)}>
        Change in R&amp;D ›
      </a>
    </div>
  );
}

/** An order's playbook with no card on this bot now: said plainly, beside the way back, rather
 *  than landing the reader on a card that is not the one that placed it. */
function NoCard({
  deskId,
  landing,
  off,
}: {
  readonly deskId: string;
  readonly landing: PlaybookLanding;
  readonly off: readonly RollCallLine[];
}): ReactElement {
  const isOff = off.some((l) => l.playbookId === landing.card);
  return (
    <div className="pbb-arrival pbb-nocard">
      <p>
        <span className="num">{landing.card}</span> placed that order.{" "}
        {isOff
          ? "It is off on this bot now — it is named in the footer below."
          : "It is not one of this bot's playbooks now, so it has no card here."}
      </p>
      {landing.from ? <BackToOrder deskId={deskId} orderId={landing.from} /> : null}
    </div>
  );
}

export function PlaybookCards({
  deskId,
  merged,
  named,
  unmanaged,
  none,
  week,
  playbooks = null,
  landing,
}: {
  readonly deskId: string;
  readonly merged: BotPlaybooks;
  readonly named: boolean;
  /** This week on the strip's clock — each card draws its lane from it. */
  readonly week?: CheckWeek;
  /** The heartbeat's verdict lines, which a nameless card's lane is matched through. */
  readonly playbooks?: readonly PlaybookHeartbeat[] | null;
  /** Held tickers nothing on this bot will sell (#4777) — after the playbooks, by ticker. */
  readonly unmanaged: readonly string[];
  /** No verdict and no roll call came at all — nothing has been recorded to draw. */
  readonly none: boolean;
  /** An order's playbook link — the owner's alone (#885), so never passed on a nameless page. */
  readonly landing?: PlaybookLanding;
}): ReactElement {
  if (none) return <p className="note">No playbook has answered a check yet.</p>;
  const empty = merged.cards.length === 0 && unmanaged.length === 0;
  const target = landing && named ? landingCard(merged.cards, landing) : undefined;
  return (
    <div className="pbb-cards">
      {landing && named && !target ? (
        <NoCard deskId={deskId} landing={landing} off={merged.off} />
      ) : null}
      {named ? null : (
        <p className="pbb-private">
          Which playbooks these are is the bot owner's to see — each reads here by its state.
        </p>
      )}
      {empty ? (
        <p className="pbb-private">None of this bot's playbooks is on.</p>
      ) : (
        <ul>
          {merged.cards.map((card) => (
            <PlaybookRow
              key={card.key}
              card={card}
              named={named}
              deskId={deskId}
              playbooks={playbooks}
              {...(week ? { week } : {})}
              {...(landing && card === target ? { arrival: landing } : {})}
            />
          ))}
          {unmanaged.map((symbol) => (
            <Card
              key={`unmanaged:${symbol}`}
              // "shares", so a ticker never reads as one more playbook id in this list.
              name={`${symbol} shares`}
              state="unmanaged"
              glyph={UNMANAGED_WORDS.glyph}
              word={UNMANAGED_WORDS.word}
              fact={UNMANAGED_WORDS.fact}
            >
              <p className="pbb-why">{UNMANAGED_WORDS.reason}</p>
            </Card>
          ))}
        </ul>
      )}
      {named ? <OffFooter off={merged.off} deskId={deskId} /> : null}
    </div>
  );
}
