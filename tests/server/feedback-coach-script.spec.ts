import { renderFeedbackFormBody } from "../../src/observatory/feedback-view.js";
import { COACH_SCRIPT } from "../../src/server/feedback-coach-script.js";

describe("feedback coach client script", () => {
  it("stays safely embeddable inside the feedback page's TS template literal — no stray backtick or interpolation (CLAUDE.md TS1005 trap)", () => {
    expect(COACH_SCRIPT).not.toContain("`");
    expect(COACH_SCRIPT).not.toMatch(/\$\{/);
  });

  it("wires to every DOM id the guided feedback flow actually renders (#449)", () => {
    const html = renderFeedbackFormBody({
      nav: { active: "feedback", canAdd: false, authed: true },
      enabled: true,
      coachEnabled: true,
    });

    for (const id of [
      "coach-box",
      "fdbk-form",
      "coach-thread",
      "coach-start",
      "coach-skip",
      "coach-note",
      "coach-kind",
    ]) {
      expect(html).toContain(`id="${id}"`);
      expect(COACH_SCRIPT).toContain(`'${id}'`);
    }
  });

  it("posts the guided-intro kind, not the (still-hidden) form's own kind field, to the coach endpoint", () => {
    // Behavioral contract: at the point the member starts the guided conversation, the real
    // form's kind field hasn't been shown or interacted with yet — only #coach-kind has.
    expect(COACH_SCRIPT).toContain("kind: coachKindEl.value");
  });

  // The 2026-08-20 funnel-down regression: the inline script shipped ABOVE the form it queries,
  // ran at parse time before #fdbk-form existed, and its own null-guard returned silently — dead
  // "Let's shape it", dead "Skip →", real form display:none. Two independent nets so markup order
  // and the guard can't both regress unnoticed again.
  it("waits for the document to finish parsing before wiring (the by-construction net)", () => {
    expect(COACH_SCRIPT).toContain("document.readyState");
    expect(COACH_SCRIPT).toContain("DOMContentLoaded");
  });

  it("rides below every element it queries in the rendered page (the order net)", () => {
    const html = renderFeedbackFormBody({
      nav: { active: "feedback", canAdd: false, authed: true },
      enabled: true,
      coachEnabled: true,
    });
    const scriptAt = html.indexOf(COACH_SCRIPT);
    expect(scriptAt).toBeGreaterThan(-1);
    for (const id of ["coach-box", "fdbk-form", "coach-start", "coach-skip"]) {
      const idAt = html.indexOf(`id="${id}"`);
      expect(idAt).toBeGreaterThan(-1);
      expect(idAt).toBeLessThan(scriptAt);
    }
  });
});
