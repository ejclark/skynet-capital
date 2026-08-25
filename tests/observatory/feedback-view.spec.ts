import {
  renderFeedbackFormBody,
  renderFeedbackResultBody,
} from "../../src/observatory/feedback-view.js";
import { FEEDBACK_AREAS } from "../../src/server/feedback-areas.js";

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

  it("offers Write | Preview on the details field — the body becomes markdown on GitHub", () => {
    const html = renderFeedbackFormBody({ nav: NAV, enabled: true, coachEnabled: false });

    expect(html).toContain('id="fdbk-tab-write"');
    expect(html).toContain('id="fdbk-tab-preview"');
    expect(html).toContain('id="fdbk-preview"');
    // Hidden until script unhides them: dead tabs are worse than no tabs.
    expect(html).toContain('id="fdbk-tabs" role="tablist" hidden');
  });

  it("ships the preview script whether or not the coach is wired", () => {
    for (const coachEnabled of [true, false]) {
      const html = renderFeedbackFormBody({ nav: NAV, enabled: true, coachEnabled });
      expect(html).toContain("/feedback/preview");
    }
  });

  it("degrades gracefully with no JS — a noscript override keeps the plain form usable", () => {
    const html = renderFeedbackFormBody({ nav: NAV, enabled: true, coachEnabled: true });
    expect(html).toContain("<noscript>");
    expect(html).toContain("#fdbk-form{display:flex !important}");
  });
});

describe("feedback form — screenshot attachment", () => {
  it("renders the file input and its hidden JSON field, wired for the image script", () => {
    const html = renderFeedbackFormBody({ nav: NAV, enabled: true, coachEnabled: false });

    // No `name` on the file input — the raw file never rides the POST as multipart, only the
    // script's re-encoded JSON in the hidden field does.
    expect(html).toContain('<input type="file" id="fdbk-image-input" accept="image/*" multiple>');
    expect(html).toContain('<input type="hidden" id="fdbk-images-field" name="images">');
    expect(html).toContain('id="fdbk-image-list"');
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

describe("feedback form — your recent feedback (#429)", () => {
  it("renders nothing when the member has no filings yet", () => {
    const html = renderFeedbackFormBody({
      nav: NAV,
      enabled: true,
      coachEnabled: false,
      recent: [],
    });
    expect(html).not.toContain("Your recent feedback");
  });

  it("lists past filings newest first, linking out to the issue", () => {
    const html = renderFeedbackFormBody({
      nav: NAV,
      enabled: true,
      coachEnabled: false,
      recent: [
        {
          uuid: "u-1",
          opaqueMemberId: "m",
          issueNumber: 7,
          url: "https://github.com/x/y/issues/7",
          kind: "bug",
          title: "Older bug",
          filedAt: "2026-08-19T00:00:00.000Z",
        },
        {
          uuid: "u-2",
          opaqueMemberId: "m",
          issueNumber: 9,
          url: "https://github.com/x/y/issues/9",
          kind: "idea",
          title: "Newer idea",
          filedAt: "2026-08-22T00:00:00.000Z",
        },
      ],
    });

    expect(html).toContain("Your recent feedback");
    const newer = html.indexOf("Newer idea");
    const older = html.indexOf("Older bug");
    expect(newer).toBeGreaterThan(-1);
    expect(older).toBeGreaterThan(newer);
    expect(html).toContain('href="https://github.com/x/y/issues/9"');
    expect(html).toContain("#9");
  });
});

describe("feedback form — the feedback-given counter (#567)", () => {
  const entry = (n: number) => ({
    uuid: `u-${n}`,
    opaqueMemberId: "m",
    issueNumber: n,
    url: `https://github.com/x/y/issues/${n}`,
    kind: "bug" as const,
    title: `Bug ${n}`,
    filedAt: "2026-08-22T00:00:00.000Z",
  });
  const render = (recent: ReturnType<typeof entry>[]) =>
    renderFeedbackFormBody({ nav: NAV, enabled: true, coachEnabled: false, recent });

  it("counts the member's filings off the same durable log the list reads — no second counter", () => {
    const html = render([entry(7), entry(9), entry(11)]);
    expect(html).toContain('class="fdbk-count-n">3<');
    expect(html).toContain("pieces of feedback filed");
  });

  it("reads as one piece, singular, for a first-time filer", () => {
    const html = render([entry(7)]);
    expect(html).toContain('class="fdbk-count-n">1<');
    expect(html).toContain("piece of feedback filed");
    expect(html).not.toContain("pieces of feedback filed");
  });

  it("points at the milestone the filing earned, so the reward is visible where the act happens", () => {
    expect(render([entry(7)])).toContain('href="/learn"');
  });

  it("shows no counter at zero — an empty stat is noise, not encouragement", () => {
    expect(render([])).not.toContain('class="fdbk-count-n"');
    expect(render([])).not.toContain("feedback filed");
  });
});

describe("feedback form — the area select", () => {
  it("renders every offered area from the one shared list, so the coach and the form cannot drift", () => {
    const html = renderFeedbackFormBody({ nav: NAV, enabled: true, coachEnabled: true });
    for (const area of FEEDBACK_AREAS) {
      expect(html).toContain(`<option>${area}</option>`);
    }
    // The placeholder stays the selected default — an unanswered area is honest, not guessed.
    expect(html).toContain('<option value="" selected>— pick a spot —</option>');
  });
});
