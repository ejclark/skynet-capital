import { describe, expect, it } from "@rstest/core";
import {
  CALLOUT_GAP_MARKER,
  calloutGapComment,
  missingDecisionCallout,
  shouldPostCalloutGap,
} from "../../../scripts/moneypenny/decision-callout.mjs";
import { checkCallout } from "../../../scripts/moneypenny/index.mjs";

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

// #3913 slice 2b — the wiring `--check-callout` runs in the events lane. The rule above is pure;
// these cover the I/O around it: the payload it reads, the comment it posts, and who it blames.
describe("checkCallout — the events lane's labeled: needs-eric step", () => {
  const labeled = (over: Record<string, unknown> = {}) => ({
    payload: {
      issue: {
        number: 77,
        body: "a plain body with no ask",
        user: { login: "skynet-envoy[bot]" },
        labels: [{ name: "needs-eric" }, { name: "bug" }],
        ...over,
      },
      sender: { login: "github-actions[bot]" },
    },
  });
  const spy = () => {
    const posts: [number, string][] = [];
    return { posts, post: (n: number, body: string) => void posts.push([n, body]) };
  };

  it("comments once, naming the actor who applied the label", () => {
    const { posts, post } = spy();
    const out = checkCallout(labeled(), { readComments: () => [], post });

    expect(out).toMatchObject({ posted: true, actor: "github-actions[bot]" });
    expect(posts).toEqual([[77, expect.stringContaining("@github-actions[bot]")]]);
  });

  it("stays silent when the body already states the decision", () => {
    const { posts, post } = spy();
    expect(
      checkCallout(labeled({ body: CALLOUT }), { readComments: () => [], post }),
    ).toMatchObject({ posted: false });
    expect(posts).toEqual([]);
  });

  it("stays silent when it already said this once", () => {
    const { posts, post } = spy();
    const deps = { readComments: () => [`said it\n${CALLOUT_GAP_MARKER}`], post };
    expect(checkCallout(labeled(), deps)).toMatchObject({ posted: false });
    expect(posts).toEqual([]);
  });

  it("never binds Eric's own issue, and never touches labels", () => {
    const { posts, post } = spy();
    const eric = labeled({ user: { login: "ejclark" } });
    expect(checkCallout(eric, { readComments: () => [], post })).toMatchObject({ posted: false });
    expect(posts).toEqual([]);
  });

  it("is a no-op on a payload with no issue, rather than throwing", () => {
    expect(checkCallout({ payload: {} })).toMatchObject({ posted: false });
  });

  it("falls back to the run's actor when the payload carries no sender", () => {
    const { posts, post } = spy();
    const ctx = { actor: "ejclark", payload: { issue: labeled().payload.issue } };
    expect(checkCallout(ctx, { readComments: () => [], post })).toMatchObject({ actor: "ejclark" });
    expect(posts).toEqual([[77, expect.stringContaining("@ejclark")]]);
  });
});
