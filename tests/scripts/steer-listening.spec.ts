import { afterEach, describe, expect, it, rstest } from "@rstest/core";
import { answered, claudeWith, commentsWith, META, open, openWith } from "./steer-client-harness";

// Eric, 2026-10-13: "is there a way to get a more responsive 'reconnected to session' feedback?"
// A session's page watch drops after hours, and canSendToClaude still answers "available", so the
// page only learned 5 minutes after Done. The session now stamps the round's own doc: `listening`
// after each publish or re-watch, `listening.lost` on a watch-lost notice, `ackAt` when a Done
// reaches it. The bar reads them live. A stamp older than 6 hours says nothing, and the 5-minute
// fallback stays for that case. Glyph and word on every line — never colour alone.

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
// `clock` (page-client.js) prefixes another day's stamp with its weekday, so a 20-minute-old stamp read
// just after midnight is "since Tue 11:51 PM" — the bare-time pattern went red 00:00–06:00 every day (#5332).
const LISTENING = /^● Claude is listening · since (?:[A-Z][a-z]{2} )?\d{1,2}:\d{2}/;
const LOST = "⊘ Claude isn't listening — say “watch my page” in its session";
const ACK = "Claude got your Done, reading back…";
const SENT = "Done — sent to Claude. The read-back shows here when it's posted.";
const UNHEARD =
  "No reply yet: the session that drew this page isn't listening. Open it and say “done” (or “watch my page”).";

type View = Awaited<ReturnType<typeof openWith>>;
const ear = (v: View) => (v.el("ear").hidden ? "" : (v.el("ear").textContent ?? ""));
const stamp = async (v: View, body: Record<string, unknown>) => {
  await v.db.doc(META).update(body);
  await new Promise((r) => setTimeout(r, 5));
};

describe("the bar says whether a Claude session is listening", () => {
  it("shows nothing when the session has never stamped the round", async () => {
    const v = await openWith(answered());
    expect(ear(v)).toBe("");
  });

  it("shows a fresh listening stamp already on the doc, with its local time", async () => {
    const v = await openWith(answered({ listening: { at: ago(20 * MIN), by: "session" } }));
    expect(ear(v)).toMatch(LISTENING);
    expect(v.el("ear").dataset.state).toBe("listening");
  });

  it("shows a stamp the session writes while the page is open, without a reload", async () => {
    const v = await openWith(answered());
    await stamp(v, { listening: { at: ago(0), by: "session" } });
    expect(ear(v)).toMatch(LISTENING);
  });

  it("says at once that Claude isn't listening when the session writes a lost stamp", async () => {
    const v = await openWith(answered({ listening: { at: ago(HOUR), by: "session" } }));
    await stamp(v, { listening: { lost: true, at: ago(0) } });
    expect(ear(v)).toBe(LOST);
    expect(v.el("ear").dataset.state).toBe("lost");
  });

  // `update` merges nested objects (db.d.ts), so a re-watch stamp clears `lost` by writing it false.
  it("goes back to listening when the session re-watches", async () => {
    const v = await openWith(answered({ listening: { lost: true, at: ago(MIN) } }));
    expect(ear(v)).toBe(LOST);
    await stamp(v, { listening: { at: ago(0), by: "session", lost: false } });
    expect(ear(v)).toMatch(LISTENING);
  });

  it("reads a stamp older than 6 hours, listening or lost, as unknown and shows nothing", async () => {
    const old = await openWith(answered({ listening: { at: ago(6 * HOUR + MIN), by: "session" } }));
    expect(ear(old)).toBe("");
    const lost = await openWith(answered({ listening: { lost: true, at: ago(7 * HOUR) } }));
    expect(ear(lost)).toBe("");
  });

  it("reads a stamp it can't parse as unknown", async () => {
    const v = await openWith(answered({ listening: { at: "soon", by: "session" } }));
    expect(ear(v)).toBe("");
    await stamp(v, { listening: "yes" });
    expect(ear(v)).toBe("");
  });

  it("shows nothing once the watch on the round's doc dies — it can no longer tell", async () => {
    const v = await openWith(answered({ listening: { at: ago(MIN), by: "session" } }));
    v.db.kill(META);
    await new Promise((r) => setTimeout(r, 5));
    expect(ear(v)).toBe("");
  });

  it("shows nothing in a view with no store", async () => {
    const v = await open(claudeWith(Promise.resolve(null)));
    expect(v.doc.getElementById("ear")?.hidden).toBe(true);
  });
});

