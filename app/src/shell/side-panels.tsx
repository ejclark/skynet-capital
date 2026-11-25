import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactElement, ReactNode } from "react";
import { type DeskPosition, type DeskSnapshot, fetchDesk, type Tone } from "../live/desk";
import { fetchFeedbackIndex } from "../live/feedback";
import { fetchJournal, type JournalIndex } from "../live/journal";
import { nextOpenLabel } from "../live/market-session";
import { fetchSettings } from "../live/settings";
import { JournalComposer } from "./journal-composer";
import { JournalNotes } from "./journal-notes";
import { MarketSession, useNow } from "./market-session";
import { NeedsYou, ScoreboardTile } from "./needs-you";
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

/** "14:32" in the viewer's own clock for an ISO read time; the raw text when it isn't a date. */
export function readTime(iso: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return iso;
  return at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** One row per held position across the member's own accounts, biggest weight first. */
export function heldRows(
  snapshots: readonly DeskSnapshot[],
): readonly { readonly position: DeskPosition; readonly account: string }[] {
  return snapshots
    .filter((s) => !s.desk.error)
    .flatMap((s) => s.desk.positions.map((position) => ({ position, account: s.desk.name })))
    .sort((a, b) => b.position.weightPct - a.position.weightPct);
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
  const read = desks.data.find((s) => !s.desk.error)?.generatedAt;
  return (
    <section className="dp-card dp-held" aria-labelledby="dp-held-title">
      <h2 id="dp-held-title" className="home-eyebrow">
        What you hold
      </h2>
      <ul className="dp-held-rows">
        {rows.map(({ position: p, account }) => (
          <li key={`${account}:${p.symbol}`}>
            <Link className="dp-held-row" to="/accounts">
              <span className="dp-held-name">
                <span className="dp-held-symbol">{p.display}</span>
                {p.plainName ? <span className="dp-held-sub">{p.plainName}</span> : null}
              </span>
              <span className="dp-held-fig num">
                <span>{p.price}</span>
                <span className={`dp-held-move tone-${p.dayTone}`}>
                  {TONE_SHAPE[p.dayTone] ? (
                    <span aria-hidden="true">{TONE_SHAPE[p.dayTone]} </span>
                  ) : null}
                  {p.dayPct}
                  <span className="visually-hidden"> today</span>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {read ? <p className="dp-source num">Paper broker's prices · read {readTime(read)}</p> : null}
    </section>
  );
}

/** The opened clock and the next open: the top bar's folded clock steps aside while it stands. */
function PanelClock(): ReactElement {
  const now = useNow();
  return (
    <section className="dp-card dp-clock" aria-label="Market clock">
      <MarketSession now={now} />
      <p className="dp-clock-next">
        <span>Next open</span> <span className="num">{nextOpenLabel(now)}</span>
      </p>
    </section>
  );
}

const JOURNAL_OPENING: JournalIndex = {
  available: false,
  wishesEnabled: true,
  notes: [],
  reason: "Opening your notes…",
};
const JOURNAL_DOWN: JournalIndex = {
  ...JOURNAL_OPENING,
  reason: "Your notes are unreachable right now.",
};

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
      <JournalComposer
        wishesEnabled={Boolean(feedback.data?.enabled) && journal.wishesEnabled}
        notesAvailable={journal.available}
        notesReason={journal.reason}
      />
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

/** The frame's three columns at panels width; the page alone below it. */
export function SidePanels({
  page,
  children,
}: {
  readonly page: PanelsFor;
  readonly children: ReactNode;
}): ReactElement {
  const wide = usePanelsWidth();
  if (!wide) return <>{children}</>;
  return (
    <>
      <aside className="dp dp-left" aria-label="What you hold, what needs you and the market">
        <HeldNames />
        <NeedsYou />
        <PanelClock />
      </aside>
      {children}
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
    </>
  );
}
