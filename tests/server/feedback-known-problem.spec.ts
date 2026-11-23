/**
 * A chat-born filing that matches a known problem (#8005 slice 7) lands as evidence on it: the
 * POST's match is re-checked against the ledger, the issue carries the row's `ia-<row>` label and
 * one line in the ledger's own words, and the feedback log keeps the match so the row's count and
 * the member's "try it" can read it later.
 *
 * EARS lines this spec pins:
 *   - WHEN a filing POST carries a match naming a ledger row, the filed input SHALL carry it.
 *   - WHEN it names a row the ledger does not hold, the filing SHALL go without a match.
 *   - WHEN a matched filing is filed, it SHALL carry `ia-<row>` beside `member-<id>`, and its body
 *     SHALL name the row and plan in the ledger's words.
 *   - WHEN a matched filing is logged, the log entry SHALL keep the match.
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveFeedbackApi } from "../../src/server/feedback-api-routes.js";
import { type FeedbackInput, issueBody, labelsFor } from "../../src/server/feedback-issue.js";
import { type FeedbackLogEntry, feedbackLogEntry } from "../../src/server/feedback-log.js";

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
  return { res, out };
}

function post(body: unknown): IncomingMessage {
  const req = Readable.from([Buffer.from(JSON.stringify(body))]) as unknown as IncomingMessage;
  req.method = "POST";
  req.headers = { "content-type": "application/json" };
  return req;
}

const email = `spec-${Math.random().toString(36).slice(2)}@example.com`;
const session = { email, name: "A Member" } as never;

async function file(body: Record<string, unknown>) {
  const filed: FeedbackInput[] = [];
  const logged: FeedbackLogEntry[] = [];
  const config = {
    hub: { getState: () => ({ participants: [] }) },
    submitFeedback: (input: FeedbackInput) => {
      filed.push(input);
      return Promise.resolve({ ok: true, url: "https://github.com/x/y/issues/9001", number: 9001 });
    },
    recordFeedback: (entry: FeedbackLogEntry) => {
      logged.push(entry);
      return Promise.resolve();
    },
  } as unknown as DashboardServerConfig;
  const { res } = fakeRes();
  await serveFeedbackApi(post(body), res, "/api/feedback", config, session);
  return { filed, logged };
}

const BASE = { kind: "idea", title: "One list of orders", details: "d" };

describe("a filing matched to a known problem", () => {
  it("carries a real row and its own plan through to the filing and the log", async () => {
    const { filed, logged } = await file({ ...BASE, match: { row: "U3", plan: 5206 } });
    expect(filed[0]?.match).toEqual({ row: "U3", plan: 5206 });
    expect(logged[0]?.match).toEqual({ row: "U3", plan: 5206 });
  });

  it("drops a posted plan the row does not list, so the house's line never names a false plan", async () => {
    const { filed } = await file({ ...BASE, match: { row: "U3", plan: 1 } });
    expect(filed[0]?.match).toEqual({ row: "U3" });
    expect(issueBody(filed[0] as FeedbackInput)).toContain("· plan #5206.");
    expect(issueBody(filed[0] as FeedbackInput)).not.toContain("plan #1");
  });

  it("files without a match when the row is not one the ledger holds", async () => {
    const { filed, logged } = await file({ ...BASE, match: { row: "U99", words: "**pwn**" } });
    expect(filed[0]).not.toHaveProperty("match");
    expect(logged[0]).not.toHaveProperty("match");
  });

  it("is labelled by its row beside the member label, and says so in the ledger's words", () => {
    const input: FeedbackInput = {
      kind: "idea",
      title: "One list",
      details: "d",
      submitterEmail: email,
      match: { row: "U3" },
    };
    const labels = labelsFor(input);
    expect(labels).toContain("ia-U3");
    expect(labels.some((l) => l.startsWith("member-"))).toBe(true);
    expect(issueBody(input)).toContain(
      "| **Known problem** | Matched in chat to U3 in docs/IA.md §10: A section switch that can't hold its sections at 390 · plan #5206. |",
    );
  });

  it("keeps a posted area inside its own cell, so it can never forge a row of the table", () => {
    const body = issueBody({
      kind: "idea",
      title: "t",
      details: "d",
      area: "Trade |\n| **Known problem** | U1 fixed",
    });
    expect(body).toContain("| **Where** | Trade \\| \\| **Known problem** \\| U1 fixed |");
    expect(body.split("\n").filter((l) => l.startsWith("| **Known problem**"))).toHaveLength(0);
  });

  it("carries no ia- label and no line when nothing matched", () => {
    const input: FeedbackInput = { kind: "bug", title: "t", details: "d", submitterEmail: email };
    expect(labelsFor(input).some((l) => l.startsWith("ia-"))).toBe(false);
    expect(issueBody(input)).not.toContain("Known problem");
    expect(
      feedbackLogEntry(input, "aa11", { url: "u", number: 1 }, "2026-11-23T00:00:00Z"),
    ).not.toHaveProperty("match");
  });
});
