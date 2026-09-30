import { describe, expect, it } from "@rstest/core";
import {
  CALLOUT_GAP_MARKER,
  calloutGapComment,
  missingDecisionCallout,
  shouldPostCalloutGap,
} from "../../../scripts/moneypenny/decision-callout.mjs";

// #3913 slice 2: `needs-eric` usually lands after filing, from another lane, so the callout rule
// (docs/ISSUES.md rule 7) has to be checked again when the label arrives — not only at filing.
const CALLOUT = "**Ask.**\n\n> [!IMPORTANT]\n> **Needs from you**\n> 1. Pick A or B? — why";

describe("decision callout: after-filing check", () => {
  it("flags a needs-eric issue whose body never states the decision", () => {
    expect(missingDecisionCallout({ labels: ["needs-eric"], body: "a plain body" })).toBe(true);
    expect(
      missingDecisionCallout({ labels: ["needs-eric"], body: null as unknown as string }),
    ).toBe(true);
  });

  it("passes when the callout is above the fold, and ignores issues without the label", () => {
    expect(missingDecisionCallout({ labels: ["needs-eric"], body: CALLOUT })).toBe(false);
    expect(missingDecisionCallout({ labels: ["ready"], body: "" })).toBe(false);
  });

  it("does not count a callout folded below <details>", () => {
    const folded = `top\n\n<details><summary>x</summary>\n\n${CALLOUT}\n</details>`;
    expect(missingDecisionCallout({ labels: ["needs-eric"], body: folded })).toBe(true);
  });

  it("never binds Eric's own issues", () => {
    expect(missingDecisionCallout({ labels: ["needs-eric"], body: "", author: "ejclark" })).toBe(
      false,
    );
  });
});

describe("decision callout: the lane's one comment", () => {
  it("posts once per gap, not once per relabel", () => {
    const issue = { labels: ["needs-eric"], body: "no ask", author: "skynet-envoy[bot]" };
    expect(shouldPostCalloutGap({ ...issue, comments: [] })).toBe(true);
    expect(shouldPostCalloutGap({ ...issue, comments: [`old\n${CALLOUT_GAP_MARKER}`] })).toBe(
      false,
    );
    expect(shouldPostCalloutGap({ ...issue, body: CALLOUT, comments: [] })).toBe(false);
  });

  it("names the labelling actor, carries the fix shape and its own marker", () => {
    const body = calloutGapComment({ actor: "skynet-envoy[bot]" });
    expect(body).toContain("@skynet-envoy[bot]");
    expect(body).toContain("> [!IMPORTANT]");
    expect(body).toContain(CALLOUT_GAP_MARKER);
    expect(calloutGapComment({})).toContain("an unknown actor");
  });
});
