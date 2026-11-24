import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";

import type { Session } from "../../src/server/auth/session.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { opaqueMemberId } from "../../src/server/feedback-issue.js";
import type { FeedbackLogEntry } from "../../src/server/feedback-log.js";
import type { FeedbackInput } from "../../src/server/feedback-service.js";
import { JOURNAL_LIST_LIMIT, serveJournalApi } from "../../src/server/journal-api-routes.js";
import { InMemoryJournalStore } from "../../src/server/journal-memory-store.js";
import { journalNote } from "../../src/server/journal-store.js";

/**
 * #8190's server: a wish files through the feedback path once and is never copied into the
 * journal; a note is saved privately and never filed; both read and write only the session's own
 * member, and refuse without one.
 */

function fakeRes() {
  const out: { status?: number; body?: string } = {};
  const res = {
    writeHead: (status: number) => {
      out.status = status;
      return res;
    },
    end: (body?: string) => {
      out.body = body;
    },
  } as unknown as ServerResponse;
  return { res, out, json: () => JSON.parse(out.body ?? "{}") };
}

function post(body: unknown): IncomingMessage {
  const req = Readable.from([Buffer.from(JSON.stringify(body))]) as unknown as IncomingMessage;
  req.method = "POST";
  req.headers = { "content-type": "application/json" };
  return req;
}

function get(): IncomingMessage {
  return { method: "GET", headers: {} } as unknown as IncomingMessage;
}

/** A fresh email per call keeps the module-level throttles from crossing specs. */
const sessionFor = (name = "Eric Clark"): Session => ({
  email: `spec-${Math.random().toString(36).slice(2)}@example.com`,
  name,
  provider: "google",
  exp: Date.now() + 3_600_000,
});

function wired(over: Partial<Record<keyof DashboardServerConfig, unknown>> = {}) {
  const filed: FeedbackInput[] = [];
  const recorded: FeedbackLogEntry[] = [];
  const journal = new InMemoryJournalStore();
  const config = {
    submitFeedback: (input: FeedbackInput) => {
      filed.push(input);
      return Promise.resolve({ ok: true, url: "https://github.com/x/y/issues/9", number: 9 });
    },
    recordFeedback: (e: FeedbackLogEntry) => {
      recorded.push(e);
      return Promise.resolve();
    },
    journal,
    ...over,
  } as never as DashboardServerConfig;
  return { config, filed, recorded, journal };
}

