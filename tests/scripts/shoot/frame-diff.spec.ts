import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compareFrames } from "../../../scripts/shoot/frame-diff.mjs";
import { steady } from "../../../scripts/shoot/steady.mjs";

// A css swap's oracle is "no pixels moved". These pin that it can say no: a moved frame, a missing
// frame and an empty folder are all not a pass, and a frame that moves on its own is named rather
// than hidden. The fake pixel count stands in for Chromium's decoder, so a re-encoded frame (bytes
// differ, pixels do not) can be stated directly.

describe("compareFrames", () => {
  let root: string;
  const pass = (name: string, frames: Record<string, string>) => {
    const dir = join(root, name);
    mkdirSync(dir);
    for (const [frame, bytes] of Object.entries(frames)) writeFileSync(join(dir, frame), bytes);
    return dir;
  };
  // In the fake, a frame's content before a "~" is its pixels, so `a~1` and `a~2` are one image encoded
  // twice.
  const pixelDiff = async (pathA: string, pathB: string) => {
    const pixels = (p: string) => readFileSync(p, "utf8").split("~")[0];
    return { n: pixels(pathA) === pixels(pathB) ? 0 : 45, total: 100 };
  };

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "frame-diff-"));
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it("passes identical frames", async () => {
    const r = await compareFrames({
      before: pass("a", { "x.png": "same", "y.jpg": "same" }),
      after: pass("b", { "x.png": "same", "y.jpg": "same" }),
      pixelDiff,
    });
    expect(r).toMatchObject({ exit: 0, framesCompared: 2, framesThatMoved: 0, missing: [] });
  });

  it("passes a frame whose bytes differ and whose pixels do not", async () => {
    const r = await compareFrames({
      before: pass("a", { "x.jpg": "img~1" }),
      after: pass("b", { "x.jpg": "img~2" }),
      pixelDiff,
    });
    expect(r.exit).toBe(0);
  });

  it("fails a frame that moved, and names it", async () => {
    const r = await compareFrames({
      before: pass("a", { "x.png": "one", "y.png": "same" }),
      after: pass("b", { "x.png": "two", "y.png": "same" }),
      pixelDiff,
    });
    expect(r.exit).toBe(1);
    expect(r.pixelDiffs).toEqual([{ frame: "x.png", n: 45, total: 100 }]);
  });

  it("fails a frame only one pass has", async () => {
    const r = await compareFrames({
      before: pass("a", { "x.png": "same", "y.png": "same" }),
      after: pass("b", { "x.png": "same" }),
      pixelDiff,
    });
    expect(r.exit).toBe(1);
    expect(r.missing).toEqual(["y.png"]);
  });

  it("never passes when nothing was compared", async () => {
    const r = await compareFrames({ before: pass("a", {}), after: pass("b", {}), pixelDiff });
    expect(r.exit).toBe(2);
  });

  describe("with a baseline", () => {
    it("leaves out a frame that moved between two passes of the same build, and names it", async () => {
      const r = await compareFrames({
        before: pass("a", { "x.png": "one", "y.png": "same" }),
        baselines: [pass("a2", { "x.png": "other", "y.png": "same" })],
        after: pass("b", { "x.png": "two", "y.png": "same" }),
        pixelDiff,
      });
      expect(r).toMatchObject({ exit: 0, unstable: ["x.png"], framesJudged: 1 });
    });

    it("still fails a stable frame that moved", async () => {
      const r = await compareFrames({
        before: pass("a", { "x.png": "one", "y.png": "same" }),
        baselines: [pass("a2", { "x.png": "other", "y.png": "same" })],
        after: pass("b", { "x.png": "one", "y.png": "changed" }),
        pixelDiff,
      });
      expect(r.exit).toBe(1);
      expect(r.pixelDiffs.map((p) => p.frame)).toEqual(["y.png"]);
    });

    it("does not count a re-encode as moving on its own", async () => {
      const r = await compareFrames({
        before: pass("a", { "x.jpg": "img~1" }),
        baselines: [pass("a2", { "x.jpg": "img~2" })],
        after: pass("b", { "x.jpg": "changed" }),
        pixelDiff,
      });
      expect(r.exit).toBe(1);
      expect(r.unstable).toEqual([]);
    });

    // Three clean passes of one frame can agree by chance and a fourth still show its other image.
    it("takes a frame as unstable if any baseline shows it moving", async () => {
      const r = await compareFrames({
        before: pass("a", { "x.png": "one", "y.png": "same" }),
        baselines: [
          pass("a2", { "x.png": "one", "y.png": "same" }),
          pass("a3", { "x.png": "other", "y.png": "same" }),
        ],
        after: pass("b", { "x.png": "other", "y.png": "same" }),
        pixelDiff,
      });
      expect(r).toMatchObject({ exit: 0, unstable: ["x.png"], framesJudged: 1 });
    });

    it("never passes when every frame moved on its own", async () => {
      const r = await compareFrames({
        before: pass("a", { "x.png": "one" }),
        baselines: [pass("a2", { "x.png": "other" })],
        after: pass("b", { "x.png": "one" }),
        pixelDiff,
      });
      expect(r.exit).toBe(2);
    });
  });
});

