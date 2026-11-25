/**
 * THE NAMED WIDTHS (#3816 slice 10; panels, #8297) — the only window widths a layout may break at, so
 * "phone" means one thing in CSS and in JS. The table and the one-line why for each live in
 * `docs/BRAND.md` → Widths; new styles start from the phone and widen at these edges only
 * (`docs/ENGINEERING.md` → House gotchas). CSS cannot read a custom property inside `@media`, so
 * the stylesheets write the numbers literally and these constants are the JS side of the same
 * table.
 *
 * - phone  ≤ 700  — content curates: grids fold to two or one column, secondary lines go.
 * - tablet ≤ 860  — the shell wraps: the topbar takes rows, rails and side-by-side panels stack.
 * - panels ≥ 1024 — a page that takes the desktop side panels (#8297) keeps the phone screen in
 *                    the middle and stands Needs you, the clock, the Journal and the Scoreboard
 *                    beside it; below it, ≤ 1023, the phone layouts are the layouts.
 * - bench  ≥ 1280 — `/trade`'s sections dock as one bench; everything below it is ≤ 1279.
 */
export const WIDTHS = { phone: 700, tablet: 860, panels: 1024, bench: 1280 } as const;

/** At or below the phone width — where content curates (the Profile head's switch folds to More). */
export const PHONE_QUERY = `(max-width: ${WIDTHS.phone}px)`;

/** At or below the tablet width — where the shell wraps, phones included. */
export const TABLET_QUERY = `(max-width: ${WIDTHS.tablet}px)`;

/** At or above the panels width — the side panels stand beside the phone screen (#8297). */
export const PANELS_QUERY = `(min-width: ${WIDTHS.panels}px)`;

/** At or above the bench width — `/trade` docks its sections side by side. */
export const BENCH_QUERY = `(min-width: ${WIDTHS.bench}px)`;
