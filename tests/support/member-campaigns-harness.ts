import { mkdirSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { Readable } from "node:stream";
import { afterAll, beforeAll } from "@rstest/core";
import { shelfFileFor } from "../../src/domain/discovery-pass.js";
import { opaqueMemberId } from "../../src/server/feedback-issue.js";

// Shared by tests/server/member-campaigns-*.spec.ts: the fake response, the request builders, the
// members and the hostile research shelf every one of those specs runs against.

export interface Answer {
  status?: number;
  body?: string;
}

export function fakeRes(): { res: ServerResponse; out: Answer } {
  const out: Answer = {};
  const res = {
    writeHead(status: number) {
      out.status = status;
      return res;
    },
    end(body?: string) {
      out.body = body ?? "";
    },
  } as unknown as ServerResponse;
  return { res, out };
}

export function post(body: unknown): IncomingMessage {
  const req = Readable.from([
    typeof body === "string" ? body : JSON.stringify(body),
  ]) as unknown as IncomingMessage;
  req.method = "POST";
  req.headers = { "content-type": "application/json" };
  return req;
}

export function get(): IncomingMessage {
  const req = Readable.from([""]) as unknown as IncomingMessage;
  req.method = "GET";
  req.headers = {};
  return req;
}

export const ada = { email: "ada@example.com", name: "Ada Lovelace" } as never;
export const grace = { email: "grace@example.com", name: "Grace" } as never;
export const ADA = opaqueMemberId("ada@example.com");

export const FORM = {
  title: "Energy for AI",
  anchor: { kind: "sector", id: "Energy" },
  symbols: ["XOM", "CVX"],
  storyline: "Data centres need power; who keeps the windfall?",
  mode: "explore",
};

/**
 * A hostile research shelf (#7446). With no `campaignShelfAnswered` injected, the route reads
 * `docs/research/discovery/` under `process.cwd()`, so a real write-up merging for a subject this
 * spec asks about (gold, RIVN, PLTR…) flipped its `queued`/`joined` answers to `answered`. Every
 * test here runs from a temp root whose shelf already holds those write-ups: a config that forgets
 * the seam reads them and goes red, the same way the live shelf would turn it red later.
 */
const SHELVED = [
  { kind: "market", subject: "gold" },
  { kind: "sector", subject: "Healthcare" },
  { kind: "name", subject: "PLTR" },
  { kind: "name", subject: "RIVN" },
  { kind: "name", subject: "LCID" },
  { kind: "name", subject: "DD" },
  { kind: "name", subject: "PLTR", campaign: "energy-for-ai" },
  { kind: "name", subject: "NVDA", campaign: "ai-buildout" },
  { kind: "name", subject: "AMD", campaign: "ai-buildout" },
] as const;
export function plantHostileShelf(): void {
  let realCwd: string;
  let shelfRoot: string;
  beforeAll(async () => {
    realCwd = process.cwd();
    shelfRoot = await mkdtemp(join(tmpdir(), "skynet-hostile-shelf-"));
    for (const ask of SHELVED) {
      const file = join(shelfRoot, shelfFileFor(ask));
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, "# planted write-up\n");
    }
    process.chdir(shelfRoot);
  });
  afterAll(async () => {
    process.chdir(realCwd);
    await rm(shelfRoot, { recursive: true, force: true });
  });
}
/** The seam every config below injects, so no answer here rides on what the shelf holds. */
export const OFF_SHELF = () => false;