describe("steady", () => {
  const fakeChromium = () => {
    const opened: Array<Record<string, unknown>> = [];
    const shots: Array<Record<string, unknown>> = [];
    const clocks: string[] = [];
    const order: string[] = [];
    const idleFails = { value: false };
    const page = () => ({
      screenshot: async (shot: Record<string, unknown> = {}) => {
        order.push("shot");
        shots.push(shot);
      },
      evaluate: async (_fn: unknown, selectors: string[] = []) => {
        order.push("settled");
        return selectors.slice(0, 1);
      },
      waitForLoadState: async () => {
        order.push("idle");
        if (idleFails.value) throw new Error("Timeout 2000ms exceeded");
      },
      clock: {
        setFixedTime: async (time: Date) => {
          clocks.push(time.toISOString());
        },
      },
    });
    const chromium = {
      launch: async () => ({
        newPage: async (options: Record<string, unknown> = {}) => {
          opened.push(options);
          return page();
        },
        newContext: async (options: Record<string, unknown> = {}) => {
          opened.push(options);
          return { newPage: async () => page() };
        },
      }),
    };
    return { chromium, opened, shots, clocks, order, idleFails };
  };
  const STILL = { type: "png", animations: "disabled", caret: "hide" };

  it("holds a page still and takes a lossless shot, keeping the script's other options", async () => {
    const { chromium, opened, shots } = fakeChromium();
    const browser = await steady(chromium).launch();
    const page = await browser.newPage({ viewport: { width: 390 } });
    await page.screenshot({ path: "x.jpg", type: "jpeg", quality: 62, fullPage: true });
    expect(opened).toEqual([{ viewport: { width: 390 }, reducedMotion: "reduce" }]);
    expect(shots).toEqual([{ path: "x.jpg", fullPage: true, ...STILL }]);
  });

  it("holds a page opened through a context still too", async () => {
    const { chromium, opened, shots } = fakeChromium();
    const browser = await steady(chromium).launch();
    const context = await browser.newContext({ colorScheme: "dark" });
    const page = await context.newPage();
    await page.screenshot({ path: "y.jpg" });
    expect(opened).toEqual([{ colorScheme: "dark", reducedMotion: "reduce" }]);
    expect(shots).toEqual([{ path: "y.jpg", ...STILL }]);
  });

  // A script sends some shots straight to docs/shots/, and a run with the real path rewrites committed
  // pictures. The same name twice keeps both, under one name on every pass.
  it("sends every shot to one folder by basename, wherever the script aimed it", async () => {
    const { chromium, shots } = fakeChromium();
    const page = await (await steady(chromium, { into: "/out" }).launch()).newPage();
    await page.screenshot({ path: "docs/shots/a/x.jpg" });
    await page.screenshot({ path: "docs/shots/b/x.jpg" });
    await page.screenshot({ path: "/tmp/y.png" });
    await page.screenshot();
    expect(shots.map((s) => s.path)).toEqual([
      "/out/x.jpg",
      "/out/x-2.jpg",
      "/out/y.png",
      undefined,
    ]);
  });

  it("counts a shot once when newPage goes through newContext, as Playwright's does", async () => {
    const { chromium, shots } = fakeChromium();
    const launch = chromium.launch;
    chromium.launch = async () => {
      const browser = await launch();
      return {
        ...browser,
        newPage: async function (this: typeof browser, options: Record<string, unknown> = {}) {
          return (await this.newContext(options)).newPage();
        },
      };
    };
    const page = await (await steady(chromium, { into: "/out" }).launch()).newPage();
    await page.screenshot({ path: "x.jpg" });
    expect(shots.map((s) => s.path)).toEqual(["/out/x.jpg"]);
  });

  it("lets the page settle before the shot, and a page that never goes idle still gets one", async () => {
    const { chromium, order, shots, idleFails } = fakeChromium();
    const page = await (await steady(chromium).launch()).newPage();
    await page.screenshot({ path: "x.jpg" });
    expect(order).toEqual(["idle", "settled", "shot"]);

    idleFails.value = true;
    await page.screenshot({ path: "y.jpg" });
    expect(shots).toHaveLength(2);
  });

  it("pins the page's date only when asked", async () => {
    const pinned = fakeChromium();
    await (await steady(pinned.chromium, { clock: "2026-09-28T14:00:00Z" }).launch()).newPage();
    expect(pinned.clocks).toEqual(["2026-09-28T14:00:00.000Z"]);

    const free = fakeChromium();
    await (await steady(free.chromium).launch()).newPage();
    expect(free.clocks).toEqual([]);
  });

  it("reports which selectors matched at each shot, when asked", async () => {
    const { chromium } = fakeChromium();
    const seen: string[][] = [];
    const browser = await steady(chromium, {
      selectors: [".a", ".b"],
      onSeen: (m, frame) => seen.push([frame ?? "", ...m]),
    }).launch();
    await (await browser.newPage()).screenshot({ path: "docs/shots/a/x.jpg" });
    expect(seen).toEqual([["x.jpg", ".a"]]);
  });
});

describe("the one-line commands", () => {
  const { scripts } = JSON.parse(readFileSync("package.json", "utf8"));

  it("runs a shoot through the preload, and a diff through frame-diff", () => {
    expect(scripts["shoot:steady"]).toBe("tsx --import ./scripts/shoot/steady-preload.mjs");
    expect(scripts["shoot:diff"]).toBe("node scripts/shoot/frame-diff.mjs");
  });
});
