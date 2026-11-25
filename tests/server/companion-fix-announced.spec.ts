/**
 * "Told once" means once (#8078). Moneypenny announces a shipped fix for something the member
 * filed (#8005 slice 7), and the server records that she did — the transcript cannot, because
 * the client resends only the last ten lines of one thread, so her announcement ages out within
 * about five exchanges and a new thread never had it. Proven at the route, the way the post-merge
 * audit's repro drove it: the real `serveCompanionApi`, a fake turn that captures the context.
 *
 * EARS lines this spec pins:
 *   - WHEN a turn that carried the announce instruction completes, the server SHALL record the
 *     filings it named, and no later turn — any thread, any length — SHALL carry the instruction
 *     for them again.
 *   - WHILE a fix has been announced, the context SHALL still tell her it shipped, so she can
 *     answer if asked.
 *   - WHEN a turn fails, nothing SHALL be recorded, so the next turn still announces.
 *   - WHEN more fixes are waiting than one reply names, the next turn SHALL name the rest.
 */
import { mkdtempSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import type { CompanionTurn } from "../../src/companion/companion-chat.js";
import type { FeedbackStatus } from "../../src/domain/feedback-status.js";
import { serveCompanionApi } from "../../src/server/companion-routes.js";
import { opaqueMemberId } from "../../src/server/feedback-issue.js";
import type { FeedbackLogEntry } from "../../src/server/feedback-log.js";
import { FixAnnouncementStore } from "../../src/server/fix-announcement-store.js";

const email = `spec-${Math.random().toString(36).slice(2)}@example.com`;
const session = { email, name: "A Member" } as never;
const ANNOUNCE = "open your reply by telling them gladly";

function fakeRes() {
  const res = {
    writeHead: () => res,
    write: () => true,
    end: () => undefined,
    once: () => res,
  } as unknown as ServerResponse;
  return res;
}

function post(body: unknown): IncomingMessage {
  const req = Readable.from([Buffer.from(JSON.stringify(body))]) as unknown as IncomingMessage;
  req.method = "POST";
  req.headers = { "content-type": "application/json" };
  return req;
}

const entry = (issueNumber: number, filedAt: string): FeedbackLogEntry => ({
  uuid: `u${issueNumber}`,
  opaqueMemberId: opaqueMemberId(email),
  issueNumber,
  url: `https://github.com/x/y/issues/${issueNumber}`,
  kind: "idea",
  title: `Filing ${issueNumber}`,
  filedAt,
  match: { row: "U3" },
});

const shipped = (numbers: readonly number[]) =>
  Promise.resolve(
    new Map<number, FeedbackStatus>(numbers.map((n) => [n, n === 5206 ? "shipped" : "open"])),
  );

function harness(filings: readonly FeedbackLogEntry[]) {
  const store = new FixAnnouncementStore(
    join(mkdtempSync(join(tmpdir(), "fix-announced-")), "fix-announcements.json"),
  );
  let fail = false;
  const contexts: string[] = [];
  const companion: CompanionTurn = (input, handlers) => {
    contexts.push(input.context ?? "");
    if (fail) handlers.onError("the model is down");
    else handlers.onDone();
    return Promise.resolve();
  };
  const config = {
    hub: { getState: () => ({ participants: [] }) },
    companion,
    readFeedback: () => Promise.resolve(filings),
    fetchFeedbackStatus: shipped,
    // "Try it" reads built plans, not badge statuses (#8077): plan 5206 was built.
    fetchBuiltPlans: (plans: readonly number[]) =>
      Promise.resolve(new Set(plans.filter((n) => n === 5206))),
    fixAnnouncements: store,
  } as never;
  const turn = async (content = "hi") => {
    await serveCompanionApi(
      post({ messages: [{ role: "user", content }] }),
      fakeRes(),
      "/api/companion/chat",
      config,
      session,
    );
    return contexts.at(-1) ?? "";
  };
  return { turn, store, failNext: (on: boolean) => (fail = on) };
}

describe("Moneypenny announces a shipped fix once", () => {
  it("announces on the first turn, then never again — even in a fresh thread", async () => {
    const { turn } = harness([entry(9001, "2026-11-20T00:00:00Z")]);
    const first = await turn();
    expect(first).toContain(ANNOUNCE);
    expect(first).toContain("#9001");
    // Every later request carries a one-line thread (a new side thread, a cleared chat, a
    // second device): the instruction must not come back.
    for (let i = 0; i < 12; i++) {
      const later = await turn();
      expect(later).not.toContain(ANNOUNCE);
      // …but she still knows it shipped, should they ask.
      expect(later).toContain("#9001");
      expect(later).toContain("already told them");
    }
  });

  it("records nothing when the turn fails, so the next one still announces", async () => {
    const { turn, failNext, store } = harness([entry(9001, "2026-11-20T00:00:00Z")]);
    failNext(true);
    expect(await turn()).toContain(ANNOUNCE);
    expect(store.announced(opaqueMemberId(email)).size).toBe(0);
    failNext(false);
    expect(await turn()).toContain(ANNOUNCE);
    expect([...store.announced(opaqueMemberId(email))]).toEqual([9001]);
  });

  it("names a third fix on the next turn instead of the same two forever", async () => {
    const { turn } = harness([
      entry(9001, "2026-11-18T00:00:00Z"),
      entry(9002, "2026-11-19T00:00:00Z"),
      entry(9003, "2026-11-20T00:00:00Z"),
    ]);
    const first = await turn();
    const announcedFirst = [9001, 9002, 9003].filter((n) =>
      first.split("\n").some((l) => l.includes(ANNOUNCE) && l.includes(`#${n} `)),
    );
    expect(announcedFirst).toHaveLength(2);
    const second = await turn();
    const rest = [9001, 9002, 9003].filter((n) => !announcedFirst.includes(n));
    const line = second.split("\n").find((l) => l.includes(ANNOUNCE)) ?? "";
    expect(line).toContain(`#${rest[0]} `);
    for (const n of announcedFirst) expect(line).not.toContain(`#${n} `);
    expect(await turn()).not.toContain(ANNOUNCE);
  });
});

describe("the announcement store", () => {
  it("keeps each member's record apart and ignores repeats", () => {
    const store = new FixAnnouncementStore(
      join(mkdtempSync(join(tmpdir(), "fix-announced-")), "fix-announcements.json"),
    );
    expect(store.record("a", [1, 2])).toBe(true);
    expect(store.record("a", [2, 3])).toBe(true);
    expect(store.record("b", [9])).toBe(true);
    expect([...store.announced("a")]).toEqual([1, 2, 3]);
    expect([...store.announced("b")]).toEqual([9]);
    expect(store.announced("nobody").size).toBe(0);
    expect(store.announced("__proto__").size).toBe(0);
  });
});
