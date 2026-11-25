import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactElement, ReactNode } from "react";
import { type DeskPosition, type DeskSnapshot, fetchDesk, type Tone } from "../live/desk";
import { fetchFeedbackIndex } from "../live/feedback";
import { fetchJournal } from "../live/journal";
import {
  localTimeSuffix,
  marketSession,
  nextOpenInstant,
  nextOpenLabel,
  viewerTimeZone,
} from "../live/market-session";
import { fetchSettings } from "../live/settings";
import { FleetHealth, useFleet } from "./fleet-health";
import { JournalComposer } from "./journal-composer";
import { JournalNotes } from "./journal-notes";
import { JOURNAL_DOWN, JOURNAL_OPENING } from "./journal-section";
import { MarketSession, useNow } from "./market-session";
import { NeedsYou, ScoreboardTile } from "./needs-you";
import { HoursNotes } from "./session-status";
import { useMediaQuery } from "./use-media";
import { PANELS_QUERY } from "./widths";

/**
 * THE DESKTOP SIDE PANELS (#8297, #8161 stage 2; shape A of the three desktop storyboards, with
 * B's graft). From 1024px (`widths.ts` → panels) a page that takes panels keeps its phone screen
 * in the middle and stands the member's standing context on both sides:
 *
 *   - LEFT: your held names with today's move (only when you hold positions; B's graft, so they
 *     head the panel) · Needs you · the market clock.
 *   - RIGHT: the Journal (the composer and your last note) · the Scoreboard card.
 *
 * EACH STANDING ITEM ONCE PER SCREEN. The panels render only at panels width, and the page they
 * stand beside drops its own copy there (the home's Needs you and Scoreboard tile; the top bar's
 * folded clock, `side-panels.css`). An app open in the middle folds its own card to one line: on
 * the Scoreboard the right panel says "Scoreboard · open in the middle", so the party against the
 * house bot shows once.
 *
 * NO NEW DATA. Every read rides a key the app already reads, byte for byte: `["settings"]`,
 * `["desks", ids]` (Profile's All-accounts read, shared with Needs you), `["feedback"]` and
 * `["journal"]` (Profile's Journal section), the party read inside the Scoreboard card. Below
 * 1024 nothing here renders: the phone layouts are the layouts.
 *
 * What the storyboard has that this does not: the week's 15 campaign names. The app reads no such
 * list today (the server holds it for its paper checks only), and this slice adds no data; it
 * lands with the Game Master app, which is where the names are talked about. Steps 2 and 3 of the
 * storyboard (the opening scene, lineup set) wait for that app too: the scene is still a thread in
 * Moneypenny's dock, not a page the panels can stand beside.
 */

/** Which page the panels stand beside: an app open in the middle folds its own card. */
export type PanelsFor = "home" | "scoreboard";

/** True from the panels width (1024). The home reads it to drop its own Needs you and tile. */
export function usePanelsWidth(): boolean {
  return useMediaQuery(PANELS_QUERY);
}

/** The shape a move wears beside its sign, so a standing red/green-colourblind reader never reads
 *  a move from hue (docs/BRAND.md → Accessibility). Flat or unpriced wears none. */
export const TONE_SHAPE: Readonly<Record<Tone, string>> = { pos: "▲", neg: "▼", flat: "" };

/** The tone a shown figure's own sign gives it: "+1.20%" up, "-0.40%" down, "+0.00%" or "—"
 *  (no move to show) flat. A row's arrow and hue read from THIS, never from a sibling number
 *  (#8500): a short's `dayPct` is "—" while its `dayTone` follows today's dollar P/L, and the old
 *  row wore ▲ beside "—", a shape implying a move the figure does not show. */
export function figureTone(figure: string): Tone {
  const n = Number.parseFloat(figure.replace("−", "-").replace(/[^\d.+-]/g, ""));
  if (!Number.isFinite(n) || n === 0) return "flat";
  return n > 0 ? "pos" : "neg";
}

