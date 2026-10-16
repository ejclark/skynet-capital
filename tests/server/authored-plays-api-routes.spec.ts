import { mkdtemp, rm } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { runnableSpecs } from "../../src/playbooks/authored-play-draft.js";
import { emptyForm } from "../../src/playbooks/authored-play-form.js";
import { AuthoredPlayStore } from "../../src/server/authored-play-store.js";
import { serveAuthoredPlaysApi } from "../../src/server/authored-plays-api-routes.js";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { opaqueMemberId } from "../../src/server/feedback-issue.js";

/**
 * The authored plays API's contract: identity from the session only, the form judged by the same
 * function the screen runs, a refusal that names the limit and writes nothing, a bot the member owns
 * (a human account cannot run a playbook in Season 1), and a saved play that is a draft and nothing
 * more.
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

function post(body: unknown, contentType = "application/json"): IncomingMessage {
  const req = Readable.from([
    typeof body === "string" ? body : JSON.stringify(body),
  ]) as unknown as IncomingMessage;
  req.method = "POST";
  req.headers = { "content-type": contentType };
  return req;
}

function get(): IncomingMessage {
  const req = Readable.from([""]) as unknown as IncomingMessage;
  req.method = "GET";
  req.headers = {};
  return req;
}

const session = { email: "ada@example.com", name: "Ada Lovelace" } as never;
const other = { email: "grace@example.com", name: "Grace" } as never;
const ME = opaqueMemberId("ada@example.com");

const FORM = {
  ...emptyForm("sauron"),
  name: "My NVDA run-up",
  symbol: "NVDA",
  thesis: "Long the drift into the print, out before the dead final week.",
};

describe("serveAuthoredPlaysApi", () => {
  let dir: string;
  let store: AuthoredPlayStore;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-authored-api-"));
    store = new AuthoredPlayStore(join(dir, "authored-plays.json"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const config = (over: Record<string, unknown> = {}): DashboardServerConfig =>
    ({
      auth: { providerIds: ["google"] },
      resolveOwnerIds: () => ["sauron", "human-ada"],
      authoredPlays: store,
      hub: {
        getState: () => ({
          participants: [
            { id: "sauron", kind: "bot" },
            { id: "human-ada", kind: "human" },
          ],
        }),
      },
      ...over,
    }) as unknown as DashboardServerConfig;

  const call = async (
    path: string,
    req: IncomingMessage,
    cfg = config(),
    who: unknown = session,
  ) => {
    const { res, out } = fakeRes();
    const handled = await serveAuthoredPlaysApi(req, res, path, cfg, who as never);
    return { handled, status: out.status, body: JSON.parse(out.body || "{}") };
  };
  const save = (form: unknown, replaceId?: string, cfg = config(), who: unknown = session) =>
    call("/api/authored-plays/save", post({ form, ...(replaceId ? { replaceId } : {}) }), cfg, who);

  it("claims only its paths, and nothing without a session", async () => {
    const { res } = fakeRes();
    expect(await serveAuthoredPlaysApi(get(), res, "/api/board", config(), session)).toBe(false);
    expect(
      await serveAuthoredPlaysApi(get(), res, "/api/authored-plays", config(), undefined),
    ).toBe(false);
  });

  it("saves a valid form as a draft, credited to the session's own name", async () => {
    const answer = await save(FORM);
    expect(answer.status).toBe(200);
    expect(answer.body.ok).toBe(true);
    expect(answer.body.play).toMatchObject({
      id: "U-sauron-my-nvda-run-up",
      name: "My NVDA run-up",
      status: "draft",
      runsOn: "sauron",
      symbol: "NVDA",
      settings: "buy 20 days before the report, sell 5 before",
    });
    const [kept] = store.list(ME);
    expect(kept?.spec.authorDisplayName).toBe("Ada Lovelace");
  });

  it("a setting outside the strategy's limit is refused with the reason, and nothing is written", async () => {
    const answer = await save({ ...FORM, settings: { enterDaysBefore: 90, exitDaysBefore: 5 } });
    expect(answer.status).toBe(200);
    expect(answer.body.ok).toBe(false);
    expect(answer.body.refusals).toEqual([
      expect.objectContaining({
        field: "enterDaysBefore",
        reason: expect.stringContaining("past the 60 this strategy allows"),
      }),
    ]);
    expect(store.list(ME)).toEqual([]);
  });

  it("a size past the house ceiling is refused the same way", async () => {
    const answer = await save({
      ...FORM,
      sizePercent: { conservative: 1, standard: 2, aggressive: 9 },
    });
    expect(answer.body.refusals[0]).toMatchObject({ field: "size.aggressive" });
    expect(store.list(ME)).toEqual([]);
  });

  it("gives every refusal at once", async () => {
    const answer = await save({ ...FORM, name: "", symbol: "??", thesis: "no" });
    expect(answer.body.refusals.map((r: { field: string }) => r.field).sort()).toEqual([
      "name",
      "symbol",
      "thesis",
    ]);
  });

  it("only a bot the member owns can run it", async () => {
    const stranger = await save({ ...FORM, runsOn: "someone-elses-bot" });
    expect(stranger.body.refusals).toEqual([
      { field: "runsOn", reason: "A playbook can only run on one of your own bots." },
    ]);
    const human = await save({ ...FORM, runsOn: "human-ada" });
    expect(human.body.refusals[0].reason).toContain("A human account can't run a playbook yet");
    expect(store.list(ME)).toEqual([]);
  });

  it("a taken name comes back on the name field", async () => {
    await save(FORM);
    const again = await save(FORM);
    expect(again.body.ok).toBe(false);
    expect(again.body.refusals).toEqual([
      { field: "name", reason: 'A playbook named "my-nvda-run-up" already exists on this bot.' },
    ]);
  });

  it("Edit changes the draft the member names, and only theirs", async () => {
    const first = await save(FORM);
    const edited = await save({ ...FORM, symbol: "AMD" }, first.body.play.id);
    expect(edited.body.play).toMatchObject({ id: first.body.play.id, symbol: "AMD" });
    expect(store.list(ME)).toHaveLength(1);

    const theirs = await save({ ...FORM, name: "Theirs" }, first.body.play.id, config(), other);
    expect(theirs.body.ok).toBe(false);
    expect(store.list(ME)[0]?.spec.symbols).toEqual(["AMD"]);
  });

  it("lists only the signed-in member's own drafts", async () => {
    await save(FORM);
    const mine = await call("/api/authored-plays", get());
    expect(mine.body.plays.map((p: { id: string }) => p.id)).toEqual(["U-sauron-my-nvda-run-up"]);
    const theirs = await call("/api/authored-plays", get(), config(), other);
    expect(theirs.body).toEqual({ plays: [] });
  });

  it("what it saves is a draft: nothing runnable comes out of the store", async () => {
    await save(FORM);
    expect(runnableSpecs(store.list(ME))).toEqual([]);
  });

  it("discards one of the member's own drafts, and cannot reach another member's", async () => {
    await save(FORM);
    await call(
      "/api/authored-plays/delete",
      post({ id: "U-sauron-my-nvda-run-up" }),
      config(),
      other,
    );
    expect(store.list(ME)).toHaveLength(1);
    const gone = await call("/api/authored-plays/delete", post({ id: "U-sauron-my-nvda-run-up" }));
    expect(gone.body).toEqual({ ok: true });
    expect(store.list(ME)).toEqual([]);
  });

  it("a malformed body is a 400, never coerced", async () => {
    expect((await call("/api/authored-plays/save", post({ form: { name: 5 } }))).status).toBe(400);
    expect((await call("/api/authored-plays/save", post("{nope"))).status).toBe(400);
    expect(
      (await call("/api/authored-plays/save", post({ form: FORM, replaceId: 7 }))).status,
    ).toBe(400);
    expect((await call("/api/authored-plays/delete", post({}))).status).toBe(400);
  });

  it("requires application/json on a write", async () => {
    const answer = await call("/api/authored-plays/save", post({ form: FORM }, "text/plain"));
    expect(answer.status).toBe(415);
    expect(store.list(ME)).toEqual([]);
  });

  it("an unwired deployment says so, honestly, and lists nothing", async () => {
    const cfg = config({ authoredPlays: undefined });
    expect((await save(FORM, undefined, cfg)).body).toEqual({
      ok: false,
      error: "Playbook drafts aren't wired in this deployment.",
    });
    expect((await call("/api/authored-plays", get(), cfg)).body).toEqual({ plays: [] });
  });
});
