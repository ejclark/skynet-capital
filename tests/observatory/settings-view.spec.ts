import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import {
  type FleetControls,
  renderSettingsBody,
  settingsAction,
} from "../../src/observatory/settings-view.js";

/**
 * The Settings tab — Mission Control's new home (#475). Two things are under test: that it renders
 * through the app-wide shell (the left rail was the member's actual complaint), and that it stays
 * honest about what each switch does — a fleet-wide stand-down must never read as "this bot only",
 * and an account with no autonomous runner must say so rather than showing a dead switch.
 */
const snapshot = (over: Partial<ParticipantSnapshot> = {}): ParticipantSnapshot => ({
  id: "sauron",
  displayName: "Sauron",
  kind: "bot",
  cash: 1_000,
  equity: 1_000,
  positions: [],
  activity: [],
  ...over,
});

const controls = (over: Partial<FleetControls> = {}): FleetControls => ({
  allSuspended: false,
  bots: [
    { id: "sauron", displayName: "Sauron", suspended: false },
    { id: "banker", displayName: "The Banker", suspended: true },
  ],
  ...over,
});

const nav = { active: "you" as const, canAdd: false, authed: true, canControl: true };

describe("settings view", () => {
  it("posts back to the desk it was rendered on", () => {
    expect(settingsAction("sauron")).toBe("/u/sauron?tab=settings");
    expect(settingsAction("human-uncle joe")).toBe("/u/human-uncle%20joe?tab=settings");
  });

  it("renders inside the push-drawer shell, so the left rail is present", () => {
    const html = renderSettingsBody(snapshot(), { nav, controls: controls() });
    expect(html).toContain('<aside class="drawer"');
    expect(html).toContain('<nav class="desk-tabs"');
    expect(html).toContain('href="/u/sauron?tab=settings"');
  });

  it("shows the Settings tab in the strip only for an owner", () => {
    const owner = renderSettingsBody(snapshot(), { nav, controls: controls() });
    expect(owner).toContain(">Settings<");
    const member = renderSettingsBody(snapshot(), {
      nav: { ...nav, canControl: false },
      controls: controls(),
    });
    expect(member).not.toContain(">Settings<");
  });

  it("gives a registered bot its own switch, in market colors", () => {
    const html = renderSettingsBody(snapshot(), { nav, controls: controls() });
    expect(html).toContain("Autonomous trading — Sauron");
    expect(html).toContain(`<span class="pos"><b>TRADING</b></span>`);
    expect(html).toContain(`<span class="neg"><b>SUSPENDED</b></span>`); // The Banker's row
    expect(html).toContain('value="suspend"');
  });

  it("says plainly that a human account has nothing autonomous to suspend", () => {
    const html = renderSettingsBody(snapshot({ id: "ann", displayName: "Ann", kind: "human" }), {
      nav,
      controls: controls(),
    });
    expect(html).toContain("traded by a person");
    // No dead switch implying a control this account doesn't have.
    expect(html).not.toContain("Autonomous trading — Ann");
  });

  it("explains a bot that isn't a registered persona instead of silently omitting its switch", () => {
    const html = renderSettingsBody(snapshot({ id: "planted", displayName: "Planted" }), {
      nav,
      controls: controls(),
    });
    expect(html).toContain("isn't one of the league's registered personas");
  });

  it("never lets the fleet-wide switch read as this-desk-only", () => {
    const html = renderSettingsBody(snapshot(), { nav, controls: controls() });
    expect(html).toContain("Suspend ALL autonomous trading");
    expect(html).toContain("not just this desk");
  });

  it("attributes a global stand-down to the fleet switch, not to the bot's own", () => {
    const html = renderSettingsBody(snapshot(), {
      nav,
      controls: controls({ allSuspended: true }),
    });
    expect(html).toContain("held down by the fleet-wide suspend below");
    expect(html).toContain("Lift global suspend");
  });

  it("renders the audit line when the store has one", () => {
    const html = renderSettingsBody(snapshot(), {
      nav,
      controls: controls({ updatedAt: "2026-08-21T12:00:00.000Z", updatedBy: "eric@gmail.com" }),
    });
    expect(html).toContain("Last change 2026-08-21 12:00 UTC by eric@gmail.com");
  });

  it("stays honest when there are no bots at all", () => {
    const html = renderSettingsBody(snapshot(), { nav, controls: controls({ bots: [] }) });
    expect(html).toContain("No bots on the board.");
  });

  it("escapes a hostile display name rather than rendering it as markup", () => {
    const html = renderSettingsBody(snapshot(), {
      nav,
      controls: controls({
        bots: [{ id: "x", displayName: `<script>alert(1)</script>`, suspended: false }],
      }),
    });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
