import { existsSync, mkdtempSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import { gradeArgs, loadRound } from "../../scripts/study/grade.mjs";
import { gradeRound } from "../../scripts/study/grade-round.mjs";
import { buildReadout, FRAME_CAP, readoutArgs } from "../../scripts/study/readout.mjs";
import {
  actionWords,
  formulaSentence,
  SECTIONS,
  worstMoment,
} from "../../scripts/study/readout-core.mjs";

// The readout is the one page the owner judges at the stop, so its order never moves: picture ·
// headline · structural problems · scorecard · battle-test · job map · misses · one question. The
// round here is the made-up house in tests/fixtures/study-grade/, never the real key.

const FIX = join(import.meta.dirname, "../fixtures/study-grade");

/** Grade the fixture round into a temp dir and render its readout there; returns the page. */
function render(extra: string[] = []) {
  const root = mkdtempSync(join(tmpdir(), "study-readout-"));
  const grade = gradeRound(
    loadRound(
      gradeArgs([
        "--sealed",
        join(FIX, "sealed"),
        "--round",
        join(FIX, "round"),
        "--struck",
        join(FIX, "round/struck.json"),
        "--negative",
        join(FIX, "negative"),
        "--positive",
        join(FIX, "positive"),
      ]),
    ),
  );
  const gradePath = join(root, "grade.json");
  writeFileSync(gradePath, JSON.stringify(grade));
  const out = buildReadout(
    readoutArgs([
      "--grade",
      gradePath,
      "--round",
      join(FIX, "round"),
      "--study",
      "made-up-house",
      "--next-area",
      "the kitchen",
      "--cost",
      "about 90 short sessions",
      "--job-map",
      join(FIX, "job-map.json"),
      "--root",
      root,
      ...extra,
    ]),
  );
  return { root, ...out };
}

describe("worstMoment — the frame strip around the member's most confused turn", () => {
  const turns = [
    {
      step: 0,
      confusion: 1,
      as_member: "As X, I look",
      noticed: "a list",
      action: { type: "tap", x: 1, y: 2 },
    },
    {
      step: 1,
      confusion: 3,
      as_member: "As X, I pick",
      noticed: "it moved",
      action: { type: "tap", x: 3, y: 4 },
    },
    { step: 2, confusion: 3, action: { type: "give_up", why: "lost" } },
    { confusion: 3, refused: "outside the frame", action: { type: "tap", x: 999, y: 9 } },
  ];
  const trace = [
    { step: 0, frame: "/far/frames/001.jpg" },
    { step: 1, frame: "/far/frames/002.jpg", tap: { hit: { name: "Red rug" } } },
    { step: 2, frame: null },
  ];

  it("takes the first most-confused turn: the frame before it, the action, the frame after", () => {
    expect(worstMoment(turns, trace)).toEqual({
      step: 1,
      confusion: 3,
      before: "001.jpg",
      after: "002.jpg",
      action: 'tapped "Red rug"',
      quote: "As X, I pick — it moved",
    });
  });

  it("starts from the opening frame, and has no after for a turn that ended the session", () => {
    expect(worstMoment(turns.slice(0, 1), trace)?.before).toBe("000.jpg");
    expect(worstMoment(turns.slice(2, 3), trace)).toMatchObject({
      after: null,
      action: 'gave up: "lost"',
    });
    expect(worstMoment([], trace)).toBeNull();
  });

  it("words each kind of action plainly", () => {
    expect(actionWords({ type: "scroll", dir: "down", screens: 0.5 })).toBe(
      "scrolled down half a screen",
    );
    expect(actionWords({ type: "tap", x: 5, y: 6 })).toBe("tapped at (5, 6)");
    expect(actionWords({ type: "key", key: "Escape" })).toBe("pressed Escape");
  });
});

describe("formulaSentence — what's wrong · principle · why it matters · fix", () => {
  it("is one sentence, and says plainly when a part is missing", () => {
    expect(formulaSentence({ what: "A", principle: "B.", why: "C", fix: "D" })).toBe(
      "A — this breaks B, which matters because C; the fix: D.",
    );
    expect(formulaSentence({ what: "A" })).toContain("(not named)");
  });
});

describe("buildReadout — the made-up round, rendered", () => {
  const { markdown, shots, page } = render(["--battle", join(FIX, "battle.json")]);

  it("writes the page where the study's docs live, sections in the fixed order", () => {
    expect(page.endsWith(join("docs/members/study/made-up-house/readout.md"))).toBe(true);
    const heads = markdown
      .split("\n")
      .filter((l) => l.startsWith("## "))
      .map((l) => l.slice(3));
    expect(heads).toEqual(SECTIONS);
  });

  it("opens on the member's worst moment, beside a slot for the owner's own shot", () => {
    expect(markdown).toContain('| tapped "Red rug" |');
    expect(markdown).toContain("_your screenshot goes here (`--owner-shot`)_");
    expect(markdown).toContain("Where did the list go? I was just looking at it.");
  });

  it("states the headline in the plan's words, with its range", () => {
    expect(markdown).toContain(
      "**Found 4 of your 6 without seeing them · 3 new structural problems · 2 new smaller ones.**",
    );
    expect(markdown).toContain("anywhere from 30% to 90% (95% confidence)");
    expect(markdown).toContain("1 of your 7 could not be shown in the test world and was struck");
  });

  it("lists every structural problem with its frames, words and one-sentence formula", () => {
    expect(markdown).toContain("### 3. Nothing tells you the attic is upstairs");
    expect(markdown).toContain("reported 1 more time");
    expect(markdown).toContain("this breaks consistency and standards");
  });

  it("keeps the measurements in their own column and marks disputed rows", () => {
    expect(markdown).toContain("| Measurements (not blind) |");
    expect(markdown).toContain("| A5 | — | — | — | yes | **disputed** |");
    expect(markdown).toContain("| A4 | yes (hinted) |");
  });

  it("names the shape members struggled with least, and splits the misses", () => {
    expect(markdown).toContain("the members struggled least with **switch beside the lamp**");
    expect(markdown).toContain("- **No task went there:** A7");
    expect(markdown).toContain("- **Went there and didn't see it:** A5");
    expect(markdown).toContain(
      "Scale to **the kitchen** next (predicted cost: about 90 short sessions)",
    );
  });

  it("copies every frame it shows, each a JPEG of at most 100KB", () => {
    const files = readdirSync(shots);
    expect(files.length).toBeGreaterThanOrEqual(5);
    for (const f of files) {
      expect(f.endsWith(".jpg")).toBe(true);
      expect(statSync(join(shots, f)).size).toBeLessThanOrEqual(FRAME_CAP);
    }
    for (const link of markdown.matchAll(/\]\((\.\.\/[^)]+)\)/g))
      expect(existsSync(join(page, "..", link[1] ?? "missing"))).toBe(true);
  });

  it("names key items by id unless revealed from the sealed folder", () => {
    expect(markdown).not.toContain("the lamp switch sits far");
    const revealed = render(["--reveal", "--sealed", join(FIX, "sealed")]).markdown;
    expect(revealed).toContain("| A1 — the lamp switch sits far from the lamp it lights |");
  });

  it("says why the battle-test did not run when no results are given", () => {
    expect(render().markdown).toContain("Did not run: no battle-test results were given.");
  });

  it("refuses a reveal without the sealed folder", () => {
    expect(() =>
      readoutArgs([
        "--grade",
        "g",
        "--round",
        "r",
        "--study",
        "s",
        "--next-area",
        "a",
        "--cost",
        "c",
        "--reveal",
      ]),
    ).toThrow(/--reveal needs --sealed/);
  });
});