describe("Done says when Claude got it", () => {
  afterEach(() => {
    rstest.useRealTimers();
  });

  it("says Claude got the Done once the session acks it, then shows the read-back", async () => {
    const v = await openWith(answered());
    await v.press("done");
    expect(v.told()).toBe(SENT);
    await stamp(v, { ackAt: new Date(Date.now() + 1000).toISOString() });
    expect(v.told()).toBe(ACK);
    await stamp(v, {
      readBackAt: new Date(Date.now() + 2000).toISOString(),
      readBackSummary: "1 pick posted",
    });
    expect(v.told()).toMatch(/^Read back .+ · 1 pick posted$/);
  });

  it("says at once that the session isn't listening when a lost stamp lands on a waiting Done", async () => {
    const v = await openWith(answered({ listening: { at: ago(HOUR), by: "session" } }));
    await v.press("done");
    expect(v.told()).toBe(SENT);
    await stamp(v, { listening: { lost: true, at: ago(0) } });
    expect(v.told()).toBe(UNHEARD);
    expect(ear(v)).toBe(LOST);
  });

  it("ignores an ack older than this Done", async () => {
    const v = await openWith(answered({ ackAt: "2026-10-10T22:00:00Z" }));
    await v.press("done");
    expect(v.told()).toBe(SENT);
  });

  it("shows the ack on a page opened after it and before the read-back", async () => {
    const v = await openWith(
      answered({ doneAt: "2026-10-10T22:21:59Z", ackAt: "2026-10-10T22:22:10Z" }),
    );
    expect(v.told()).toBe(ACK);
  });

  it("keeps the read-back over an ack when both are newer than the Done", async () => {
    const v = await openWith(
      answered({
        doneAt: "2026-10-10T22:21:59Z",
        ackAt: "2026-10-10T22:22:10Z",
        readBackAt: "2026-10-10T22:25:00Z",
        readBackSummary: "done",
      }),
    );
    expect(v.told()).toMatch(/^Read back .+ · done$/);
  });

  it("drops the five-minute fallback once the ack lands", async () => {
    const v = await openWith(answered());
    rstest.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    v.el("done").click();
    await rstest.advanceTimersByTimeAsync(100);
    await v.db.doc(META).update({ ackAt: new Date(Date.now() + 1000).toISOString() });
    await rstest.advanceTimersByTimeAsync(10 * MIN);
    expect(v.told()).toBe(ACK);
  });

  it("keeps the five-minute fallback when the only stamp is older than 6 hours", async () => {
    const v = await openWith(answered({ listening: { at: ago(8 * HOUR), by: "session" } }));
    rstest.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    v.el("done").click();
    await rstest.advanceTimersByTimeAsync(5 * MIN + 100);
    expect(ear(v)).toBe("");
    expect(v.told()).toBe(UNHEARD);
  });

  it("stops showing a listening stamp once it turns 6 hours old while the page is open", async () => {
    const v = await openWith(answered());
    rstest.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    await v.db.doc(META).update({ listening: { at: ago(6 * HOUR - MIN), by: "session" } });
    await rstest.advanceTimersByTimeAsync(10);
    expect(ear(v)).toMatch(LISTENING);
    await rstest.advanceTimersByTimeAsync(MIN + 10);
    expect(ear(v)).toBe("");
  });
});

describe("the page never writes or erases the session's stamps", () => {
  it("keeps listening and ackAt through Done and Reopen", async () => {
    const stamps = { listening: { at: ago(MIN), by: "session" }, ackAt: ago(2 * MIN) };
    const docs = answered(stamps);
    const v = await openWith(docs, commentsWith().api);
    await v.press("done");
    expect(docs[META]).toMatchObject(stamps);
    await v.press("reopen");
    expect(docs[META]).toMatchObject({ ...stamps, doneAt: null });
  });

  it("keeps a lost stamp the session wrote before the page first opened", async () => {
    const docs = { [META]: { listening: { lost: true, at: ago(MIN) } } };
    const v = await openWith(docs);
    expect(docs[META]).toMatchObject({ listening: { lost: true } });
    expect(typeof (docs[META] as Record<string, unknown>).openedAt).toBe("string");
    expect(ear(v)).toBe(LOST);
  });
});
