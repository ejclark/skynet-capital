import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium, expect, test } from "@playwright/test";

// THE STUDY RECORDER'S MISSING KEYBOARD (#8126) — a harness spec, not an app one. Three phone
// sessions in #8005 slice 4 tapped the chip just above Moneypenny's ask box, then typed: the
// recorder played the keys into the document and "?" opened the shortcuts panel, which no phone
// can do with nothing focused. Here the real recorder and the real scripted-actor loop
// (e2e/fixtures/study-no-keyboard/run.mjs) play scripts/study/tasks/proof/no-keyboard-actions.json
// on a proof page at both viewports — no model, no built app. It lives in e2e/ because this is the
// suite whose CI job has a Chromium; it spawns its own browser through the recorder and ignores the
// `page` fixture, so it is project-agnostic.

const NO_KEYBOARD = "no keyboard is open: nothing is focused for typing";

interface Proof {
  turns: { n: number; refused?: string; step?: number; action: { type: string } }[];
  ended: string;
  trace: { refused?: string; focused?: string; step?: number; action: { kind: string } }[];
  metrics: { noKeyboard: number; steps: number };
  page: { ask: string; shortcuts: boolean };
}

function prove(viewport: "phone" | "desktop"): Proof {
  const out = mkdtempSync(join(tmpdir(), `study-no-keyboard-${viewport}-`));
  const run = spawnSync(
    process.execPath,
    ["--import", "tsx", "e2e/fixtures/study-no-keyboard/run.mjs", viewport, out],
    {
      encoding: "utf8",
      timeout: 120_000,
      // The recorder's own resolver reads PW_CHROME first: hand it the browser this suite installed.
      env: { ...process.env, PW_CHROME: chromium.executablePath() },
    },
  );
  if (run.status !== 0) throw new Error(`proof run failed (${run.status}):\n${run.stderr}`);
  return JSON.parse(run.stdout.trim().split("\n").at(-1) ?? "{}") as Proof;
}

test.describe("study recorder: typing with no text field focused", () => {
  test.describe.configure({ timeout: 180_000 });

  test("a phone refuses it, says why next turn, and the trace records it", () => {
    const p = prove("phone");
    const typed = p.turns[1];
    expect(typed?.action.type).toBe("type");
    expect(typed?.refused).toBe(NO_KEYBOARD);
    expect(typed?.step).toBeUndefined();
    const refusal = p.trace.filter((r) => r.refused);
    expect(refusal).toHaveLength(1);
    expect(refusal[0]).toMatchObject({ refused: NO_KEYBOARD, action: { kind: "type" } });
    expect(refusal[0]?.focused).toBe("button#chip");
    expect(p.metrics.noKeyboard).toBe(1);
    // Once the ask box has focus the keyboard is open: the second typing lands, the "?" never did.
    expect(p.turns[3]?.refused).toBeUndefined();
    expect(p.page).toEqual({ ask: "why", shortcuts: false });
    expect(p.ended).toBe("done");
  });

  test("a desktop plays it as a physical keyboard would", () => {
    const p = prove("desktop");
    expect(p.turns.filter((t) => t.refused)).toEqual([]);
    expect(p.trace.filter((r) => r.refused)).toEqual([]);
    expect(p.metrics.noKeyboard).toBe(0);
    expect(p.page).toEqual({ ask: "why", shortcuts: true });
    expect(p.ended).toBe("done");
  });
});
