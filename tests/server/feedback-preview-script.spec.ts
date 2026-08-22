import { renderFeedbackFormBody } from "../../src/observatory/feedback-view.js";
import { PREVIEW_SCRIPT } from "../../src/server/feedback-preview-script.js";

describe("feedback preview client script", () => {
  const html = renderFeedbackFormBody({
    nav: { active: "feedback", canAdd: false, authed: true },
    enabled: true,
    coachEnabled: true,
  });

  it("stays safely embeddable inside the feedback page's TS template literal (CLAUDE.md TS1005 trap)", () => {
    expect(PREVIEW_SCRIPT).not.toContain("`");
    expect(PREVIEW_SCRIPT).not.toMatch(/\$\{/);
  });

  it("wires to every DOM id the details field actually renders", () => {
    for (const id of [
      "fdbk-tabs",
      "fdbk-tab-write",
      "fdbk-tab-preview",
      "fdbk-preview",
      "fdbk-details",
    ]) {
      expect(html).toContain(`id="${id}"`);
      expect(PREVIEW_SCRIPT).toContain(`'${id}'`);
    }
  });

  it("unhides the tab bar itself — a no-JS member must never see dead tabs", () => {
    expect(html).toContain('id="fdbk-tabs" role="tablist" hidden');
    expect(PREVIEW_SCRIPT).toContain("tabs.hidden = false");
  });

  it("renders through the server route rather than parsing markdown in the browser", () => {
    // One implementation, one set of specs: src/ui/markdown-preview.ts. A second copy inlined here
    // would be the untested one, and it is the copy that handles member-typed HTML.
    expect(PREVIEW_SCRIPT).toContain("'/feedback/preview'");
    expect(PREVIEW_SCRIPT).toContain("JSON.stringify({ markdown: area.value })");
  });

  it("attaches after the document is parsed — the 2026-08-20 dead-script regression", () => {
    expect(PREVIEW_SCRIPT).toContain("document.readyState === 'loading'");
    expect(PREVIEW_SCRIPT).toContain("DOMContentLoaded");
  });

  it("says the send still works when the preview cannot render", () => {
    expect(PREVIEW_SCRIPT).toContain("your markdown still sends fine");
  });
});
