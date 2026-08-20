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

  it("puts the guided coach intro before the form, as the front door, when the coach is wired (#449)", () => {
    const html = renderFeedbackFormBody({ nav: NAV, enabled: true, coachEnabled: true });

    const coachBox = html.indexOf('id="coach-box"');
    const formOpen = html.indexOf('id="fdbk-form"');
    // The guided intro comes first — the AI step is the front door, not a bolt-on the member
    // scrolls past after already typing (#449) — and the form starts hidden until a draft is
    // ready or the member skips ahead.
    expect(coachBox).toBeGreaterThan(-1);
    expect(formOpen).toBeGreaterThan(coachBox);
    expect(html).toContain('id="fdbk-form" method="post" action="/feedback" style="display:none"');
  });

  it("gives a skip escape hatch straight to the plain form", () => {
    const html = renderFeedbackFormBody({ nav: NAV, enabled: true, coachEnabled: true });
    expect(html).toContain('id="coach-skip"');
  });

  it("shows the plain form immediately, with no hidden start state, when the coach isn't wired", () => {
    const html = renderFeedbackFormBody({ nav: NAV, enabled: true, coachEnabled: false });
    expect(html).not.toContain("coach-box");
    expect(html).toContain('id="fdbk-form" method="post" action="/feedback">');
  });

  it("degrades gracefully with no JS — a noscript override keeps the plain form usable", () => {
    const html = renderFeedbackFormBody({ nav: NAV, enabled: true, coachEnabled: true });
    expect(html).toContain("<noscript>");
    expect(html).toContain("#fdbk-form{display:flex !important}");
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
