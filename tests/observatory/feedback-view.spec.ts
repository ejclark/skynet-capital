import {
  renderFeedbackFormBody,
  renderFeedbackResultBody,
} from "../../src/observatory/feedback-view.js";

const NAV = {
  active: "feedback" as const,
  canAdd: false,
  authed: true,
};

describe("renderFeedbackFormBody", () => {
  it("rides inside the shared app shell — the drawer nav stays visible, not a bare standalone page", () => {
    const html = renderFeedbackFormBody({ nav: NAV, enabled: true, coachEnabled: false });

    expect(html).toContain('id="drawer"');
    expect(html).toContain("Share feedback");
  });

  it("warns when submission isn't wired, and stays quiet once it is", () => {
    const off = renderFeedbackFormBody({ nav: NAV, enabled: false, coachEnabled: false });
    expect(off).toContain("isn't switched on yet");

    const on = renderFeedbackFormBody({ nav: NAV, enabled: true, coachEnabled: false });
    expect(on).not.toContain("isn't switched on yet");
  });

  it("puts the AI-assist panel beside the form, in the same layout, when the coach is wired", () => {
    const html = renderFeedbackFormBody({ nav: NAV, enabled: true, coachEnabled: true });

    const layoutOpen = html.indexOf('class="fdbk-layout"');
    const formOpen = html.indexOf('class="fdbk-form"');
    const coachBox = html.indexOf('id="coach-box"');
    // Both the form and the assist panel sit inside the same side-by-side layout wrapper —
    // never the coach trailing the form as a separate block a member has to scroll past (#443).
    expect(layoutOpen).toBeGreaterThan(-1);
    expect(formOpen).toBeGreaterThan(layoutOpen);
    expect(coachBox).toBeGreaterThan(layoutOpen);
  });

  it("omits the assist panel entirely when the coach isn't wired", () => {
    const html = renderFeedbackFormBody({ nav: NAV, enabled: true, coachEnabled: false });
    expect(html).not.toContain("coach-box");
  });
});

describe("renderFeedbackResultBody", () => {
  it("links the filed issue on success, still inside the app shell", () => {
    const html = renderFeedbackResultBody({
      nav: NAV,
      result: { ok: true, url: "https://github.com/x/y/issues/7", number: 7 },
    });

    expect(html).toContain('id="drawer"');
    expect(html).toContain("#7");
    expect(html).toContain("https://github.com/x/y/issues/7");
  });

  it("shows the honest error on failure", () => {
    const html = renderFeedbackResultBody({
      nav: NAV,
      result: { ok: false, error: "GitHub said no" },
    });

    expect(html).toContain("GitHub said no");
  });
});