describe("serveJournalApi", () => {
  it("answers only its own path", async () => {
    const { config } = wired();
    const { res } = fakeRes();
    expect(await serveJournalApi(get(), res, "/api/feedback", config, sessionFor())).toBe(false);
  });

  it("files a wish as an idea in the member's own words, titled from their first sentence", async () => {
    const { config, filed, recorded, journal } = wired();
    const session = sessionFor();
    const { res, out, json } = fakeRes();
    const text = "I wish the chart showed my streak. Every day I check by hand.";
    await serveJournalApi(post({ kind: "wish", text }), res, "/api/journal", config, session);

    expect(out.status).toBe(200);
    expect(json()).toEqual({
      ok: true,
      kind: "wish",
      url: "https://github.com/x/y/issues/9",
      number: 9,
    });
    expect(filed).toEqual([
      {
        kind: "idea",
        title: "I wish the chart showed my streak.",
        details: text,
        source: "journal",
        submitterEmail: session.email,
        submitterName: "Eric Clark",
      },
    ]);
    // Recorded once, in the feedback log, marked as a journal wish — and never in the journal.
    expect(recorded).toHaveLength(1);
    expect(recorded[0]).toMatchObject({
      opaqueMemberId: opaqueMemberId(session.email),
      issueNumber: 9,
      kind: "idea",
      source: "journal",
    });
    expect(await journal.list(opaqueMemberId(session.email))).toEqual([]);
  });

  it("says plainly that a wish was not sent when filing is off, and records nothing", async () => {
    const { config, recorded } = wired({ submitFeedback: undefined });
    const { res, json } = fakeRes();
    await serveJournalApi(
      post({ kind: "wish", text: "x" }),
      res,
      "/api/journal",
      config,
      sessionFor(),
    );

    expect(json()).toMatchObject({ ok: false, error: expect.stringContaining("wasn't sent") });
    expect(recorded).toEqual([]);
  });

  it("says plainly that a wish was not sent when GitHub refuses, and records nothing", async () => {
    const { config, recorded } = wired({
      submitFeedback: () => Promise.resolve({ ok: false, error: "GitHub said no." }),
    });
    const { res, out, json } = fakeRes();
    await serveJournalApi(
      post({ kind: "wish", text: "x" }),
      res,
      "/api/journal",
      config,
      sessionFor(),
    );

    expect(out.status).toBe(502);
    expect(json()).toEqual({ ok: false, error: "Your wish wasn't sent: GitHub said no." });
    expect(recorded).toEqual([]);
  });

  it("holds wishes to the shared filing throttle", async () => {
    const { config, filed } = wired();
    const session = sessionFor();
    let last = fakeRes();
    for (let i = 0; i < 6; i++) {
      last = fakeRes();
      await serveJournalApi(
        post({ kind: "wish", text: `w${i}` }),
        last.res,
        "/api/journal",
        config,
        session,
      );
    }
    expect(filed).toHaveLength(5);
    expect(last.out.status).toBe(429);
  });

  it("saves a note privately, and files, records and sends nothing", async () => {
    const { config, filed, recorded, journal } = wired();
    const session = sessionFor();
    const { res, json } = fakeRes();
    await serveJournalApi(
      post({ kind: "trade", symbol: "spy", whyIn: "Range break", learned: "Size smaller" }),
      res,
      "/api/journal",
      config,
      session,
    );

    expect(json()).toMatchObject({
      ok: true,
      kind: "trade",
      note: { kind: "trade", symbol: "SPY", whyIn: "Range break", learned: "Size smaller" },
    });
    expect(json().note).not.toHaveProperty("opaqueMemberId");
    expect(filed).toEqual([]);
    expect(recorded).toEqual([]);
    const saved = await journal.list(opaqueMemberId(session.email));
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ kind: "trade", symbol: "SPY" });
  });

  it("keys a note by the session, never by an id in the body", async () => {
    const { config, journal } = wired();
    const session = sessionFor();
    const { res } = fakeRes();
    await serveJournalApi(
      post({ kind: "experience", text: "mine", opaqueMemberId: "someone-else" }),
      res,
      "/api/journal",
      config,
      session,
    );
    expect(await journal.list("someone-else")).toEqual([]);
    expect(await journal.list(opaqueMemberId(session.email))).toHaveLength(1);
  });

  it("refuses a note with a reason naming the field", async () => {
    const { config, journal } = wired();
    const session = sessionFor();
    const { res, out, json } = fakeRes();
    await serveJournalApi(
      post({ kind: "trade", symbol: "SPY" }),
      res,
      "/api/journal",
      config,
      session,
    );

    expect(out.status).toBe(400);
    expect(json().error).toContain("why you're in");
    expect(await journal.list(opaqueMemberId(session.email))).toEqual([]);
  });

  it("says a note was not saved when the store write fails", async () => {
    const { config } = wired({
      journal: { append: () => Promise.reject(new Error("disk full")), list: () => [] },
    });
    const { res, out, json } = fakeRes();
    await serveJournalApi(
      post({ kind: "experience", text: "x" }),
      res,
      "/api/journal",
      config,
      sessionFor(),
    );
    expect(out.status).toBe(500);
    expect(json()).toMatchObject({ ok: false, error: expect.stringContaining("wasn't saved") });
  });

  it("returns at most one screen's worth of notes, the newest", async () => {
    const { config, journal } = wired();
    const session = sessionFor();
    const me = opaqueMemberId(session.email);
    for (let i = 0; i < JOURNAL_LIST_LIMIT + 5; i++) {
      await journal.append(journalNote({ kind: "experience", text: `n${i}` }, me, `t${i}`));
    }
    const { res, json } = fakeRes();
    await serveJournalApi(get(), res, "/api/journal", config, session);
    const notes = json().notes as { text: string }[];
    expect(notes).toHaveLength(JOURNAL_LIST_LIMIT);
    expect(notes[0]?.text).toBe(`n${JOURNAL_LIST_LIMIT + 4}`);
  });

  it("says a note was not saved when no store is wired", async () => {
    const { config } = wired({ journal: undefined });
    const { res, json } = fakeRes();
    await serveJournalApi(
      post({ kind: "experience", text: "x" }),
      res,
      "/api/journal",
      config,
      sessionFor(),
    );
    expect(json()).toMatchObject({ ok: false, error: expect.stringContaining("wasn't saved") });
  });

  it("refuses both endpoints without a signed-in session", async () => {
    const { config, filed, journal } = wired();
    const write = fakeRes();
    await serveJournalApi(
      post({ kind: "wish", text: "x" }),
      write.res,
      "/api/journal",
      config,
      undefined,
    );
    expect(write.out.status).toBe(401);
    expect(filed).toEqual([]);

    const read = fakeRes();
    await serveJournalApi(get(), read.res, "/api/journal", config, undefined);
    expect(read.out.status).toBe(401);
    expect(read.json()).toMatchObject({ available: false, notes: [] });
    expect(journal).toBeDefined();
  });

  it("lists only the member's own notes, newest first, without their id", async () => {
    const { config, journal } = wired();
    const session = sessionFor();
    const me = opaqueMemberId(session.email);
    await journal.append(journalNote({ kind: "experience", text: "older" }, me, "2026-11-01"));
    await journal.append(journalNote({ kind: "trade", learned: "newer" }, me, "2026-11-02"));
    await journal.append(
      journalNote({ kind: "experience", text: "theirs" }, "other", "2026-11-03"),
    );
    const { res, out, json } = fakeRes();
    await serveJournalApi(get(), res, "/api/journal", config, session);

    expect(out.status).toBe(200);
    const body = json();
    expect(body).toMatchObject({ available: true, wishesEnabled: true });
    expect(body.notes.map((n: { savedAt: string }) => n.savedAt)).toEqual([
      "2026-11-02",
      "2026-11-01",
    ]);
    expect(body.notes[0]).not.toHaveProperty("opaqueMemberId");
  });
});
