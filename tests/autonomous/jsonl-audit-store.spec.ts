import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import { JsonlAuditStore } from "../../src/autonomous/jsonl-audit-store.js";

const rec = (personaId: string, at: number): DecisionRecord => ({
  at,
  personaId,
  mode: "observe",
  rawIntents: [{ symbol: "NVDA", side: "buy", quantity: 10, type: "market", reason: "test" }],
  guardedIntents: [{ symbol: "NVDA", side: "buy", quantity: 5, type: "market", reason: "test" }],
  outcomes: [
    {
      intent: { symbol: "NVDA", side: "buy", quantity: 5, type: "market", reason: "test" },
      action: "observed",
    },
  ],
});

describe("JsonlAuditStore", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "audit-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("appends and reads back decision records per persona", async () => {
    const store = new JsonlAuditStore(dir);
    await store.record(rec("day-trader", 1));
    await store.record(rec("day-trader", 2));
    await store.record(rec("banker", 3));

    const dayTrader = await store.list("day-trader");
    expect(dayTrader.map((r) => r.at)).toEqual([1, 2]);
    expect(dayTrader[0]?.outcomes[0]?.action).toBe("observed");

    const all = await store.list();
    expect(all).toHaveLength(3);
  });

  it("returns empty for an unknown persona and an empty dir", async () => {
    const store = new JsonlAuditStore(dir);
    expect(await store.list("nobody")).toEqual([]);
    expect(await store.list()).toEqual([]);
  });

  describe("rotation (#6006) — gzip closed files, delete no history", () => {
    const collect = async <T>(it: AsyncIterable<T>): Promise<T[]> => {
      const out: T[] = [];
      for await (const x of it) out.push(x);
      return out;
    };

    it("past the cap, closes the active file, gzips it in place and starts a fresh one", async () => {
      const line = Buffer.byteLength(`${JSON.stringify(rec("sauron", 1))}\n`);
      const store = new JsonlAuditStore(dir, { rotateAtBytes: line * 2 });
      for (let at = 1; at <= 5; at++) await store.record(rec("sauron", at));

      const names = readdirSync(dir).sort();
      const archives = names.filter((n) => n.endsWith(".jsonl.gz"));
      expect(archives).toHaveLength(2); // [1,2] and [3,4]; 5 is in the fresh active file
      expect(names).toEqual([...archives, "sauron.jsonl"]); // no plain archive, no temp file left
      expect(archives.every((n) => /^sauron\.\d{4}-\d{2}-\d{2}T[\d-]+Z\.jsonl\.gz$/.test(n))).toBe(
        true,
      );
      expect(readFileSync(join(dir, "sauron.jsonl"), "utf8").trim().split("\n")).toHaveLength(1);
    });

    it("list and stream read every record, archives oldest-first then the active file", async () => {
      const store = new JsonlAuditStore(dir, { rotateAtBytes: 1 }); // every append rotates the last
      for (let at = 1; at <= 4; at++) await store.record(rec("sauron", at));
      await store.record(rec("banker", 9));

      expect((await store.list("sauron")).map((r) => r.at)).toEqual([1, 2, 3, 4]);
      expect((await collect(store.stream("sauron"))).map((r) => r.at)).toEqual([1, 2, 3, 4]);
      expect((await store.list()).map((r) => `${r.personaId}:${r.at}`)).toEqual([
        "banker:9",
        "sauron:1",
        "sauron:2",
        "sauron:3",
        "sauron:4",
      ]);
      expect(await collect(store.stream())).toHaveLength(5);
    });

    it("finishes a rotation a crash interrupted — reads a half-done archive once, then gzips it", async () => {
      const stamped = (ms: string) => join(dir, `sauron.2026-10-01T00-00-00-${ms}Z.jsonl`);
      const jsonl = (...ats: number[]) =>
        ats.map((at) => `${JSON.stringify(rec("sauron", at))}\n`).join("");
      writeFileSync(stamped("000"), jsonl(1)); // crashed before gzip started
      writeFileSync(stamped("001"), jsonl(2)); // crashed after the .gz landed, before unlink
      writeFileSync(`${stamped("001")}.gz`, gzipSync(jsonl(2)));
      writeFileSync(join(dir, "sauron.jsonl"), jsonl(3));
      const store = new JsonlAuditStore(dir, { rotateAtBytes: 1 });

      expect((await store.list("sauron")).map((r) => r.at)).toEqual([1, 2, 3]);
      expect((await store.list()).map((r) => r.at)).toEqual([1, 2, 3]);

      await store.record(rec("sauron", 4)); // the next rotation tidies up
      expect(readdirSync(dir).filter((n) => !n.endsWith(".gz"))).toEqual(["sauron.jsonl"]);
      expect((await collect(store.stream("sauron"))).map((r) => r.at)).toEqual([1, 2, 3, 4]);
    });

    it("skips a corrupt archive with a warning instead of failing the read", async () => {
      writeFileSync(join(dir, "sauron.2026-10-01T00-00-00-000Z.jsonl.gz"), "not gzip");
      writeFileSync(join(dir, "sauron.jsonl"), `${JSON.stringify(rec("sauron", 2))}\n`);
      const warn = rstest.spyOn(process, "emitWarning").mockImplementation(() => undefined);
      const store = new JsonlAuditStore(dir);

      expect((await store.list("sauron")).map((r) => r.at)).toEqual([2]);
      expect((await collect(store.stream())).map((r) => r.at)).toEqual([2]);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("unreadable archive"));
      warn.mockRestore();
    });

    it("serializes concurrent appends so none is lost across a rotation", async () => {
      const store = new JsonlAuditStore(dir, { rotateAtBytes: 300 });
      await Promise.all(Array.from({ length: 20 }, (_, i) => store.record(rec("sauron", i + 1))));

      expect((await store.list("sauron")).map((r) => r.at)).toEqual(
        Array.from({ length: 20 }, (_, i) => i + 1),
      );
    });
  });
});
