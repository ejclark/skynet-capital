import { readFileSync } from "node:fs";
import {
  type OpsStatusView,
  opsAttentionCount,
  opsAttentionLabel,
} from "../../app/src/live/ops-status";

/**
 * The status pill's fleet half (#1296). Three things are held here, and each is a way the pill
 * could quietly start lying:
 *
 *  1. What counts as "needs attention" — a `Bot activity` row must never raise the flag, because a
 *     day with no bot orders is a quiet market, not an outage (`ops-status-service.ts`). The rule
 *     is `verdict === "attention"`, not an id allowlist, so a NEW alarming signal is flagged the
 *     day it ships rather than the day someone remembers this file.
 *  2. That the flag speaks — colour alone is not a message, so the count always has a sentence.
 *  3. That the pill stays group-visible: it fetches `/api/ops-status` (the content family) and not
 *     `/api/admin/*`, which is owner-only by definition. The component needs a DOM this suite
 *     doesn't have, so that half is asserted against the source, the same way
 *     `desk-rail-settings.spec.ts` asserts its gate.
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

describe("the status pill's fleet flag", () => {
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

describe("the pill's reach", () => {
  it("reads the group-visible endpoint, never the owner-only admin family", () => {
    const source = readFileSync("app/src/live/ops-status.ts", "utf8");
    expect(source).toContain('fetch("/api/ops-status"');
    // The module's own history mentions the old path in prose, so match what it CALLS.
    expect(source).not.toMatch(/fetch\(\s*"\/api\/admin/);
  });

  it("is mounted in the shell's topbar, so every route carries it", () => {
    const root = readFileSync("app/src/routes/__root.tsx", "utf8");
    expect(root).toContain("<StatusPill />");
  });

  it("keeps the pill's text hidden on phones without hiding its dots", () => {
    const css = readFileSync("app/src/styles/status.css", "utf8");
    // The old rule shrank the whole pill to `font-size: 0`, which would have swallowed the flag —
    // and the phone is exactly where #666 wanted this readable.
    expect(css).toContain(".status-text {\n    display: none;\n  }");
    expect(css).toContain(".status-flag {");
    expect(readFileSync("app/src/styles/index.css", "utf8")).toContain('@import "./status.css";');
  });
});
