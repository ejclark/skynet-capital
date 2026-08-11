import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { StoredParticipant } from "../../src/participants/participant-store.js";
import { FileParticipantStore } from "../../src/participants/participant-store.js";

const entry = (id: string): StoredParticipant => ({
  id,
  displayName: id,
  kind: "human",
  credentials: { apiKey: `key-${id}`, apiSecret: `secret-${id}` },
});

function tmpFile(): string {
  return join(mkdtempSync(join(tmpdir(), "pstore-")), "participants.json");
}

describe("FileParticipantStore", () => {
  it("returns [] when the file does not exist", () => {
    expect(new FileParticipantStore(tmpFile()).load()).toEqual([]);
  });

  // Fail closed: a missing secret is a misconfiguration, and the cost of guessing wrong is
  // someone else's credentials readable on disk. The write is refused, never downgraded.
  it("refuses to write, and reports itself insecure, when no secret is set", () => {
    const path = tmpFile();
    const store = new FileParticipantStore(path);

    expect(store.canStoreSecurely()).toBe(false);
    expect(() => store.add(entry("human-a"))).toThrow(/SKYNET_STORE_SECRET/);
    expect(existsSync(path)).toBe(false); // nothing was written at all
  });

  it("reports itself secure when a secret is set", () => {
    expect(new FileParticipantStore(tmpFile(), "s").canStoreSecurely()).toBe(true);
  });

  it("encrypts on disk when a secret is set, and decrypts on load", () => {
    const path = tmpFile();
    const secret = "correct horse battery staple";
    const store = new FileParticipantStore(path, secret);
    store.add(entry("human-b"));

    const onDisk = readFileSync(path, "utf8");
    expect(onDisk).not.toContain("secret-human-b"); // the raw key must not be readable
    expect(JSON.parse(onDisk).enc).toBe(true);

    const loaded = new FileParticipantStore(path, secret).load();
    expect(loaded[0]?.credentials.apiSecret).toBe("secret-human-b");
    rmSync(path, { force: true });
  });

  it("upserts by id and answers has()", () => {
    const path = tmpFile();
    const store = new FileParticipantStore(path, "s");
    store.add(entry("human-c"));
    store.add({ ...entry("human-c"), displayName: "Renamed" });
    expect(store.load()).toHaveLength(1);
    expect(store.load()[0]?.displayName).toBe("Renamed");
    expect(store.has("human-c")).toBe(true);
    expect(store.has("nope")).toBe(false);
    rmSync(path, { force: true });
  });
});
