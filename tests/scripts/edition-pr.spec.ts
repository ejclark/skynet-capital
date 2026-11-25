import { describe, expect, it } from "@rstest/core";
import { editionPr, editionPrOpen } from "../../scripts/edition-pr.mjs";

// The weekday edition's PR (#8252 PR 2, .github/workflows/print-dates.yml → `edition`): one branch
// per close, so a re-run for the same close updates that PR instead of opening a second.
describe("edition-pr: one PR per close", () => {
  const branch = "chore/edition-2026-11-24";

  it("finds the open PR on the close's branch", () => {
    expect(editionPrOpen([{ head: { ref: "other" } }, { head: { ref: branch } }], branch)).toBe(
      true,
    );
  });

  it("opens one when no open PR carries the branch", () => {
    expect(editionPrOpen([{ head: { ref: "chore/edition-2026-11-23" } }, {}], branch)).toBe(false);
  });
});

describe("edition-pr: the body says what the edition leads with", () => {
  const edition = {
    date: "2026-11-24",
    writtenBy: "Written by code after the 2026-11-24 close.",
    stories: [
      { id: "movers", line: "NVDA fell 10.0%", facts: [{ label: "NVDA", value: "−10.0%" }] },
      { id: "ahead", line: "Next: MRVL quarterly results", facts: [] },
    ],
    next: [{}, {}],
  };

  it("names the date in the title and every story's line in the body", () => {
    const { title, body } = editionPr(edition);
    expect(title).toBe("chore(edition): the day's edition for 2026-11-24");
    expect(body).toContain("- **movers**: NVDA fell 10.0% (NVDA −10.0%)");
    expect(body).toContain("- **ahead**: Next: MRVL quarterly results");
    expect(body).toContain("2 stories, 2 dated next");
    expect(body).toContain("Part of #8252");
  });

  it("opens with the picture section the template requires, waived for a data file", () => {
    expect(editionPr(edition).body.startsWith("## The picture\n\nPicture: waived")).toBe(true);
  });
});
