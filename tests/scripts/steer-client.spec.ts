import { createRequire } from "node:module";
import { describe, expect, it } from "@rstest/core";
import { DONE_TRIGGER } from "../../scripts/steer/readback.mjs";
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
type Snap = { exists: boolean; data: () => Record<string, unknown> | undefined };
/** The store's surface the page uses (contract db.d.ts): a doc's get / set / update / onSnapshot
 *  and a collection's get. `update` merges and requires the doc, as the contract's does; every
 *  write reaches the doc's listeners, so a test calling `update` plays the session's ArtifactData
 *  update. */
function store(docs: Docs, { fail = false } = {}) {
  const read = <T>(v: T) => (fail ? Promise.reject(new Error("unreadable")) : Promise.resolve(v));
  const listeners = new Map<string, Set<(s: Snap) => void>>();
  const snap = (path: string): Snap => ({ exists: path in docs, data: () => docs[path] });
  const notify = (path: string) => {
    for (const next of listeners.get(path) ?? []) next(snap(path));
  };
  const subscribed: string[] = [];
  return {
    subscribed,
    doc: (path: string) => ({
      get: () => read(snap(path)),
      set: (body: Record<string, unknown>) => {
        docs[path] = body;
        notify(path);
        return Promise.resolve();
      },
      update: (body: Record<string, unknown>) => {
        if (!(path in docs)) return Promise.reject({ code: "invalid_argument", message: "absent" });
        docs[path] = { ...docs[path], ...body };
        notify(path);
        return Promise.resolve();
      },
      onSnapshot: (next: (s: Snap) => void) => {
        subscribed.push(path);
        const set = listeners.get(path) ?? new Set();
        set.add(next);
        listeners.set(path, set);
        setTimeout(() => next(snap(path)), 0);
        return () => set.delete(next);
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

type Target = { anchor?: unknown; threadId?: string; text: string };
const ANCHOR = { path: "div.bar", x: 10, y: 20 };
/** The comments surface the page uses (contract comments.d.ts): canSendToClaude, anchorFor and
 *  sendToClaude, each call recorded. `send` decides what a send does: resolve, or reject a code. */
function commentsWith({
  can = "available",
  send = () => Promise.resolve({ threadId: "t1", commentId: "c1" }),
}: {
  can?: string;
  send?: (t: Target) => Promise<unknown>;
} = {}) {
  const sent: Target[] = [];
  const anchored: Element[] = [];
  const api = {
    canSendToClaude: () => Promise.resolve(can),
    anchorFor: (el: Element) => {
      anchored.push(el);
      return Promise.resolve(ANCHOR);
    },
    sendToClaude: (t: Target) => {
      sent.push(t);
      return send(t);
    },
  };
  return { api, sent, anchored };
}

const claudeWith = (db: unknown, comments: unknown = null) => ({
  use: (name: string) =>
    name === "db" ? db : Promise.resolve(name === "comments" ? comments : null),
});
const settle = async () => {
  for (let i = 0; i < 10; i++) await new Promise((r) => setTimeout(r, 5));
};

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
  await settle();
  const doc = window.document;
  return {
    doc,
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

// #5135, Eric 2026-10-10: "clicking 'done' with that form doesn't do anything." Done saved doneAt,
// but a saved answer wakes no session, so nothing followed. Done now sends a comment to Claude —
// the platform notifies the session watching the page — and the page shows the read-back the
// session writes on the round's own doc, without a reload. A second press never reopens the round.
const META = `tp/${ROUND}`;
const SENT = "Done — sent to Claude. The read-back shows here when it's posted.";
const NOT_LISTENING =
  "Done — saved. No Claude session is listening right now; the next page reads it back.";
const READ_BACK = {
  readBackAt: "2026-10-10T22:30:00Z",
  readBackBy: "session",
  readBackSummary: "2 picks posted on their issues, 1 build queued",
};

/** A round Eric has opened and answered all but one decision of. */
function answered(meta: Record<string, unknown> = {}): Docs {
  const docs: Docs = { [META]: { openedAt: "2026-10-10T21:30:00Z", taps: [], ...meta } };
  for (const d of fixture().decisions.slice(0, N - 1))
    docs[`tp/${ROUND}/decisions/${d.key}`] = { verdict: "more" };
  return docs;
}
async function openWith(docs: Docs, comments: unknown = commentsWith().api) {
  const db = store(docs);
  const v = await open(claudeWith(Promise.resolve(db), comments));
  const el = (id: string) => v.doc.getElementById(id) as HTMLElement;
  const press = async (id: string) => {
    (el(id) as HTMLButtonElement).click();
    await settle();
  };
  const told = () => (el("told").hidden ? "" : (el("told").textContent ?? ""));
  return { ...v, db, el, press, told };
}

describe("Done tells the Claude session watching the page (#5135)", () => {
  it("sends one comment to Claude, anchored on the Done bar, naming the round and the count", async () => {
    const docs = answered();
    const c = commentsWith();
    const v = await openWith(docs, c.api);
    await v.press("done");
    expect(c.sent).toEqual([
      {
        anchor: ANCHOR,
        text: `Done with steering round ${ROUND}: ${N - 1} of ${N} answered. Read it back.`,
      },
    ]);
    expect(c.anchored.map((e) => e.className)).toEqual(["bar"]);
    expect(c.sent[0]?.text.startsWith(DONE_TRIGGER)).toBe(true);
    expect(typeof docs[META]?.doneAt).toBe("string");
    expect(v.told()).toBe(SENT);
  });

  it("is one way: a second press neither reopens the round nor sends again", async () => {
    const docs = answered();
    const c = commentsWith();
    const v = await openWith(docs, c.api);
    await v.press("done");
    const doneAt = docs[META]?.doneAt;
    await v.press("done");
    expect(docs[META]?.doneAt).toBe(doneAt);
    expect(c.sent).toHaveLength(1);
    const btn = v.el("done");
    expect(btn.getAttribute("aria-pressed")).toBe("true");
    expect(btn.textContent).toBe("Done");
  });

  it("reopens only through its own control, shown once Done is pressed, and tells Claude nothing", async () => {
    const docs = answered();
    const c = commentsWith();
    const v = await openWith(docs, c.api);
    expect(v.el("reopen").hidden).toBe(true);
    await v.press("done");
    expect(v.el("reopen").hidden).toBe(false);
    expect(v.el("reopen").textContent).toBe("Reopen");
    await v.press("reopen");
    expect(docs[META]?.doneAt).toBeNull();
    expect(v.el("done").getAttribute("aria-pressed")).toBe("false");
    expect(v.el("done").textContent).toBe("I'm done");
    expect(v.el("reopen").hidden).toBe(true);
    expect(c.sent).toHaveLength(1);
    // Done again is a fresh press: it tells Claude again.
    await v.press("done");
    expect(c.sent).toHaveLength(2);
  });

  it("hands keyboard focus from a pressed Done to Reopen, and back", async () => {
    const v = await openWith(answered());
    v.el("done").focus();
    await v.press("done");
    expect(v.doc.activeElement?.id).toBe("reopen");
    await v.press("reopen");
    expect(v.doc.activeElement?.id).toBe("done");
  });

  for (const can of ["no_session", "off", "writers_only"]) {
    it(`says the answers are saved and no session is listening when sending reads "${can}"`, async () => {
      const docs = answered();
      const c = commentsWith({ can });
      const v = await openWith(docs, c.api);
      await v.press("done");
      expect(c.sent).toEqual([]);
      expect(typeof docs[META]?.doneAt).toBe("string");
      expect(v.told()).toBe(NOT_LISTENING);
    });
  }

  it("says the same when the send is refused before anything is posted (claude_unavailable)", async () => {
    const c = commentsWith({ send: () => Promise.reject({ code: "claude_unavailable" }) });
    const v = await openWith(answered(), c.api);
    await v.press("done");
    expect(v.told()).toBe(NOT_LISTENING);
  });

  for (const code of ["consent_required", "forbidden", "rate_limited", "upstream_error"]) {
    it(`on ${code}, says the answers are saved and Claude wasn't told, and never retries`, async () => {
      const docs = answered();
      const c = commentsWith({ send: () => Promise.reject({ code, message: "no" }) });
      const v = await openWith(docs, c.api);
      await v.press("done");
      await settle();
      expect(c.sent).toHaveLength(1);
      expect(typeof docs[META]?.doneAt).toBe("string");
      expect(v.told()).toMatch(/^Done — saved, but Claude wasn't told/);
      expect(v.told()).toMatch(/Say “done” in chat/);
    });
  }

  it("with no comments capability, saves Done as before and says this view can't reach Claude", async () => {
    const docs = answered();
    const v = await openWith(docs, null);
    await v.press("done");
    expect(typeof docs[META]?.doneAt).toBe("string");
    expect(v.el("done").getAttribute("aria-pressed")).toBe("true");
    expect(v.told()).toBe(
      "Done — saved. This view can't reach Claude; the next page reads it back.",
    );
  });

  it("saves a note typed just before Done, so the read-back it starts sees it", async () => {
    const docs = answered();
    const v = await openWith(docs);
    const last = fixture().decisions[N - 1];
    const t = v.doc.querySelector<HTMLTextAreaElement>(
      `[data-note][data-sec="decisions"][data-key="${last?.key}"]`,
    );
    if (!(t && v.doc.defaultView)) throw new Error("no note field on the last decision");
    t.value = "keep the row";
    t.dispatchEvent(new v.doc.defaultView.Event("input", { bubbles: true }));
    await v.press("done");
    expect(docs[`tp/${ROUND}/decisions/${last?.key}`]?.note).toBe("keep the row");
  });
});

describe("the read-back shows in the bar without a reload (#5135)", () => {
  it("subscribes once to the round's own doc", async () => {
    const v = await openWith(answered());
    await v.press("done");
    expect(v.db.subscribed).toEqual([META]);
  });

  it("shows the session's read-back line as soon as it lands", async () => {
    const v = await openWith(answered());
    await v.press("done");
    expect(v.told()).toBe(SENT);
    await v.db.doc(META).update({ ...READ_BACK, readBackAt: new Date().toISOString() });
    await settle();
    expect(v.told()).toMatch(/^Read back \S.* · 2 picks posted on their issues, 1 build queued$/);
  });

  it("renders the summary as text, never as markup", async () => {
    const v = await openWith(answered());
    await v.db.doc(META).update({ ...READ_BACK, readBackSummary: "<img src=x onerror=alert(1)>" });
    await settle();
    expect(v.el("told").textContent).toMatch(/· <img src=x onerror=alert\(1\)>$/);
    expect(v.el("told").querySelector("img")).toBeNull();
  });

  it("shows a read-back already on the doc when the page opens after it", async () => {
    const v = await openWith(answered({ doneAt: "2026-10-10T22:21:59Z", ...READ_BACK }));
    expect(v.told()).toMatch(/^Read back .+ · 2 picks posted on their issues, 1 build queued$/);
    expect(v.el("reopen").hidden).toBe(false);
  });

  it("says Done is waiting for its read-back when the page opens after Done and before it", async () => {
    const v = await openWith(answered({ doneAt: "2026-10-10T22:21:59Z" }));
    expect(v.told()).toMatch(/^Done at .+\. The read-back shows here when it's posted\.$/);
  });
});

describe("the page's meta writes keep what the session wrote (#5135)", () => {
  it("presses Done without erasing the read-back fields already on the doc", async () => {
    const docs = answered(READ_BACK);
    const v = await openWith(docs);
    await v.press("done");
    expect(docs[META]).toMatchObject(READ_BACK);
    expect(typeof docs[META]?.doneAt).toBe("string");
  });

  it("keeps a read-back written after the page loaded through a later Reopen", async () => {
    const docs = answered();
    const v = await openWith(docs);
    await v.press("done");
    await v.db.doc(META).update(READ_BACK);
    await settle();
    await v.press("reopen");
    expect(docs[META]).toMatchObject({ ...READ_BACK, doneAt: null });
  });

  it("still creates the round's doc on first open", async () => {
    const docs: Docs = {};
    await openWith(docs);
    expect(docs[META]).toMatchObject({ id: ROUND, doneAt: null });
    expect(typeof docs[META]?.openedAt).toBe("string");
  });
});
