import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AuthoredPlaySpec } from "../../src/playbooks/authored-play.js";
import { AuthoredPlayStore, authoredPlaysFilePath } from "../../src/server/authored-play-store.js";

const AT = new Date("2026-10-16T12:00:00.000Z");
const LATER = new Date("2026-10-16T13:00:00.000Z");

const spec = (over: Partial<AuthoredPlaySpec> = {}): AuthoredPlaySpec => ({
  slug: "earnings-runup",
  authorAccountId: "futurist",
  authorDisplayName: "Ada",
  symbols: ["AMD"],
  thesis: "long the pre-print drift, out before the dead final week",
  trigger: { kind: "pre-print-window", enterDaysBefore: 20, exitDaysBefore: 6 },
  size: { conservative: 0.01, standard: 0.02, aggressive: 0.03 },
  ...over,
});

describe("AuthoredPlayStore", () => {
  let dir: string;
  let path: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-authored-plays-"));
    path = join(dir, "authored-plays.json");
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("starts empty when no file exists", () => {
    expect(new AuthoredPlayStore(path).load()).toEqual({});
    expect(new AuthoredPlayStore(path).list("member-a")).toEqual([]);
  });

  it("saves a draft, stamping its id, status and dates, and reads it back from disk", () => {
    const store = new AuthoredPlayStore(path);
    const saved = store.save("member-a", "Earnings run-up", spec(), undefined, AT);
    expect(saved).toEqual({
      ok: true,
      record: {
        id: "U-futurist-earnings-runup",
        name: "Earnings run-up",
        status: "draft",
        spec: spec(),
        createdAt: AT.toISOString(),
        updatedAt: AT.toISOString(),
      },
    });
    expect(new AuthoredPlayStore(path).list("member-a")).toHaveLength(1);
  });

  it("refuses a second draft with the same name on the same bot, saying why", () => {
    const store = new AuthoredPlayStore(path);
    store.save("member-a", "Earnings run-up", spec(), undefined, AT);
    const again = store.save("member-a", "Earnings Run-up", spec(), undefined, LATER);
    expect(again).toEqual({
      ok: false,
      reason: 'A playbook named "earnings-runup" already exists on this bot.',
    });
    expect(store.list("member-a")).toHaveLength(1);
  });

  it("the same name on a different bot is a different play", () => {
    const store = new AuthoredPlayStore(path);
    store.save("member-a", "Earnings run-up", spec(), undefined, AT);
    const other = store.save(
      "member-a",
      "Earnings run-up",
      spec({ authorAccountId: "second-bot" }),
      undefined,
      AT,
    );
    expect(other.ok).toBe(true);
    expect(store.list("member-a").map((r) => r.id)).toEqual([
      "U-futurist-earnings-runup",
      "U-second-bot-earnings-runup",
    ]);
  });

  it("Edit replaces the draft in place and keeps when it was first made, even when the name changes", () => {
    const store = new AuthoredPlayStore(path);
    store.save("member-a", "Earnings run-up", spec(), undefined, AT);
    const edited = store.save(
      "member-a",
      "Bigger run-up",
      spec({ slug: "bigger-run-up" }),
      "U-futurist-earnings-runup",
      LATER,
    );
    expect(edited.ok && edited.record).toMatchObject({
      id: "U-futurist-bigger-run-up",
      name: "Bigger run-up",
      createdAt: AT.toISOString(),
      updatedAt: LATER.toISOString(),
    });
    expect(store.list("member-a").map((r) => r.id)).toEqual(["U-futurist-bigger-run-up"]);
  });

  it("Edit can keep its own name without colliding with itself", () => {
    const store = new AuthoredPlayStore(path);
    store.save("member-a", "Earnings run-up", spec(), undefined, AT);
    const same = store.save(
      "member-a",
      "Earnings run-up",
      spec({ thesis: "a newer, sharper reason to hold into the print" }),
      "U-futurist-earnings-runup",
      LATER,
    );
    expect(same.ok).toBe(true);
    expect(store.list("member-a")).toHaveLength(1);
  });

  it("Edit of a draft that is gone is refused, and writes nothing", () => {
    const store = new AuthoredPlayStore(path);
    const edited = store.save("member-a", "Earnings run-up", spec(), "U-futurist-missing", AT);
    expect(edited).toEqual({ ok: false, reason: "That draft is gone, so it can't be changed." });
    expect(store.load()).toEqual({});
  });

  it("one member cannot edit or discard another's draft", () => {
    const store = new AuthoredPlayStore(path);
    store.save("member-a", "Earnings run-up", spec(), undefined, AT);
    const stolen = store.save(
      "member-b",
      "Mine now",
      spec({ slug: "mine-now" }),
      "U-futurist-earnings-runup",
      LATER,
    );
    expect(stolen.ok).toBe(false);
    store.delete("member-b", "U-futurist-earnings-runup");
    expect(store.list("member-a")).toHaveLength(1);
    expect(store.list("member-b")).toEqual([]);
  });

  it("discard removes one draft, dropping the member once they have none", () => {
    const store = new AuthoredPlayStore(path);
    store.save("member-a", "Earnings run-up", spec(), undefined, AT);
    store.delete("member-a", "U-futurist-earnings-runup");
    expect(store.load()).toEqual({});
  });

  describe("the shadow test (#5457 slice 2)", () => {
    const seed = () => {
      const store = new AuthoredPlayStore(path);
      store.save("member-a", "Earnings run-up", spec(), undefined, AT);
      return store;
    };

    it("puts a draft in its test, stamping when it began, and reads it back from disk", () => {
      const store = seed();
      const started = store.setShadow("member-a", "U-futurist-earnings-runup", true, LATER);
      expect(started.ok && started.record).toMatchObject({
        status: "shadow",
        shadowSince: LATER.toISOString(),
        updatedAt: LATER.toISOString(),
        createdAt: AT.toISOString(),
      });
      expect(new AuthoredPlayStore(path).list("member-a")[0]?.status).toBe("shadow");
    });

    it("starting a test already running keeps its stamp: the bots keep the ledger", () => {
      const store = seed();
      store.setShadow("member-a", "U-futurist-earnings-runup", true, AT);
      const again = store.setShadow("member-a", "U-futurist-earnings-runup", true, LATER);
      expect(again.ok && again.record.shadowSince).toBe(AT.toISOString());
    });

    it("taking it out returns the draft, without a stamp; a second test gets a new one", () => {
      const store = seed();
      store.setShadow("member-a", "U-futurist-earnings-runup", true, AT);
      const stopped = store.setShadow("member-a", "U-futurist-earnings-runup", false, LATER);
      expect(stopped.ok && stopped.record).toMatchObject({ status: "draft" });
      expect(stopped.ok && stopped.record).not.toHaveProperty("shadowSince");
      const restarted = store.setShadow("member-a", "U-futurist-earnings-runup", true, LATER);
      expect(restarted.ok && restarted.record.shadowSince).toBe(LATER.toISOString());
    });

    it("editing a play in its test ends the test: a new spec is not the one that was watched", () => {
      const store = seed();
      store.setShadow("member-a", "U-futurist-earnings-runup", true, AT);
      const edited = store.save(
        "member-a",
        "Earnings run-up",
        spec({ thesis: "a newer, sharper reason to hold into the print" }),
        "U-futurist-earnings-runup",
        LATER,
      );
      expect(edited.ok && edited.record.status).toBe("draft");
      expect(edited.ok && edited.record).not.toHaveProperty("shadowSince");
    });

    it("a draft that is gone cannot be tested, and one member cannot test another's", () => {
      const store = seed();
      expect(store.setShadow("member-a", "U-futurist-missing", true)).toEqual({
        ok: false,
        reason: "That draft is gone, so it can't be tested.",
      });
      expect(store.setShadow("member-b", "U-futurist-earnings-runup", true).ok).toBe(false);
      expect(store.list("member-a")[0]?.status).toBe("draft");
    });
  });

  it("a torn file reads as empty and says so once", async () => {
    await writeFile(path, "{not json");
    const heard: string[] = [];
    expect(new AuthoredPlayStore(path, (m) => heard.push(m)).load()).toEqual({});
    expect(heard).toHaveLength(1);
    expect(heard[0]).toContain("authored-plays");
  });

  it("writes plain JSON a person could read", async () => {
    new AuthoredPlayStore(path).save("member-a", "Earnings run-up", spec(), undefined, AT);
    const onDisk = JSON.parse(await readFile(path, "utf8"));
    expect(onDisk["member-a"][0].spec.thesis).toContain("pre-print drift");
  });
});

describe("authoredPlaysFilePath", () => {
  it("sits beside the subscriptions file on the volume, with no new env var", () => {
    expect(
      authoredPlaysFilePath({ SKYNET_SUBSCRIPTIONS_FILE: "/data/playbook-subscriptions.json" }),
    ).toBe("/data/authored-plays.json");
    expect(authoredPlaysFilePath({})).toBe("data/authored-plays.json");
  });
});
