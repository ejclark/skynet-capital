import { readFileSync } from "node:fs";
import { describe, expect, it } from "@rstest/core";
import { actionsOf, loadJourneys } from "../../scripts/crawl/steps.mjs";

// A known-gap step is the ratchet: `test.fail()` until the gap is fixed, then red, then the fix
// deletes its `known_gap` (docs/members/README.md). That only works if the step's ACT still runs
// once the gap is fixed. An act that waits for the defect throws on the fixed app, test.fail sees
// a failure, and the gap reads as open forever (#8422, found by the post-merge audit of #8015).

interface Expect {
  readonly text?: string;
}
interface Action {
  readonly await?: Expect;
}
interface Step {
  readonly id: string;
  readonly sees: string;
  readonly act?: Action | readonly Action[];
  readonly known_gap?: string;
}
interface Journey {
  readonly id: string;
  readonly steps: readonly Step[];
}
interface Member {
  readonly member: string;
  readonly journeys: readonly Journey[];
}

const members = loadJourneys() as Member[];

/** One of her scripted lines, read from the source (the app's imports do not resolve from the root). */
function scriptLine(name: string): string {
  const src = readFileSync("app/src/live/moneypenny-script.ts", "utf8");
  const hit = src.match(new RegExp(`export const ${name} =\\s*"([^"]+)"`));
  if (!hit?.[1]) throw new Error(`${name} not found in moneypenny-script.ts`);
  return hit[1];
}
const FB_OPEN = scriptLine("FB_OPEN");
const FB_QUESTION = scriptLine("FB_QUESTION");

/** The texts a step's act waits for, in order. */
function awaitTexts(step: Step): string[] {
  return (actionsOf(step.act) as Action[]).flatMap((a) => (a.await?.text ? [a.await.text] : []));
}

/** What a step's `sees` quotes: the words a member reads today, which on a known-gap step is the defect. */
function quoted(sees: string): string[] {
  return [...sees.matchAll(/'([^']{6,})'|"([^"]{6,})"/g)].map((m) => (m[1] ?? m[2]) as string);
}

describe("a known-gap step's act", () => {
  it("never waits for the words its own `sees` quotes as the defect", () => {
    const bad: string[] = [];
    for (const m of members) {
      for (const j of m.journeys) {
        for (const s of j.steps) {
          if (!s.known_gap) continue;
          const defect = quoted(s.sees);
          for (const t of awaitTexts(s)) {
            if (defect.some((d) => d.includes(t) || t.includes(d))) {
              bad.push(`${m.member} ${j.id} ${s.id} awaits "${t}"`);
            }
          }
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it("still runs the filing conversation once s3's fix drops 'where in the app does this bite you'", () => {
    // The natural s3 fix: the draft carries the screen and symbol, so her one question keeps only
    // its outcome half. Every line s2, s3 and s4 wait on must still be said after that fix.
    const fixed = FB_QUESTION.replace("where in the app does this bite you, and ", "");
    expect(fixed).not.toBe(FB_QUESTION);
    const said = [FB_OPEN, fixed].join("\n");
    const j5 = members
      .find((m) => m.member === "returning-trader")
      ?.journeys.find((j) => j.id === "j5");
    const steps = (j5?.steps ?? []).filter((s) => ["s2", "s3", "s4"].includes(s.id));
    expect(steps.map((s) => s.id)).toEqual(["s2", "s3", "s4"]);
    for (const s of steps) {
      const texts = awaitTexts(s);
      expect(texts.length, `${s.id} waits for her lines`).toBeGreaterThan(0);
      for (const t of texts) expect(said, `${s.id} awaits "${t}"`).toContain(t);
    }
  });
});
