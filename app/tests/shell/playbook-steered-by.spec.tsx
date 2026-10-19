import { render, screen } from "@testing-library/react";
import type { SteeredByView } from "../../src/live/playbook-store";
import { SteeredBy } from "../../src/shell/playbook-steered-by";

/**
 * "Steered by" on a pair row (#5482 slice 5, criterion 7). WHEN a conviction steers a pair, its row
 * SHALL read "steered by: <view> · check <day> · <pass> / <fail> / <pending>" and, one tap under it,
 * each claim with its outcome as a glyph AND a word and the day it is scored. Hue carries nothing;
 * the row sizes nothing and says the playbook still picks the timing.
 */

const VIEW: SteeredByView = {
  convictionId: "ai-dip-2026-10",
  title: "AI-dip view",
  owner: "Eric",
  checkOn: "2027-01-29",
  scorecard: { pass: 3, fail: 1, pending: 3, untestable: 1 },
  claims: [
    {
      label: "7",
      statement: "The floor: more pullback first.",
      outcome: "pass",
      dueOn: "2027-01-20",
      scoredOn: "2027-01-21",
      basis: "CRWV's lowest close was $52.00, inside $41.00 to $60.90.",
      backsThisPair: true,
    },
    {
      label: "8",
      statement: "Back above today's price in 3 to 6 months.",
      outcome: "fail",
      dueOn: "2027-02-02",
      scoredOn: "2027-02-03",
      basis: "No CRWV close reached $63.15.",
      backsThisPair: false,
    },
    {
      label: "9",
      statement: "Print moves run larger than priced.",
      outcome: "pending",
      dueOn: "2026-11-17",
      basis: "Not due: scored on 2026-11-17.",
      backsThisPair: false,
    },
    {
      label: "6",
      statement: "In the long run, AI adopters win.",
      outcome: "untestable",
      basis: "Nothing here can check it. Size zero.",
      backsThisPair: false,
    },
  ],
};

describe("SteeredBy", () => {
  it("reads as one line a phone can hold: the view, the check day and the counts in words", () => {
    render(<SteeredBy view={VIEW} />);
    expect(screen.getByText(/steered by:/, { selector: "summary" }).textContent).toBe(
      "steered by: AI-dip view · check 2027-01-29 · ✓ 3 pass / ✗ 1 fail / ○ 3 pending",
    );
  });

  it("gives every claim its outcome as a word, so colour never carries it", () => {
    render(<SteeredBy view={VIEW} />);
    expect(screen.getByText(/^held · The floor/)).toBeTruthy();
    expect(screen.getByText(/^failed · Back above/)).toBeTruthy();
    expect(screen.getByText(/^pending · Print moves/)).toBeTruthy();
    expect(screen.getByText(/^untestable · In the long run/)).toBeTruthy();
  });

  it("says when each claim is scored, and what was read once it has been", () => {
    render(<SteeredBy view={VIEW} />);
    expect(screen.getByText(/^scored 2027-01-21 · this pair's fence rests on it/)).toBeTruthy();
    expect(
      screen.getByText("CRWV's lowest close was $52.00, inside $41.00 to $60.90."),
    ).toBeTruthy();
    expect(screen.getByText("due 2026-11-17")).toBeTruthy();
    expect(screen.getByText("size zero")).toBeTruthy();
    // A pending claim's basis is a promise, not a reading; only a decided one prints what was read.
    expect(screen.queryByText("Not due: scored on 2026-11-17.")).toBeNull();
  });

  it("says it only narrows, leaves timing to the playbook, and is SIM", () => {
    render(<SteeredBy view={VIEW} />);
    const note = screen.getByText(/untestable at size zero/).textContent ?? "";
    expect(note).toContain("It only narrows this pair; the playbook still picks the timing. SIM.");
    expect(note).toContain("Eric's view; 1 claim untestable");
  });
});
