import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterAll, describe, expect, it } from "@rstest/core";
import type { NeedsYouRow } from "../../scripts/moneypenny/assignments.mjs";
import { designDecisions, designFiles, loadDesigns } from "../../scripts/steer/design.mjs";
import { decisionsFrom, fitBudget, splitByPictures } from "../../scripts/steer/model.mjs";
import { DRAWING, readback } from "../../scripts/steer/readback.mjs";
import { renderPage } from "../../scripts/steer/render.mjs";
import { fixture, NOW, ROUND } from "./steer-fixture";

// #5056 criterion 4: each decision shows Today, then its options, as pictures. Eric, 2026-10-10,
// on a page that asked #2224 and #3977 in words alone: "1 and 2 have no pictures. i'm uncertain
// what I am responding too". Built the way gather.mjs builds it — manifests from `--design`, the
// one selector's rows, splitByPictures, then the budget — with only the GitHub reads replaced.

const dir = mkdtempSync(join(tmpdir(), "steer-pictures-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

/** A manifest on disk with its pictures beside it, as a critique round leaves one. */
function manifest(name: string, body: object, pictures: string[]): string {
  const file = join(dir, name, "manifest.json");
  for (const p of pictures) {
    mkdirSync(dirname(join(dir, name, p)), { recursive: true });
    writeFileSync(join(dir, name, p), "jpg");
  }
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(body));
  return file;
}

const question = (title: string) => ({
  q: 1,
  title,
  rec: "A",
  conf: "medium",
  today: { phone: "img/today.jpg", source: "frames/1.jpg", caption: "What is there now." },
  options: [
    { key: "A", name: "The first shape", phone: "img/a.jpg", delta: "One change." },
    { key: "B", name: "The second shape", phone: "img/b.jpg", delta: "Another." },
  ],
});
const PICS = ["img/today.jpg", "img/a.jpg", "img/b.jpg"];
const profile = manifest(
  "profile",
  { issue: 5037, round: 2, questions: [question("Where does guidance live?")] },
  PICS,
);
const night = manifest(
  "night",
  { issue: 3977, questions: [question("Which night chain ships first?")] },
  PICS,
);

const needsYou: NeedsYouRow[] = [
  { number: 5037, title: "Pick the profile shapes", criterion: 1, why: "w", decision: "Pick" },
  { number: 3977, title: "Night chain plan", criterion: 1, why: "w", decision: "Which first?" },
  { number: 2224, title: "Member text", criterion: 1, why: "w", decision: "Pick shape 4 or 5" },
  {
    number: 4100,
    title: "Cheaper Council replies",
    criterion: 1,
    why: "w",
    decision: "Take replies on a Council line (default: replies on a Council line)",
  },
  {
    number: 4300,
    title: "chore(platter): protected paths",
    criterion: 4,
    why: "held PR unmerged 30h (≥12h)",
    decision: "Merge this held PR, or say what it's waiting on",
  },
];
const issue = (number: number, labels: string[]) => ({
  number,
  title: `issue ${number}`,
  labels: labels.map((name) => ({ name })),
  created_at: "2026-10-01T12:00:00Z",
});
const issues = [
  issue(5037, ["needs-eric"]),
  issue(3977, ["needs-eric", "plan", "ready"]),
  issue(2224, ["needs-eric"]),
  issue(4100, ["needs-eric", "feedback"]),
];
const prs = [issue(4300, ["hold-merge"])];

/** One touch point the way gather.mjs assembles it, from the `--design` argv onward. */
function page(argv: string[], extra: Record<number, ReturnType<typeof designDecisions>> = {}) {
  const design = { ...loadDesigns(designFiles(argv)), ...extra };
  const all = decisionsFrom({ needsYou, issues, prs, design, now: NOW });
  const { pictured, needsPictures } = splitByPictures(all);
  const { shown, deferred, used, minutes } = fitBudget(pictured, 60);
  return fixture({
    decisions: shown,
    deferred,
    needsPictures,
    budget: { minutes, used, shown: shown.length, deferred: deferred.length },
  });
}

const tp = page(["node", "gather.mjs", "--design", profile, "--design", night]);
const html = renderPage(tp, { img: (p) => ("src" in p ? p.src : null) });
const section = (id: string) => {
  const start = html.indexOf(`id="${id}"`);
  return start < 0 ? "" : html.slice(start, html.indexOf("</section>", start));
};

describe("--design takes one manifest per issue", () => {
  it("reads the flag repeated, as a comma list, or both, in order", () => {
    const repeated = designFiles(["--design", profile, "--design", night]);
    expect(repeated).toEqual([profile, night]);
    expect(designFiles(["--out", "x", "--design", `${profile},${night}`])).toEqual(repeated);
  });

  it("still takes the single bare manifest with --design-issue", () => {
    const bare = manifest("bare", [question("A bare round")], PICS);
    expect(Object.keys(loadDesigns([bare], { issue: 2224 }))).toEqual(["2224"]);
  });

  it("refuses two manifests that name no issue, and two that name the same one", () => {
    const one = manifest("bare1", [question("One")], PICS);
    const two = manifest("bare2", [question("Two")], PICS);
    expect(() => loadDesigns([one, two], { issue: 2224 })).toThrow(/name no issue/);
    expect(() => loadDesigns([profile, profile])).toThrow(/two manifests name #5037/);
  });
});

describe("every decision asked on the page shows pictures", () => {
  it("renders both manifests as design decisions: Today first, then options to Build", () => {
    for (const key of ["5037-q1", "3977-q1"]) {
      const s = section(`d-${key}`);
      expect(s).toContain('data-kind="design"');
      expect(s.indexOf('class="opt today"')).toBeLessThan(s.indexOf(`id="d-${key}-A"`));
      expect(s).toContain('data-v="build"');
    }
  });

  it("asks nothing it cannot show: a fork with no manifest gets no section, button or note", () => {
    expect(tp.decisions.map((d) => d.key)).not.toContain("2224");
    expect(section("d-2224")).toBe("");
    expect(html).not.toContain('data-key="2224"');
  });

  it("names it by title in one muted line, and counts it apart in the summary line", () => {
    expect(section("drawing")).toContain(
      "2 decisions are being drawn and come next page: Member text (#2224) · Cheaper Council replies (#4100).",
    );
    // Asked: the two drawn questions and the held PR's link (4 + 4 + 1 minutes).
    expect(html).toContain(
      '<h1>3 decisions, about 9 minutes <span class="muted">· 2 more being drawn</span></h1>',
    );
  });

  it("says so when every decision is still being drawn", () => {
    const none = renderPage({ ...tp, decisions: [], budget: { ...tp.budget, used: 0, shown: 0 } });
    expect(none).toContain("<h1>Nothing to answer yet");
    expect(none).toContain("Every decision this time is still being drawn");
  });

  it("keeps a held PR a link to GitHub — the PR there opens with its own picture", () => {
    const held = section("d-4300");
    expect(held).toMatch(/Open #4300 on GitHub to merge it/);
    expect(held).not.toContain("<button");
  });

  it("keeps a held PR a link even once it is drawn: its options carry no button", () => {
    const drawn = designDecisions([question("What is the platter waiting on?")], {
      issue: 4300,
      at: (p) => `/fixture/${p}`,
    });
    const withPr = page(["--design", profile], { 4300: drawn });
    const out = renderPage(withPr, { img: (p) => ("src" in p ? p.src : null) });
    const at = out.indexOf('id="d-4300-q1"');
    const s = out.slice(at, out.indexOf("</section>", at));
    expect(s).toContain('class="opt today"');
    expect(s).toMatch(/Open #4300 on GitHub to merge it/);
    expect(s).not.toContain("<button");
    const plan = readback(withPr, { [`tp/${ROUND}/decisions/4300-q1`]: { pick: "A", note: "go" } });
    expect(plan.actions.some((a) => a.kind === "issue")).toBe(false);
    expect(plan.rollover.find((r) => r.key === "4300-q1")?.why).toMatch(/irreversible/);
  });
});

describe("the read-back never answers a decision it never asked", () => {
  // A stray record for a key the page never asked must still move nothing.
  const plan = readback(tp, {
    [`tp/${ROUND}/decisions/2224`]: { verdict: "build", note: "Shape 5" },
  });

  it("rolls each one over untouched, saying why", () => {
    for (const key of ["2224", "4100"]) {
      expect(plan.rollover).toContainEqual(expect.objectContaining({ key, why: DRAWING }));
    }
    expect(plan.actions.some((a) => a.issue === 2224 || a.issue === 4100)).toBe(false);
  });

  it("applies no default to an approval that was never shown", () => {
    expect(plan.defaults.map((d) => d.issue)).not.toContain(4100);
  });
});