/** "14:32" in the viewer's own clock for an ISO read time; the raw text when it isn't a date. */
export function readTime(iso: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return iso;
  return at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** One row per held position, account by account in the member's own order, each account's
 *  biggest weight first. A weight is a share of its own account, so it never ranks across two. An
 *  error-tagged account is skipped: its `positions: []` is a failed read, never "holds nothing". */
export function heldRows(snapshots: readonly DeskSnapshot[]): readonly {
  readonly position: DeskPosition;
  readonly accountId: string;
}[] {
  return snapshots
    .filter((s) => !s.desk.error)
    .flatMap((s) =>
      [...s.desk.positions]
        .sort((a, b) => b.weightPct - a.weightPct)
        .map((position) => ({ position, accountId: s.desk.id })),
    );
}

/** The oldest read among the accounts listed: the one time that is true of every row. */
export function oldestRead(snapshots: readonly DeskSnapshot[]): string | undefined {
  return snapshots
    .filter((s) => !s.desk.error)
    .map((s) => s.generatedAt)
    .sort((a, b) => Date.parse(a) - Date.parse(b))[0];
}

function HeldNames(): ReactElement | null {
  const settings = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const ids = (settings.data?.accounts ?? []).map((a) => a.id);
  const desks = useQuery({
    queryKey: ["desks", ids.join(",")],
    // The Profile page's All-accounts read, byte for byte, so the three share one cache entry.
    queryFn: () => Promise.all(ids.map((id) => fetchDesk(id))),
    enabled: ids.length > 0,
  });
  // A failed or pending read says nothing here: Needs you, just below, says the read failed in
  // words (`readGaps`), and an empty list is never shown as "you hold nothing".
  if (!desks.data) return null;
  const rows = heldRows(desks.data);
  if (rows.length === 0) return null;
  const read = oldestRead(desks.data);
  return (
    <section className="dp-card dp-held" aria-labelledby="dp-held-title">
      <h2 id="dp-held-title" className="home-eyebrow">
        What you hold
      </h2>
      <ul className="dp-held-rows">
        {rows.map(({ position: p, accountId }) => {
          const tone = figureTone(p.dayPct);
          return (
            <li key={`${accountId}:${p.symbol}`}>
              <Link className="dp-held-row" to="/accounts">
                <span className="dp-held-name">
                  <span className="dp-held-symbol">{p.display}</span>
                  {p.plainName ? <span className="dp-held-sub">{p.plainName}</span> : null}
                </span>
                <span className="dp-held-fig num">
                  <span>{p.price}</span>
                  <span className={`dp-held-move tone-${tone}`}>
                    {TONE_SHAPE[tone] ? <span aria-hidden="true">{TONE_SHAPE[tone]} </span> : null}
                    {p.dayPct}
                    <span className="visually-hidden"> today</span>
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {read ? <p className="dp-source num">Paper broker's prices · read {readTime(read)}</p> : null}
    </section>
  );
}

/** Everything the top bar's opened status panel says, standing: the clock, the next open (in
 *  the viewer's own time too), the hours notes (a half day, or hours from the published table when
 *  the broker's calendar didn't answer) and fleet health. The bar's line steps aside while it
 *  stands (`side-panels.css`), so nothing the line opened is lost at this width. */
function PanelClock(): ReactElement {
  const now = useNow();
  const fleet = useFleet();
  const local = localTimeSuffix(nextOpenInstant(now), viewerTimeZone());
  return (
    <section className="dp-card dp-clock" aria-label="Market clock and fleet health">
      <MarketSession now={now} />
      <p className="status-panel-row">
        <span>Next open</span>
        <span className="num">
          <span>{nextOpenLabel(now)}</span>
          {local ? <span className="status-panel-local">{local}</span> : null}
        </span>
      </p>
      <HoursNotes view={marketSession(now)} />
      <FleetHealth fleet={fleet} />
    </section>
  );
}

/** The Journal's composer and your last note — the Profile section's own reads and parts. */
function JournalCard(): ReactElement {
  const feedback = useQuery({ queryKey: ["feedback"], queryFn: fetchFeedbackIndex });
  const read = useQuery({ queryKey: ["journal"], queryFn: fetchJournal });
  const journal = read.data ?? (read.isError ? JOURNAL_DOWN : JOURNAL_OPENING);
  return (
    <section className="dp-card dp-journal" aria-labelledby="dp-journal-title">
      <h2 id="dp-journal-title" className="home-eyebrow">
        Journal
      </h2>
      {/* As Profile's section does: the composer waits for the filings read, so a pending or
          failed read is never shown as "filing is switched off" (#8316's rule). */}
      {feedback.data ? (
        <JournalComposer
          keepDraftAs="side-panel"
          wishesEnabled={feedback.data.enabled && journal.wishesEnabled}
          notesAvailable={journal.available}
          notesReason={journal.reason}
        />
      ) : (
        <p className="note">
          {feedback.isError ? "Your journal is unreachable right now." : "Opening your journal…"}
        </p>
      )}
      <JournalNotes
        notes={journal.notes.slice(0, 1)}
        available={journal.available}
        reason={journal.reason}
      />
      <Link className="dp-more" to="/accounts" search={{ section: "feedback" }}>
        Every note and wish ›
      </Link>
    </section>
  );
}

/** The Scoreboard while it is open in the middle: one line, so the party shows once. */
function ScoreboardFolded(): ReactElement {
  return (
    <p className="dp-card dp-folded">
      <span aria-hidden="true">◆ </span>Scoreboard · open in the middle
    </p>
  );
}

/** The frame's three columns at panels width; the page alone below it.
 *
 *  ONE SHAPE AT EVERY WIDTH (#8500). The stage holds the same slot whether the panels stand or
 *  not: each panel's slot is `null` below 1024, never dropped. Two differently-shaped fragments
 *  (`<>{stage}</>` against `<><aside/>{stage}<aside/></>`) put the stage at a different index, so
 *  React unmounted `<main>` on every crossing and the page under it lost its state. */
export function SidePanels({
  page,
  children,
}: {
  readonly page: PanelsFor;
  readonly children: ReactNode;
}): ReactElement {
  const wide = usePanelsWidth();
  return (
    <>
      {wide ? (
        <aside className="dp dp-left" aria-label="What you hold, what needs you and the market">
          <HeldNames />
          <NeedsYou />
          <PanelClock />
        </aside>
      ) : null}
      {children}
      {wide ? (
        <aside className="dp dp-right" aria-label="Journal and Scoreboard">
          <JournalCard />
          {page === "scoreboard" ? (
            <ScoreboardFolded />
          ) : (
            <ul className="dp-scoreboard">
              <ScoreboardTile />
            </ul>
          )}
        </aside>
      ) : null}
    </>
  );
}
