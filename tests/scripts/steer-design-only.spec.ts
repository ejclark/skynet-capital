import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterAll, describe, expect, it } from "@rstest/core";
import {
  DESIGN_SKIP,
  DESIGN_TITLE,
  designRound,
  loadDesigns,
} from "../../scripts/steer/design.mjs";
import { DONE_TRIGGER, ROUND_DRAWING, readback } from "../../scripts/steer/readback.mjs";
import { ROUND_INTRO, renderPage } from "../../scripts/steer/render.mjs";

// #5143 slice 1: a redesign session (docs/process/REDESIGN.md) asks one screen's question on a
// page of its own — the shapes, Eric's pinned comments, one pick, Done — with none of the steering
// page's reel, queue or strip. Built from manifests on disk, through the same CLIs a session runs.

const dir = mkdtempSync(join(tmpdir(), "steer-round-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

/** A manifest on disk with its pictures beside it, as a round's drawing leaves one. */
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

const question = {
  q: 1,
  title: "What leads the trade form at phone width?",
  ask: "Today the chain fills the first screen and the order sentence sits below it.",
  rec: "B",
  conf: "low",
  wrong: "Eric pins a note asking for the chain back on top by 2026-10-17.",
  today: {
    phone: "img/today-phone.jpg",
    desk: "img/today-desk.jpg",
    source: "shots/trade-390.png",
    caption: "Today, real screenshot at 390.",
  },
  options: [
    { key: "A", name: "The chain first", phone: "img/a.jpg", delta: "Nothing moves." },
    { key: "B", name: "The order sentence first", phone: "img/b.jpg", delta: "Sentence on top." },
  ],
};
const PICS = ["img/today-phone.jpg", "img/today-desk.jpg", "img/a.jpg", "img/b.jpg"];
const trade = manifest("trade", { issue: 5150, round: 1, questions: [question] }, PICS);
const NOW = "2026-10-10T22:00:00Z";

const tp = designRound(loadDesigns([trade]), { now: NOW });
const html = renderPage(tp, { img: (p) => ("src" in p ? p.src : null) });

describe("a design round's own page holds only its decisions (#5143)", () => {
  it("names the round from its issue and round, and carries no reel, queue or strip", () => {
    expect(tp.designOnly).toBe(true);
    expect(tp.id).toBe("design-5150-r1");
    expect(tp.title).toBe(DESIGN_TITLE);
    expect(tp.decisions.map((d) => d.key)).toEqual(["5150-q1"]);
    expect(tp.decisions[0]?.skip).toBe(DESIGN_SKIP);
    expect(tp.decisions[0]?.link).toBe("https://github.com/ejclark/skynet-capital/issues/5150");
    expect("reel" in tp || "queue" in tp || "strip" in tp).toBe(false);
  });

  it("renders the header, the decision and the bar, and nothing from the steering page", () => {
    expect(html.startsWith(`<title>${DESIGN_TITLE}</title>`)).toBe(true);
    for (const id of ['id="decisions"', 'id="d-5150-q1"', 'id="d-5150-q1-B"', 'id="done"']) {
      expect(html).toContain(id);
    }
    for (const id of ['id="shipped"', 'id="queue"', 'id="progress"']) {
      expect(html).not.toContain(id);
    }
    expect(html).toContain(ROUND_INTRO);
    expect(html).toContain("Design round 1");
    expect(html).not.toMatch(/Morning page|Evening page/);
  });

  it("shows Today first as a real screenshot, then each option with Build · More · Not", () => {
    const q1 = html.slice(html.indexOf('id="d-5150-q1"'));
    expect(q1.indexOf('class="opt today"')).toBeLessThan(q1.indexOf('id="d-5150-q1-A"'));
    expect(q1).toContain("real screenshot");
    for (const v of ["build", "more", "not"]) expect(q1).toContain(`data-v="${v}"`);
  });

  it("keeps Done telling the watching session, naming this round (#5138)", () => {
    expect(html).toContain("sendToClaude");
    expect(html).toContain(`${DONE_TRIGGER} \${ID}`);
    const data =
      /<script type="application\/json" id="tp-data">([\s\S]*?)<\/script>/.exec(html)?.[1] ?? "";
    expect(JSON.parse(data).id).toBe("design-5150-r1");
  });

  it("takes the round id and name a session gives, and refuses an id the store would not file", () => {
    const named = designRound(loadDesigns([trade]), { id: "trade-r2", title: "Trade redesign" });
    expect(named.id).toBe("trade-r2");
    expect(renderPage(named).startsWith("<title>Trade redesign</title>")).toBe(true);
    expect(() => designRound(loadDesigns([trade]), { id: "trade/r2" })).toThrow(/bad touch point/);
    expect(() => designRound({})).toThrow(/at least one --design manifest/);
  });

  it("asks nothing without a picture: an undrawn decision is named as being drawn", () => {
    const bare = manifest(
      "bare",
      { issue: 5151, questions: [{ q: 1, title: "Where does cash sit?", options: [] }] },
      [],
    );
    const undrawn = designRound(loadDesigns([bare]));
    expect(undrawn.decisions).toEqual([]);
    expect(undrawn.needsPictures.map((d) => d.key)).toEqual(["5151-q1"]);
    const page = renderPage(undrawn);
    expect(page).toContain('id="drawing"');
    expect(page).toContain("Where does cash sit?");
    expect(readback(undrawn, {}).rollover[0]?.why).toBe(ROUND_DRAWING);
  });

  it("holds one round per page: manifests naming two rounds are refused", () => {
    const later = manifest("later", { issue: 5152, round: 2, questions: [question] }, PICS);
    expect(() => designRound(loadDesigns([trade, later]))).toThrow(/one page holds one round/);
  });
});

describe("the CLIs a session runs build the round page with no GitHub reads", () => {
  const out = join(dir, "round");
  const run = (args: string[]) =>
    execFileSync("node", args, {
      encoding: "utf8",
      env: { ...process.env, GH_TOKEN: "", GITHUB_TOKEN: "" },
    });

  it("gather --design-only writes the round's tp.json", () => {
    const said = run([
      "scripts/steer/gather.mjs",
      "--design-only",
      "--design",
      trade,
      "--out",
      out,
      "--now",
      NOW,
      "--title",
      "Trade redesign",
    ]);
    expect(said).toMatch(/design round design-5150-r1 · 1 decision\(s\)/);
    const written = JSON.parse(readFileSync(join(out, "tp.json"), "utf8"));
    expect(written.designOnly).toBe(true);
    expect(written.title).toBe("Trade redesign");
    expect(written.decisions.map((d: { key: string }) => d.key)).toEqual(["5150-q1"]);
  });

  it("build turns it into the page and the round's pictures, nothing else", () => {
    run(["scripts/steer/build.mjs", join(out, "tp.json")]);
    expect(existsSync(join(out, "steer.html"))).toBe(true);
    const files = Object.keys(JSON.parse(readFileSync(join(out, "files.json"), "utf8")));
    expect(files).toHaveLength(4);
    expect(files.every((f) => f.startsWith("img/5150-q1/"))).toBe(true);
  });
});

describe("the read-back of a round page (docs/process/REDESIGN.md step f)", () => {
  const records = {
    [`tp/${tp.id}`]: { openedAt: NOW, doneAt: "2026-10-10T22:10:00Z", taps: [0, 60_000] },
    [`tp/${tp.id}/decisions/5150-q1`]: { pick: "B", react: { A: "not" }, note: "" },
  };
  const comments = [
    { anchorKey: "#d-5150-q1-B", text: "move the strike under the ticker", at: NOW },
    { anchorKey: "save-bar", text: `${DONE_TRIGGER} ${tp.id}: 1 of 1 answered.`, at: NOW },
  ];
  const plan = readback(tp, records, comments);

  it("quotes his pinned comment on the issue and drops the Done trigger", () => {
    const comment = plan.actions.filter((a) => a.kind === "comment").find((a) => a.issue === 5150);
    expect(comment?.body).toContain("> move the strike under the ticker");
    expect(comment?.body).not.toContain(DONE_TRIGGER);
    expect(plan.unplacedComments).toEqual([]);
  });

  it("files a Build pick as a feedback build, and reads no queue or reel it never had", () => {
    const filed = plan.actions.filter((a) => a.kind === "issue");
    expect(filed).toHaveLength(1);
    expect(filed[0]?.labels).toEqual(["feedback", "ready"]);
    expect(filed[0]?.title).toContain("The order sentence first");
    expect(plan.done).toBe(true);
  });
});
