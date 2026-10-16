import { readFileSync } from "node:fs";
import {
  type OpsStatusView,
  opsAttentionCount,
  opsAttentionLabel,
} from "../../app/src/live/ops-status";

/**
 * Fleet health in the top bar (#1296; folded into the status line by #5037 round 2, question 9).
 * Three things are held here, and each is a way the bar could quietly start lying:
 *
 *  1. What counts as "needs attention" — a `Bot activity` row must never raise the alarm, because a
 *     day with no bot orders is a quiet market, not an outage (`ops-status-service.ts`). The rule
 *     is `verdict === "attention"`, not an id allowlist, so a NEW alarming signal is flagged the
 *     day it ships rather than the day someone remembers this file.
 *  2. That the alarm speaks — colour alone is not a message, so the count always has a sentence.
 *  3. That it stays group-visible and on every route: it fetches `/api/ops-status` (the content
 *     family) and not `/api/admin/*`, and it rides the shell's status line. The component half
 *     needs a DOM this suite doesn't have, so it is asserted against the source, the same way
 *     `desk-rail-settings.spec.ts` asserts its gate; its behaviour is
 *     `app/tests/shell/session-status.spec.tsx`.
 */

const view = (
  signals: readonly { id: string; verdict: "ok" | "attention" | "unknown" }[],
): OpsStatusView => ({
  available: true,
  status: {
    generatedAt: "2026-09-05T12:00:00Z",
    degraded: false,
    signals: signals.map((s) => ({ ...s, label: s.id, detail: "" })),
  },
});

describe("the fleet's alarm count", () => {
  it("counts every signal asking for a human, whatever it is called", () => {
    expect(
      opsAttentionCount(
        view([
          { id: "bridge", verdict: "attention" },
          { id: "deploy-app", verdict: "ok" },
          { id: "some-future-signal", verdict: "attention" },
        ]),
      ),
    ).toBe(2);
  });

  it("stays quiet on ok and unknown — a quiet market is not an outage", () => {
    expect(
      opsAttentionCount(
        view([
          { id: "activity", verdict: "unknown" },
          { id: "bridge", verdict: "ok" },
        ]),
      ),
    ).toBe(0);
  });

  it("shows nothing before the fetch lands, and nothing where no panel is wired", () => {
    expect(opsAttentionCount(undefined)).toBe(0);
    expect(opsAttentionCount({ available: false })).toBe(0);
  });

  it("gives the flag a sentence, so the colour is never the whole message", () => {
    expect(opsAttentionLabel(0)).toBeUndefined();
    expect(opsAttentionLabel(1)).toBe("1 ops signal needs attention");
    expect(opsAttentionLabel(3)).toBe("3 ops signals need attention");
  });
});

describe("fleet health's reach", () => {
  it("reads the group-visible endpoint, never the owner-only admin family", () => {
    const source = readFileSync("app/src/live/ops-status.ts", "utf8");
    expect(source).toContain('fetch("/api/ops-status"');
    // The module's own history mentions the old path in prose, so match what it CALLS.
    expect(source).not.toMatch(/fetch\(\s*"\/api\/admin/);
  });

  it("rides the top bar's status line, so every route carries it", () => {
    const root = readFileSync("app/src/routes/__root.tsx", "utf8");
    expect(root).toContain("<SessionStatus key={pathname} />");
    expect(readFileSync("app/src/shell/session-status.tsx", "utf8")).toContain("<FleetHealth");
  });

  it("leaves the bar no gear or sign-out icon of its own — both live in the member menu", () => {
    const root = readFileSync("app/src/routes/__root.tsx", "utf8");
    expect(root).toContain("<MemberMenu />");
    expect(root).not.toContain('href="/logout"');
    expect(root).not.toContain("<StatusPill");
    expect(root).not.toContain("GearIcon");
    const menu = readFileSync("app/src/shell/member-menu.tsx", "utf8");
    expect(menu).toContain('to="/settings"');
    expect(menu).toContain('href="/logout"');
  });

  it("moves only for a viewer who has not asked the system to hold still", () => {
    for (const file of ["session-status.css", "member-menu.css"]) {
      const css = readFileSync(`app/src/styles/${file}`, "utf8");
      const calm = css.indexOf("@media (prefers-reduced-motion: no-preference)");
      expect(calm, file).toBeGreaterThan(-1);
      // every animation or transition is declared after the guard opens — none in the base rules
      const moving = [...css.matchAll(/^\s*(animation|transition)\s*:/gm)].map((m) => m.index ?? 0);
      expect(moving.length, file).toBeGreaterThan(0);
      for (const at of moving) expect(at, file).toBeGreaterThan(calm);
    }
    for (const file of ["session-status.css", "member-menu.css"]) {
      expect(readFileSync("app/src/styles/index.css", "utf8")).toContain(`@import "./${file}";`);
    }
  });
});
