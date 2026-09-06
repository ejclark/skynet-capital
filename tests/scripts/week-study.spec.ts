import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rangeOfIsoWeek } from "../../src/research/week-study.js";
import { collectEntries } from "../../src/scripts/week-study.js";

/**
 * The weekly study's calendar↔shelf join (#1716). `tests/research/week-study.spec.ts` covers the
 * pure composer — that a quoted cell survives intact and an absence is stated rather than filled
 * in. This file covers the half that reads the world: WHICH events end up on the board.
 *
 * The three ways an event can fail to reach the board are all here, because each one is a
 * different bug if it breaks: dated outside the week (the range filter), no ledger on the shelf
 * (the join), and a ledger whose table authored no `This week` row (the row lookup, which must
 * yield a null row rather than borrowing another horizon).
 *
 * The fixture names REAL calendar ids — `collectEntries` walks `everyEvent()` for dates and takes
 * only the markdown from the fixture directory, so an invented id would simply never be looked up
 * and the spec would pass on nothing.
 */

const WEEK = rangeOfIsoWeek("2026-W37"); // 2026-09-07 … 2026-09-13

/** In-week (2026-09-09), carries a symbol — the row a name's call sheet is built from. */
const IN_WEEK_WITH_ROW = "aapl-iphone-18-launch-2026-09-09";
/** In-week (2026-09-09), but its ledger authors no `This week` row. */
const IN_WEEK_NO_ROW = "treasury-10y-note-2026-09-09";
/** Dated 2026-09-04 — the Friday BEFORE the week opens. */
const OUT_OF_WEEK = "jobs-2026-09-04";
/** In-week (2026-09-10) and deliberately given no file — an event nobody has researched. */
const IN_WEEK_NO_LEDGER = "ecb-decision-2026-09-10";

const ledger = (rows: string): string => `# A fixture ledger

## At a glance

| Horizon | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
${rows}

## Method

Fixture.
`;

const WEEK_ROW =
  "| This week | Buy the **launch** drift | Medium | **supply** checks read clean | a sub-1M first-weekend preorder by 2026-09-14 |";
const TODAY_ROW = "| Today | Stand aside | High | nothing has moved | a 2% gap by 2026-09-09 |";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "week-study-"));
  writeFileSync(join(dir, `${IN_WEEK_WITH_ROW}.md`), ledger(`${TODAY_ROW}\n${WEEK_ROW}`));
  writeFileSync(join(dir, `${IN_WEEK_NO_ROW}.md`), ledger(TODAY_ROW));
  writeFileSync(join(dir, `${OUT_OF_WEEK}.md`), ledger(`${TODAY_ROW}\n${WEEK_ROW}`));
});

afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("collectEntries — which events reach the week's board", () => {
  it("takes the in-week ledgers and leaves out the one dated before the week opens", () => {
    const ids = collectEntries(WEEK, dir).map((e) => e.id);
    expect(ids).toContain(IN_WEEK_WITH_ROW);
    expect(ids).toContain(IN_WEEK_NO_ROW);
    expect(ids).not.toContain(OUT_OF_WEEK);
  });

  it("skips an in-week event with no ledger on the shelf rather than inventing a blank row", () => {
    expect(collectEntries(WEEK, dir).map((e) => e.id)).not.toContain(IN_WEEK_NO_LEDGER);
  });

  it("returns the entries in date order — the board reads as the week is traded", () => {
    const dates = collectEntries(WEEK, dir).map((e) => e.date);
    expect([...dates].sort()).toEqual(dates);
  });

  it("quotes the ledger's `This week` row cell for cell", () => {
    const entry = collectEntries(WEEK, dir).find((e) => e.id === IN_WEEK_WITH_ROW);
    expect(entry?.row).toEqual({
      // The call is the one cell rendered as a chip, so the parser strips its emphasis; the cells
      // a citing document QUOTES keep whatever markup their author chose.
      call: "Buy the launch drift",
      horizon: "This week",
      confidence: "Medium",
      why: "**supply** checks read clean",
      provesWrong: "a sub-1M first-weekend preorder by 2026-09-14",
    });
  });

  it("carries the calendar's own symbols through, so a name's row finds its event", () => {
    const entry = collectEntries(WEEK, dir).find((e) => e.id === IN_WEEK_WITH_ROW);
    expect(entry?.symbols).toContain("AAPL");
  });

  it("reads a null row — never a borrowed horizon — when no `This week` row was authored", () => {
    const entry = collectEntries(WEEK, dir).find((e) => e.id === IN_WEEK_NO_ROW);
    expect(entry).toBeDefined();
    expect(entry?.row).toBeNull();
  });

  it("finds nothing in a week the calendar has no events for — the thin-week input", () => {
    // The composer's floor is three in-range ledgers; a week this empty is what it refuses on.
    expect(collectEntries(rangeOfIsoWeek("2030-W02"), dir)).toHaveLength(0);
  });

  it("does not run the CLI when imported — the entrypoint guard holds", () => {
    // Importing this module used to `process.exit()` on load. If that regresses, no assertion in
    // this file ever runs; reaching here at all is the proof.
    expect(typeof collectEntries).toBe("function");
  });
});
