import type { Session } from "../../src/server/auth/session.js";
import { feedbackInputFromForm, kindFromForm } from "../../src/server/feedback-form-input.js";

/**
 * Reading a posted feedback form, tested for the one thing it must never do: invent an answer.
 *
 * The provenance (#645). `kindFromForm`'s predecessor read
 * `kindRaw === "bug" || kindRaw === "idea" ? kindRaw : "feature"` — every unreadable value became
 * `feature`. Paired with `feature` being pre-selected in the form, that produced a corpus where
 * all ten member-filed issues were labelled `enhancement`, one of them a plainly broken capability
 * (#546) and another a layout fault that "breaks user workflow" (#443). The build lane triages off
 * those labels, so a fabricated default is not cosmetic — it routes real bug reports into the
 * feature queue.
 */

const form = (pairs: Record<string, string>): URLSearchParams => new URLSearchParams(pairs);
const SESSION = { email: "m@example.com", name: "Member" } as Session;

describe("the kind a member chose", () => {
  it.each(["bug", "feature", "idea"])("passes %s through", (kind) => {
    expect(kindFromForm(kind)).toBe(kind);
  });

  it("reports ABSENT for anything it cannot read, rather than guessing", () => {
    // Each of these used to become "feature" silently.
    expect(kindFromForm(null)).toBeUndefined();
    expect(kindFromForm("")).toBeUndefined();
    expect(kindFromForm("Bug")).toBeUndefined();
    expect(kindFromForm("question")).toBeUndefined();
  });

  it("never resolves an unknown value to a real kind", () => {
    // The regression that matters: whatever changes here, nothing unreadable may come back
    // looking like a member's answer.
    for (const raw of [null, "", "  ", "FEATURE", "enhancement", "🐞"]) {
      expect(["bug", "feature", "idea"]).not.toContain(kindFromForm(raw));
    }
  });
});

describe("assembling the submission", () => {
  it("carries the kind the caller resolved, not one re-read from the form", () => {
    // The route decides the kind (and refuses when there isn't one) before this is called, so a
    // second, laxer read here could not reintroduce the fallback.
    const input = feedbackInputFromForm(form({ kind: "feature", title: "t" }), undefined, "bug");

    expect(input.kind).toBe("bug");
  });

  it("keeps the title and details verbatim", () => {
    const input = feedbackInputFromForm(
      form({ title: "Trade button does nothing", details: "on my second account" }),
      undefined,
      "bug",
    );

    expect(input.title).toBe("Trade button does nothing");
    expect(input.details).toBe("on my second account");
  });

  it("omits an area the member never picked, rather than sending an empty one", () => {
    expect(feedbackInputFromForm(form({ title: "t" }), undefined, "idea")).not.toHaveProperty(
      "area",
    );
    expect(
      feedbackInputFromForm(form({ title: "t", area: "The Wire" }), undefined, "idea").area,
    ).toBe("The Wire");
  });

  it("attaches the signed-in member, and nothing when there is no session", () => {
    const anon = feedbackInputFromForm(form({ title: "t" }), undefined, "bug");
    const signed = feedbackInputFromForm(form({ title: "t" }), SESSION, "bug");

    expect(anon).not.toHaveProperty("submitterEmail");
    expect(signed.submitterEmail).toBe("m@example.com");
    expect(signed.submitterName).toBe("Member");
  });

  it("drops an unparseable build spec instead of failing the whole submission", () => {
    const input = feedbackInputFromForm(
      form({ title: "t", spec: "{not json" }),
      undefined,
      "feature",
    );

    expect(input).not.toHaveProperty("spec");
    expect(input.title).toBe("t");
  });
});
