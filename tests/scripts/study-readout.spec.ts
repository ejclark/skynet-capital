import {
  appendFileSync,
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import { gradeArgs, loadRound } from "../../scripts/study/grade.mjs";
import { gradeRound } from "../../scripts/study/grade-round.mjs";
import { buildReadout, FRAME_CAP, readoutArgs } from "../../scripts/study/readout.mjs";
import {
  actionWords,
  formulaSentence,
  RANKING,
  rankStructural,
  SECTIONS,
  STRUCTURAL_TOP,
  structuralSection,
  worstMoment,
} from "../../scripts/study/readout-core.mjs";

// The readout is the one page the owner judges at the stop, so its order never moves: picture ·
// headline · structural problems · scorecard · battle-test · job map · misses · one question. The
// round here is the made-up house in tests/fixtures/study-grade/, never the real key.

const FIX = join(import.meta.dirname, "../fixtures/study-grade");

/** The fixture round, graded. */
function gradeFixture() {
  return gradeRound(
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
}

/** Grade the fixture round into a temp dir and render its readout there; returns the page. */
function render(extra: string[] = [], round = join(FIX, "round"), grade = gradeFixture()) {
  const root = mkdtempSync(join(tmpdir(), "study-readout-"));
  const gradePath = join(root, "grade.json");
  writeFileSync(gradePath, JSON.stringify(grade));
  const out = buildReadout(
    readoutArgs([
      "--grade",
      gradePath,
      "--round",
      round,
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

describe("structuralSection — the top ten ranked, the rest folded (#5845)", () => {
  // One new structural problem as readout.mjs hands it over; `n` keeps each title unique.
  const item = (n: number, severity: string | null, also = 0, members = 1) => ({
    finding: { what: `Problem ${n}`, severity, member: "night-owl", frames: [] },
    class: "members",
    also,
    members,
    frames: [`../../shots/study-x/p${n}.jpg`],
  });
  const noTail = { structural: { refound: {}, held: {} } };
  const page = (items: ReturnType<typeof item>[]) =>
    structuralSection({ structural: items, grade: noTail }).join("\n");

  it("ranks by severity, then times reported, then members reached, the input order breaking ties", () => {
    const ranked = rankStructural([
      item(1, "Low", 5, 3),
      item(2, "3"),
      item(3, "Critical"),
      item(4, "High", 2, 1),
      item(5, "High", 2, 2),
      item(6, "high", 4, 1),
      item(7, null, 9, 9),
      item(8, "High", 2, 2),
    ]);
    expect(ranked.map((s) => s.finding.what)).toEqual([
      "Problem 3",
      "Problem 6",
      "Problem 5",
      "Problem 8",
      "Problem 4",
      "Problem 2",
      "Problem 1",
      "Problem 7",
    ]);
  });

  it("shows the ten ranked highest with frames and folds every other one, text only", () => {
    const items = Array.from({ length: 13 }, (_, i) => item(i + 1, i < 3 ? "Low" : "High"));
    const md = page(items);
    expect(STRUCTURAL_TOP).toBe(10);
    expect(md).toContain(RANKING);
    expect(md.indexOf(RANKING)).toBeLessThan(md.indexOf("### 1."));
    expect(md).toContain("### 1. Problem 4");
    expect(md).toContain("### 10. Problem 13");
    expect(md).not.toContain("### 11.");
    expect(md.match(/<details>/g)).toHaveLength(1);
    const fold = md.slice(md.indexOf("<details>"));
    expect(fold).toContain("<summary>The other 3, ranked the same way, text only</summary>");
    for (const n of [1, 2, 3]) expect(fold).toContain(`- **Problem ${n}**`);
    expect(fold).not.toContain("![frame]");
    expect(md.match(/!\[frame\]/g)).toHaveLength(10);
  });

  it("shows all of them, unfolded, when there are ten or fewer", () => {
    const md = page(Array.from({ length: 10 }, (_, i) => item(i + 1, "High")));
    expect(md).toContain("### 10. Problem 10");
    expect(md).not.toContain("<details>");
    expect(md.match(/!\[frame\]/g)).toHaveLength(10);
  });
});

describe("buildReadout — a round with more than ten structural problems (#5845)", () => {
  // The fixture round, copied, with sixteen new structural groups in place of its three, each
  // carrying a frame of its own. Fifteen are single reports (six High, nine Moderate); the last
  // is led by a Low report whose second report is Critical, so ranking by the lead would fold it.
  const round = join(mkdtempSync(join(tmpdir(), "study-readout-round-")), "round");
  cpSync(join(FIX, "round"), round, { recursive: true });
  mkdirSync(join(round, "extra"));
  const frame = join(
    FIX,
    "round/5-sessions/commuter/made-up-house/desktop/t1/run-1/frames/000.jpg",
  );
  const finding = (id: string, severity: string, what: string) => {
    copyFileSync(frame, join(round, "extra", `${id.toLowerCase()}.jpg`));
    return {
      id,
      class: "members",
      member: `m-${id}`,
      level: "structural",
      severity,
      what,
      evidence: [`extra/${id.toLowerCase()}.jpg`],
    };
  };
  const singles = Array.from({ length: 15 }, (_, i) =>
    finding(`S${i + 1}`, i < 6 ? "high" : "moderate", `Single problem ${i + 1}`),
  );
  const pair = [
    finding("L1", "low", "Lead low, second critical"),
    finding("L2", "critical", "The same, worse"),
  ];
  appendFileSync(
    join(round, "findings.jsonl"),
    `${[...singles, ...pair].map((f) => JSON.stringify(f)).join("\n")}\n`,
  );
  const grade = gradeFixture();
  grade.structural.groups = {
    ...Object.fromEntries(singles.map((f) => [f.id, [f.id]])),
    L1: ["L1", "L2"],
  };
  // Graded as the round's own unmatched finds are: new, so a checker's same_as group counts them.
  const unmatched = { voice: null, expert: null, gold: null, score: 0, disputed: false };
  grade.findings.push(
    ...[...singles, ...pair].map(({ id, member, level }) => ({
      ...unmatched,
      id,
      class: "members",
      member,
      level,
      verdict: "unmatched",
    })),
  );
  const { markdown, shots, page } = render([], round, grade);
  const copied = readdirSync(shots);

  it("ranks a group by its worst report, so a Critical behind a Low lead comes first", () => {
    expect(markdown).toContain("### 1. Lead low, second critical");
    expect(markdown).toMatch(/### 1\. Lead low[\s\S]*?· critical · reported 1 more time/);
    expect(markdown.slice(markdown.indexOf("<details>"))).not.toContain("Lead low");
  });

  it("copies frames for the ten shown only, never for a folded one", () => {
    const evidence = copied.filter((f) => f.startsWith("extra-")).sort();
    const shown = ["l1", ...Array.from({ length: 9 }, (_, i) => `s${i + 1}`)];
    expect(evidence).toEqual(shown.map((id) => `extra-${id}.jpg`).sort());
    for (const n of [10, 11, 12, 13, 14, 15]) {
      expect(copied).not.toContain(`extra-s${n}.jpg`);
      expect(markdown).toContain(`- **Single problem ${n}**`);
    }
    // Everything else in the folder is the picture's frames, each one linked from the page.
    for (const f of copied) expect(markdown).toContain(`study-made-up-house/${f}`);
    expect(existsSync(page)).toBe(true);
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
    // Pinned literally (docs/members/study/README.md → "The readout"): comparing against SECTIONS
    // alone would pass on any reorder, since the renderer loops over that same list.
    const planOrder = [
      "A member, stuck",
      "What it found",
      "New structural problems",
      "Your items, one by one",
      "The design battle-test",
      "What members hire this area for",
      "What it missed",
      "One question",
    ];
    expect(SECTIONS).toEqual(planOrder);
    expect(heads).toEqual(planOrder);
  });

  it("opens on the member's worst moment, beside a slot for the owner's own shot", () => {
    expect(markdown).toContain('| tapped "Red rug" |');
    expect(markdown).toContain("_your screenshot goes here (`--owner-shot`)_");
    expect(markdown).toContain("Where did the list go? I was just looking at it.");
  });

  it("states the headline in the plan's words, with its range", () => {
    expect(markdown).toContain(
      "**Found 4 of your 6 without seeing them (2 only partly) · 3 new structural problems · 1 new smaller one.**",
    );
    expect(markdown).toContain("Full matches alone: 2 of 6 (33%).");
    expect(markdown).toContain(
      "Not counted as new: 1 structural already on your key (re-found, not new) · 1 smaller held until a matcher dispute is settled.",
    );
    expect(markdown).toContain("anywhere from 30% to 90% (95% confidence)");
    expect(markdown).toContain("1 of your 7 could not be shown in the test world and was struck");
  });

  it("lists every structural problem, ranked, with its frames, words and one-sentence formula", () => {
    // Critical first; the Moderate member find outranks the expert's 2 of 4 on members reached.
    expect(markdown).toContain(RANKING);
    expect(markdown).toContain(
      "### 1. The answer lives on a page you have to leave the hallway to reach",
    );
    expect(markdown).toContain("### 2. The cellar is only reachable through the garden");
    expect(markdown).toContain("### 3. Two rooms show the same list under different names");
    expect(markdown).not.toContain("### 4.");
    expect(markdown).toContain(
      "- F13: already on your key (B1), so re-found, not new — not counted.",
    );
    // A quote with a newline stays inside its blockquote.
    expect(markdown).toContain('> "Where is the cellar? I checked every door inside."');
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

  it("refuses an owner's screenshot outside the repo, whose link would break once committed", () => {
    expect(() => render(["--owner-shot", join(tmpdir(), "elsewhere.png")])).toThrow(
      /outside .*put it in the repo/,
    );
  });

  it("says the easy-mode check is rough: it counts every session", () => {
    expect(markdown).toContain("Counted over every session, not only the tasks you found hard");
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
