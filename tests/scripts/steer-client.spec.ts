import { createRequire } from "node:module";
import { describe, expect, it } from "@rstest/core";
import { COMMENTS_COUNT, renderPage } from "../../scripts/steer/render.mjs";
import { fixture, ROUND } from "./steer-fixture";

// #5056, Eric 2026-10-10: "the version in the inline browser shows 0 of 7 answered. I answered 5
// of 7". The desktop app's own browser is not signed in to claude.ai, so the page's store never
// arrives there, and the bar counted this browser's empty copy instead. The store is the only copy
// the read-back reads, so the page never counts anything else: no store → a plain line and locked
// controls; a store still connecting → "loading"; a count only ever from the store.

type Win = Window & typeof globalThis & { claude?: unknown };
const { JSDOM } = createRequire(import.meta.url)("jsdom") as {
  JSDOM: new (
    html: string,
    opts: { runScripts: "dangerously"; beforeParse: (w: Win) => void },
  ) => { window: Win };
};

const page = renderPage(fixture());
const N = fixture().decisions.length;
const NO_STORE = "Answers save only on claude.ai — open this page there to see or change them";

type Docs = Record<string, Record<string, unknown>>;
/** The store's surface the page uses (contract db.d.ts): doc get/set and a collection's get. */
function store(docs: Docs, { fail = false } = {}) {
  const read = <T>(v: T) => (fail ? Promise.reject(new Error("unreadable")) : Promise.resolve(v));
  return {
    doc: (path: string) => ({
      get: () => read({ exists: path in docs, data: () => docs[path] }),
      set: (body: Record<string, unknown>) => {
        docs[path] = body;
        return Promise.resolve();
      },
    }),
    collection: (path: string) => ({
      get: () =>
        read({
          docs: Object.entries(docs)
            .filter(([p]) => p.startsWith(`${path}/`) && !p.slice(path.length + 1).includes("/"))
            .map(([p, v]) => ({ id: p.slice(path.length + 1), data: () => v })),
        }),
    }),
  };
}
const claudeWith = (db: unknown) => ({
  use: (name: string) => (name === "db" ? db : Promise.resolve(null)),
});

/** Open the built page, with or without a `window.claude`, and record every line the bar shows. */
async function open(claude?: unknown) {
  const shown: string[] = [];
  const { window } = new JSDOM(page, {
    runScripts: "dangerously",
    beforeParse(w) {
      if (claude) w.claude = claude;
      new w.MutationObserver((records) => {
        for (const r of records) {
          if ((r.target as Element).id !== "save-state") continue;
          for (const n of r.addedNodes) shown.push(n.textContent ?? "");
        }
      }).observe(w.document, { childList: true, subtree: true });
    },
  });
  for (let i = 0; i < 10; i++) await new Promise((r) => setTimeout(r, 5));
  const doc = window.document;
  return {
    shown,
    line: doc.getElementById("save-state")?.textContent ?? "",
    controls: [
      ...doc.querySelectorAll<HTMLButtonElement | HTMLTextAreaElement>(".rb, [data-note]"),
    ],
    pressed: doc.querySelectorAll('[aria-pressed="true"]').length,
  };
}

describe("a view that can't reach the store never shows a count", () => {
  it("renders no count before the script runs — the bar says it is loading", () => {
    const bar = /<output id="save-state"[^>]*>([^<]*)<\/output>/.exec(page)?.[1];
    expect(bar).toBe("Loading your answers…");
  });

  it("with no window.claude at all (a saved file), says where answers save and locks every control", async () => {
    const v = await open();
    expect(v.line).toBe(NO_STORE);
    expect(v.shown.some((s) => /answered/.test(s))).toBe(false);
    expect(v.controls.length).toBeGreaterThan(N);
    expect(v.controls.every((c) => c.disabled)).toBe(true);
  });

  it("with db null (the desktop app's own browser, not signed in), never renders 0 of N answered", async () => {
    const v = await open(claudeWith(Promise.resolve(null)));
    expect(v.line).toBe(NO_STORE);
    expect(v.shown.join("\n")).not.toContain(`0 of ${N} answered`);
    expect(v.shown.some((s) => /\d+ of \d+ answered/.test(s))).toBe(false);
    expect(v.controls.every((c) => c.disabled)).toBe(true);
    expect(v.pressed).toBe(0);
  });

  it("while the store is still connecting, says it is loading, not 0", async () => {
    const neverAnswers = new Promise(() => undefined);
    const v = await open(claudeWith(neverAnswers));
    expect(v.line).toBe("Loading your answers…");
    expect(v.shown.some((s) => /answered/.test(s))).toBe(false);
  });

  it("when the store is there but can't be read, says so instead of counting a gap", async () => {
    const v = await open(claudeWith(Promise.resolve(store({}, { fail: true }))));
    expect(v.line).toMatch(/Couldn't read your saved answers/);
    expect(v.shown.some((s) => /answered/.test(s))).toBe(false);
    expect(v.controls.every((c) => c.disabled)).toBe(true);
  });
});

describe("a view with the store counts the store's answers", () => {
  it("shows the store's count, and presses what the store holds", async () => {
    const keys = fixture()
      .decisions.map((d) => d.key)
      .slice(0, N - 1);
    const docs: Docs = { [`tp/${ROUND}`]: { openedAt: "2026-10-10T21:30:00Z", taps: [] } };
    for (const k of keys) docs[`tp/${ROUND}/decisions/${k}`] = { verdict: "more" };
    const v = await open(claudeWith(Promise.resolve(store(docs))));
    expect(v.line).toBe(`Saves to this page as you go · ${N - 1} of ${N} answered`);
    expect(v.shown.filter((s) => /answered/.test(s))).toEqual([
      `Saves to this page as you go · ${N - 1} of ${N} answered`,
    ]);
    expect(v.controls.some((c) => !c.disabled)).toBe(true);
    expect(v.pressed).toBeGreaterThan(0);
  });
});

describe("the page says comments count", () => {
  it("carries the intro line under the summary", () => {
    expect(COMMENTS_COUNT).toBe(
      "Comments you send to Claude count too — they're quoted on the issue with your answers.",
    );
    const intro = page.indexOf('id="intro"');
    expect(intro).toBeGreaterThan(page.indexOf("<h1>"));
    expect(page.slice(intro)).toContain(COMMENTS_COUNT);
  });
});
