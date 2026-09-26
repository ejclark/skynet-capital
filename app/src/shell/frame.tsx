import type { ReactElement, ReactNode } from "react";

/**
 * The page frame (#738; the IA decision, docs/IA.md §8, #3807 slice 2a, 2026-09-26): TWO
 * DIMENSIONS — the TOPBAR is the app-level navigation dimension and the STAGE is the page. The
 * left rail has left the frame. Its two jobs are re-homed, never deleted: a group's sub-nav becomes
 * its home page's section switch (a plain link row at the top of the stage until #3807's 2b–2d
 * fold it), and a view's controls are a row of its own stage — `controls`, rendered as
 * `.stage-controls` at the top of `<main>`, a horizontal row at every width, never a column.
 *
 * DIMENSIONAL PRECEDENCE (Eric, live review 2026-08-28; amended 2026-09-26, docs/IA.md §8.1): two
 * ordered dimensions and the content — the TOPBAR is the first (app-level navigation), the page's
 * own HEAD the second (its identity, its controls row or section switch, and, only where a date key
 * drives content, the calendar head), and the VIEW CONTENT the third. Higher dimensions steer
 * lower ones, never the reverse: content never reaches up to reconfigure the head, and the head
 * never adds app-level destinations — those belong to the topbar. Held as a hypothesis — its
 * falsifier is Eric reading the head as "a second topbar" on the live route by 2026-10-10, at
 * which point the calendar head leaves the head for the stage's first row and the section switch
 * alone stays.
 *
 * CONSTANT GEOMETRY (Eric, same review: "content shift greatly degrades user experience";
 * amended 2026-09-26): every non-Settings stage is FULL WIDTH, so the content never shifts left or
 * right as you navigate — by construction now, not by an empty column reserved on every view.
 * Settings keeps its list as a two-column layout INSIDE its own stage (`settings.css`), so the one
 * transition that shifts is the gear icon into an action page: this reverses the 2026-08-28
 * constant-geometry call for this transition only (#784's revisit clause, 2026-08-29: "we'll likely
 * revisit when we add more content and the design breaks down"). Falsifier: Eric reads a controls
 * row as a third band at 390, or content shifts between two non-Settings routes at 1280 (measure:
 * the stage's left edge and width identical on /accounts, /activity, /research, /trade, /u/:id) —
 * or names the Settings ↔ anything transition as a shift on the live route, at which point
 * Settings' list takes the same row shape as every other page. A control read as "plucked from the
 * tiles it controls" (#738's 2026-08-28 parked note) returns beside its tile, still on the stage.
 *
 * THREE WORDS FOR "A PAGE HAS SEVERAL THINGS ON IT" (#1740, the tabs wargame). A page that holds
 * more than one thing picks one of these, and the word decides the mechanism — there is no fourth
 * dimension, and no tab strip:
 *   - a KIND is a filter over ONE list — a query qualifier the bar accepts as text, mirrored by a
 *     toggle in the stage's controls row (`is:bot` on Activity). Several may be on at once. The
 *     date key is not a kind: it is root URL state (`?on=&span=`), and R&D's filter box still
 *     accepts `on:`/`lens:` and writes the root params — one model, two carriers.
 *   - a SECTION is a different SHAPE of data on the same page — the section switch
 *     (`section-switch.tsx`) in the page's controls row or head, exactly one current, URL-stateful
 *     via a `section` search param. Booked P&L beside a trade feed is a section; "bot trades" is not.
 *   - a SUB-VIEW is a full view of its own — a nested route plus a link row at the top of its
 *     parent's stage (`profile-rail.tsx`; the any-account page folded its row into its own head, `account-head.tsx`). A section that outgrows its page
 *     graduates here, the way `?tab=performance` became `/u/$id/pulse`
 *     (`src/server/legacy-redirects.ts`).
 * A section switch is the controls row's CONTROL role, never a new dimension: it drives the content
 * below it and adds no app-level destinations. Nothing is both a kind and a section — if a toggle
 * and a section switch would offer the same thing, one of them is noise and gets deleted.
 *
 * ONE COMPOSITION OF SECTIONS, NOT A FOURTH WORD (#3407, the Workbench pick, Eric 2026-09-22):
 *   - a BENCH is several SECTIONS that are one instrument's tools and feed each other (the chain
 *     presets the ticket, the ticket's symbol drives the chart), DOCKED TOGETHER at the bench width
 *     and FOLDED to ordinary exclusive sections below it. The section switch renders only when
 *     folded; docked, every pane is on the page and `?section=` names the pane to scroll to.
 *     This is not the "beside" split Eric rejected on 2026-09-06 ("the whole page just feels like
 *     a hot mess"): Activity's panes were unrelated shapes with no data flow; a bench's panes share
 *     one symbol. Held as a hypothesis — its falsifier is Eric reading the docked bench as a mess
 *     on the live route, at which point it folds at every width and the switch comes back.
 *
 * AN INSTRUMENT'S HEAD IS A ROW OF THE PAGE'S OWN IDENTITY (#3807 slice 2·1; the design panel and
 * the IA decision, docs/IA.md §8.1, 2026-09-26): an instrument's head (the calendar) is a row of
 * the page's own identity — the cockpit head on the Profile page; on R&D (#3807 slice 2a) the band
 * head that leads the stage, its month grid folded beneath it — rendered only where a date key
 * drives content; a dateless page shows no head, never an inert one. Its range is root URL state
 * (`?on=&span=`, `live/horizon-params.ts`), so the key means one thing on every page it joins.
 * Held as a hypothesis — its falsifier is Eric reading the head as a second topbar on the live
 * route by 2026-10-10, at which point the row leaves the head for the stage's first row.
 *
 * `docs/PATTERNS.md` keeps the ledger these words live in, one row per named pattern.
 * @category navigation
 */
export function PageFrame({
  controls,
  children,
}: {
  /** The page's controls row — its section switch, kinds or sub-nav links — at the top of the
   *  stage. A row, never a column; absent, the stage opens on its own content. */
  readonly controls?: ReactNode;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className="frame">
      <main id="main" className="stage">
        {controls ? (
          <nav className="stage-controls" aria-label="Section">
            {controls}
          </nav>
        ) : null}
        {children}
      </main>
    </div>
  );
}
