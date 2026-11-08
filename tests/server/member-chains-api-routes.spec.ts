import { readdirSync, readFileSync, statSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { parseChainForm } from "../../src/playbooks/chain-form.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { opaqueMemberId } from "../../src/server/feedback-issue.js";
import { MAX_CHAINS_PER_MEMBER, MemberChainStore } from "../../src/server/member-chain-store.js";
import { serveMemberChainsApi } from "../../src/server/member-chains-api-routes.js";

/**
 * A member's own chains (#6959 slice 3b): WHEN a member saves the chain form, the server SHALL run
 * it through `chainFromForm` (the function the screen runs), store it with the member as its only
 * reader, and refuse every pick the form refuses, under the link it belongs to. A saved chain is
 * shadow only: nothing that trades reads the store (criterion 5).
 */

interface Answer {
  status?: number;
  body?: string;
}

function fakeRes(): { res: ServerResponse; out: Answer } {
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

function post(body: unknown): IncomingMessage {
  const req = Readable.from([JSON.stringify(body)]) as unknown as IncomingMessage;
  req.method = "POST";
  req.headers = { "content-type": "application/json" };
  return req;
}

function get(): IncomingMessage {
  const req = Readable.from([""]) as unknown as IncomingMessage;
  req.method = "GET";
  req.headers = {};
  return req;
}

const ada = { email: "ada@example.com", name: "Ada Lovelace" } as never;
const grace = { email: "grace@example.com", name: "Grace" } as never;
const ADA = opaqueMemberId("ada@example.com");

/** Eric's AI-dip view: sell a CRWV put; if it expires, the long call takes the freed cash. */
const FORM = {
  title: "Sell a CRWV put, then a call",
  links: [{ from: "CRWV-WHEEL", on: "expired", date: "", to: "CRWV-LONG-CALL" }],
};

describe("serveMemberChainsApi", () => {
  let dir: string;
  let store: MemberChainStore;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-member-chains-"));
    store = new MemberChainStore(join(dir, "member-chains.json"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const config = (over: Record<string, unknown> = {}): DashboardServerConfig =>
    ({ memberChains: store, ...over }) as unknown as DashboardServerConfig;
  const call = async (path: string, req: IncomingMessage, who: unknown = ada, cfg = config()) => {
    const { res, out } = fakeRes();
    const handled = await serveMemberChainsApi(req, res, path, cfg, who as never);
    return { handled, status: out.status, body: JSON.parse(out.body || "{}") };
  };
  const save = (form: unknown, who: unknown = ada, replaceId?: string) =>
    call("/api/playbook-chains/save", post({ form, ...(replaceId ? { replaceId } : {}) }), who);
  const list = (who: unknown = ada) => call("/api/playbook-chains", get(), who);

  it("claims only its paths, and nothing without a session", async () => {
    const { res } = fakeRes();
    expect(await serveMemberChainsApi(get(), res, "/api/board", config(), ada)).toBe(false);
    expect(
      await serveMemberChainsApi(get(), res, "/api/playbook-chains", config(), undefined),
    ).toBe(false);
  });

  it("saves a sound form as the session's own chain, credited to the session", async () => {
    const answer = await save(FORM);
    expect(answer.body).toMatchObject({
      ok: true,
      chain: { id: "sell-a-crwv-put-then-a-call", title: FORM.title, form: FORM },
    });
    expect(store.list(ADA)[0]?.chain.source).toBe("Ada Lovelace");
  });

  it("attaches the replay scorecard to a chain whose links were replayed, and only to that one", async () => {
    await save(FORM);
    const [mine] = (await list()).body.chains;
    expect(mine.scorecard).toMatchObject({ symbol: "CRWV" });
    expect(mine.scorecard.links.map((l: { playbook: string }) => l.playbook)).toEqual([
      "CRWV-WHEEL",
      "CRWV-LONG-CALL",
    ]);
    await save({
      title: "Take the call's profit, then sell a put",
      links: [{ from: "CRWV-LONG-CALL", on: "take-profit", date: "", to: "CRWV-WHEEL" }],
    });
    const other = (await list()).body.chains.find(
      (c: { title: string }) => c.title === "Take the call's profit, then sell a put",
    );
    expect(other).toBeDefined();
    expect(other.scorecard).toBeUndefined();
  });

  it("returns a chain to its author and to nobody else", async () => {
    await save(FORM);
    expect((await list()).body.chains).toHaveLength(1);
    expect((await list(grace)).body.chains).toEqual([]);
  });

  it("refuses a handoff the next playbook can't hold, under its link, and writes nothing", async () => {
    const answer = await save({
      title: "Assigned shares to a call",
      links: [{ from: "CRWV-WHEEL", on: "assigned", date: "", to: "CRWV-LONG-CALL" }],
    });
    expect(answer.body.ok).toBe(false);
    expect(answer.body.refusals).toEqual([
      { field: "link.0", reason: expect.stringContaining("can't manage shares") },
    ]);
    expect(store.list(ADA)).toEqual([]);
  });

  it("refuses a blank link and a missing name, all at once", async () => {
    const answer = await save({
      title: "",
      links: [{ from: "CRWV-WHEEL", on: "", date: "", to: "" }],
    });
    expect(answer.body.refusals.map((r: { field: string }) => r.field)).toEqual([
      "title",
      "link.0",
    ]);
  });

  it("takes no free-form condition: an event off the menu is a malformed body", async () => {
    const answer = await save({
      ...FORM,
      links: [{ from: "CRWV-WHEEL", on: "price-below-100", date: "", to: "CRWV-LONG-CALL" }],
    });
    expect(answer.status).toBe(400);
    expect(store.list(ADA)).toEqual([]);
  });

  it("refuses a second chain with the same name, and Edit swaps the one it names", async () => {
    await save(FORM);
    const again = await save(FORM);
    expect(again.body.refusals).toEqual([
      { field: "title", reason: "You already have a chain with that name." },
    ]);
    const edited = await save(
      { ...FORM, title: "A better name" },
      ada,
      "sell-a-crwv-put-then-a-call",
    );
    expect(edited.body.ok).toBe(true);
    expect(store.list(ADA).map((r) => r.chain.id)).toEqual(["a-better-name"]);
    const gone = await save(FORM, ada, "no-such-chain");
    expect(gone.body.refusals[0].reason).toMatch(/gone/);
  });

  it("keeps at most the per-member cap", async () => {
    for (let i = 0; i < MAX_CHAINS_PER_MEMBER; i++) {
      expect((await save({ ...FORM, title: `Chain number ${i}` })).body.ok).toBe(true);
    }
    const over = await save({ ...FORM, title: "One too many" });
    expect(over.body.ok).toBe(false);
  });

  it("discards only the author's own chain", async () => {
    await save(FORM);
    await call("/api/playbook-chains/delete", post({ id: "sell-a-crwv-put-then-a-call" }), grace);
    expect(store.list(ADA)).toHaveLength(1);
    await call("/api/playbook-chains/delete", post({ id: "sell-a-crwv-put-then-a-call" }));
    expect(store.list(ADA)).toEqual([]);
  });

  it("says so, and writes nothing, when the store isn't wired", async () => {
    const answer = await call(
      "/api/playbook-chains/save",
      post({ form: FORM }),
      ada,
      config({ memberChains: undefined }),
    );
    expect(answer.body).toEqual({ ok: false, error: "Chains aren't wired in this deployment." });
  });

  it("drops a hand-edited record the form would refuse when the file is read", async () => {
    await save(FORM);
    const bad = new MemberChainStore(join(dir, "member-chains.json"));
    const record = bad.list(ADA)[0];
    expect(record).toBeDefined();
    const { writeFileSync } = await import("node:fs");
    writeFileSync(
      join(dir, "member-chains.json"),
      JSON.stringify({
        [ADA]: [
          {
            ...record,
            chain: {
              ...record?.chain,
              links: [{ from: "CRWV-WHEEL", on: { kind: "assigned" }, to: "CRWV-LONG-CALL" }],
            },
          },
        ],
      }),
    );
    expect(new MemberChainStore(join(dir, "member-chains.json")).list(ADA)).toEqual([]);
  });
});

describe("parseChainForm", () => {
  it("reads the shape and nothing more", () => {
    expect(parseChainForm(FORM)).toEqual(FORM);
    expect(parseChainForm(null)).toBeUndefined();
    expect(parseChainForm({ title: 3, links: [] })).toBeUndefined();
    expect(parseChainForm({ title: "x", links: new Array(7).fill(FORM.links[0]) })).toBeUndefined();
    expect(
      parseChainForm({ title: "x", links: [{ ...FORM.links[0], extra: 1, on: "later" }] }),
    ).toBeUndefined();
  });
});

describe("a saved chain is shadow only", () => {
  /** Every ts file under the code that trades or hands a bot its roster. */
  const TRADING_CODE = ["src/engine", "src/autonomous", "src/trading", "src/playbooks"];
  const filesUnder = (root: string): string[] =>
    readdirSync(root).flatMap((name) => {
      const path = join(root, name);
      return statSync(path).isDirectory() ? filesUnder(path) : path.endsWith(".ts") ? [path] : [];
    });

  it("is read by no code that trades or builds a roster", () => {
    const readers = TRADING_CODE.flatMap(filesUnder).filter((file) =>
      /member-chain-store|member-chains-api/.test(readFileSync(file, "utf8")),
    );
    expect(readers).toEqual([]);
  });
});
