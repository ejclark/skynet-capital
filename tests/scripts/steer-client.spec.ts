import { afterEach, describe, expect, it, rstest } from "@rstest/core";
import { designDecisions, designRound } from "../../scripts/steer/design.mjs";
import { DONE_TRIGGER } from "../../scripts/steer/readback.mjs";
import { COMMENTS_COUNT, renderPage } from "../../scripts/steer/render.mjs";
import {
  ANCHOR,
  answered,
  claudeWith,
  commentsWith,
  type Docs,
  META,
  N,
  open,
  openWith,
  page,
  settle,
  store,
} from "./steer-client-harness";
import { fixture, ROUND } from "./steer-fixture";

// #5056, Eric 2026-10-10: "the version in the inline browser shows 0 of 7 answered. I answered 5
// of 7". The desktop app's own browser is not signed in to claude.ai, so the page's store never
// arrives there, and the bar counted this browser's empty copy instead. The store is the only copy
// the read-back reads, so the page never counts anything else: no store → a plain line and locked
// controls; a store still connecting → "loading"; a count only ever from the store.

const NO_STORE = "Answers save only on claude.ai — open this page there to see or change them";

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

// The redesign commons, 2026-10-11: a round-0 pick chooses a problem. Copy as text — the fallback
// he pastes into chat when Done can't reach Claude — must not call it a build.
describe("Copy as text names a round-0 pick as fix first", () => {
  it("writes `fix first B` for a problems question's pick, never `build B`", async () => {
    const pic = (p: string) => ({ phone: p, desk: p });
    const [q] = designDecisions(
      [
        {
          q: 1,
          kind: "problems",
          title: "Which problem should the next round fix first?",
          today: { ...pic("today.jpg"), source: "shots/today.jpg", caption: "Today." },
          options: [
            { key: "A", name: "Rank has no reason", delta: "No why.", ...pic("a.jpg") },
            { key: "B", name: "Bots look like members", delta: "Same rows.", ...pic("b.jpg") },
          ],
        },
      ],
      { issue: 5160, round: 0 },
    );
    const round = designRound({ 5160: q ? [q] : [] });
    const docs: Docs = {
      [`tp/${round.id}`]: { openedAt: "2026-10-11T06:00:00Z", taps: [] },
      [`tp/${round.id}/decisions/5160-q1`]: { pick: "B", react: { A: "not" }, note: "" },
    };
    const written: string[] = [];
    const v = await open(claudeWith(Promise.resolve(store(docs))), renderPage(round), (w) => {
      Object.defineProperty(w.navigator, "clipboard", {
        value: {
          writeText: (t: string) => {
            written.push(t);
            return Promise.resolve();
          },
        },
      });
    });
    v.doc.querySelector<HTMLButtonElement>("#copy")?.click();
    await settle();
    expect(written[0]).toContain(
      "#5160 Which problem should the next round fix first?: fix first B, not A",
    );
    expect(written[0]).not.toContain("build B");
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
const SENT = "Done — sent to Claude. The read-back shows here when it's posted.";
const NOT_LISTENING =
  "Done — saved. No Claude session is listening right now; the next page reads it back.";
const NO_REACH = "Done — saved. This view can't reach Claude; the next page reads it back.";
const RELOAD = "Reload the page to see the read-back once it's posted.";
const READ_BACK = {
  readBackAt: "2026-10-10T22:30:00Z",
  readBackBy: "session",
  readBackSummary: "2 picks posted on their issues, 1 build queued",
};

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

  // Each answer names its own reason (comments.d.ts): only `no_session` is "no session listening".
  for (const [can, line] of [
    ["no_session", NOT_LISTENING],
    ["off", NO_REACH],
    ["writers_only", NO_REACH],
    ["something_new", NO_REACH],
  ] as const) {
    it(`says the answers are saved, and why Claude wasn't told, when sending reads "${can}"`, async () => {
      const docs = answered();
      const c = commentsWith({ can });
      const v = await openWith(docs, c.api);
      await v.press("done");
      expect(c.sent).toEqual([]);
      expect(typeof docs[META]?.doneAt).toBe("string");
      expect(v.told()).toBe(line);
    });
  }

  it("on claude_unavailable (refused before posting, for any of its reasons), says Claude couldn't be reached", async () => {
    const c = commentsWith({ send: () => Promise.reject({ code: "claude_unavailable" }) });
    const v = await openWith(answered(), c.api);
    await v.press("done");
    expect(v.told()).toBe(
      "Done — saved. Claude couldn't be reached just now; the next page reads it back.",
    );
  });

  // A rejected send is not proof nothing was posted (comments.d.ts): only codes that refuse before
  // writing say "wasn't told"; the rest hedge. None is ever retried.
  for (const [code, told] of [
    ["consent_required", "wasn't told"],
    ["forbidden", "wasn't told"],
    ["rate_limited", "wasn't told"],
    ["invalid", "wasn't told"],
    ["upstream_error", "may not have been told"],
    ["unavailable", "may not have been told"],
    ["something_new", "may not have been told"],
  ] as const) {
    it(`on ${code}, says the answers are saved and Claude ${told}, and never retries`, async () => {
      const docs = answered();
      const c = commentsWith({ send: () => Promise.reject({ code, message: "no" }) });
      const v = await openWith(docs, c.api);
      await v.press("done");
      await settle();
      expect(c.sent).toHaveLength(1);
      expect(typeof docs[META]?.doneAt).toBe("string");
      expect(v.told()).toMatch(new RegExp(`^Done — saved, but Claude ${told}:`));
      expect(v.told()).toMatch(/Say “done” in chat/);
    });
  }

  it("says Claude wasn't told when the send never went out (the anchor failed first)", async () => {
    const c = commentsWith({ anchor: () => Promise.reject({ code: "upstream_error" }) });
    const v = await openWith(answered(), c.api);
    await v.press("done");
    expect(c.sent).toEqual([]);
    expect(v.told()).toMatch(/^Done — saved, but Claude wasn't told:/);
  });

  it("says Done didn't save when its write fails, hedged the same way about Claude", async () => {
    const quiet = await openWith(answered(), commentsWith({ can: "no_session" }).api);
    quiet.db.fill();
    await quiet.press("done");
    expect(quiet.told()).toBe(
      "Done didn't save, and Claude wasn't told — use Copy as text and paste it in chat.",
    );
    const c = commentsWith({ send: () => Promise.reject({ code: "upstream_error" }) });
    const v = await openWith(answered(), c.api);
    v.db.fill();
    await v.press("done");
    expect(v.told()).toBe(
      "Done didn't save, and Claude may not have been told — use Copy as text and paste it in chat.",
    );
  });

  it("never sends on load, even for a round already marked Done", async () => {
    const c = commentsWith();
    await openWith(answered({ doneAt: "2026-10-10T22:21:59Z" }), c.api);
    expect(c.sent).toEqual([]);
    expect(c.anchored).toEqual([]);
  });

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

  // A terminal snapshot error (db.d.ts: revoked, resource_exhausted, a dead bridge) ends the watch
  // for good, so the bar stops promising the read-back "shows here" and says a reload shows it.
  it("stops promising a live read-back once the watch dies, and never resubscribes", async () => {
    const v = await openWith(answered());
    await v.press("done");
    expect(v.told()).toBe(SENT);
    v.db.kill(META);
    await settle();
    expect(v.told()).toBe(`Done — sent to Claude. ${RELOAD}`);
    expect(v.db.subscribed).toEqual([META]);
    await v.press("reopen");
    await v.press("done");
    expect(v.told()).toBe(`Done — sent to Claude. ${RELOAD}`);
  });

  it("says the same on a page opened after Done whose watch then dies", async () => {
    const v = await openWith(answered({ doneAt: "2026-10-10T22:21:59Z" }));
    v.db.kill(META, "unavailable");
    await settle();
    expect(v.told()).toMatch(
      /^Done at .+\. Reload the page to see the read-back once it's posted\.$/,
    );
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

// Eric, 2026-10-13: "I've had to click 'done'.. nothing happens then I click reopen/done again".
// A session's page watch drops after hours idle, while the send still reads "available", so Done
// goes into silence. Five minutes after a sent Done with no read-back, the bar says how to wake
// the session. One timer from the press; never a resend.
const UNHEARD =
  "No reply yet: the session that drew this page isn't listening. Open it and say “done” (or “watch my page”).";
const MIN = 60 * 1000;
describe("a sent Done no session answers says so after five minutes", () => {
  afterEach(() => {
    rstest.useRealTimers();
  });
  /** Open on real timers (the store connects), then fake them for the press and the wait. */
  async function pressed(docs: Docs = answered(), c = commentsWith()) {
    const v = await openWith(docs, c.api);
    rstest.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const wait = (ms: number) => rstest.advanceTimersByTimeAsync(ms);
    v.el("done").click();
    await wait(100);
    return { ...v, c, wait };
  }

  it("says the session isn't listening once five minutes pass with no read-back, and never resends", async () => {
    const v = await pressed();
    expect(v.told()).toBe(SENT);
    await v.wait(5 * MIN - 1000);
    expect(v.told()).toBe(SENT);
    await v.wait(1000);
    expect(v.told()).toBe(UNHEARD);
    await v.wait(60 * MIN);
    expect(v.c.sent).toHaveLength(1);
  });

  it("shows the read-back instead when it lands inside the five minutes", async () => {
    const v = await pressed();
    await v.wait(2 * MIN);
    await v.db.doc(META).update({ ...READ_BACK, readBackAt: new Date().toISOString() });
    await v.wait(10 * MIN);
    expect(v.told()).toMatch(/^Read back .+ · 2 picks posted on their issues, 1 build queued$/);
  });

  it("still says so when the only read-back on the doc is older than the Done", async () => {
    const v = await pressed();
    await v.db.doc(META).update(READ_BACK); // 2026-10-10, before this press
    await v.wait(5 * MIN);
    expect(v.told()).toBe(UNHEARD);
  });

  it("drops the timer on Reopen", async () => {
    const v = await pressed();
    v.el("reopen").click();
    await v.wait(10 * MIN);
    expect(v.told()).toBe("Reopened — press Done again when you're finished.");
  });

  it("arms nothing when the send never went out, or the watch can't see a read-back", async () => {
    const quiet = await pressed(answered(), commentsWith({ can: "no_session" }));
    await quiet.wait(10 * MIN);
    expect(quiet.told()).toBe(NOT_LISTENING);
    rstest.useRealTimers();
    const v = await pressed();
    v.db.kill(META);
    await v.wait(10 * MIN);
    expect(v.told()).toBe(`Done — sent to Claude. ${RELOAD}`);
  });
});
