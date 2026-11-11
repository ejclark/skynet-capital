import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BookWaitStore, createBookWaitStore } from "../../src/server/book-wait-store.js";

/**
 * #4608 slice 1: one wait per account, in one JSON file beside the subscriptions file. Reads are
 * total; a write refuses rather than rewrite a file it could only read in part.
 */

let dir: string;
let path: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "book-waits-"));
  path = join(dir, "book-waits.json");
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const cpi = { reopensOn: "2026-11-20", reason: "CPI first", setAt: "2026-11-10T15:00:00.000Z" };
const fomc = {
  reopensOn: "2026-12-10",
  reason: "after the Fed",
  setAt: "2026-11-11T15:00:00.000Z",
};

describe("BookWaitStore", () => {
  it("reads back each account's wait, and nothing for an account without one", () => {
    const store = new BookWaitStore(path);
    expect(store.set("ann-1", cpi)).toBe(true);
    expect(store.set("bob-1", fomc)).toBe(true);
    const again = new BookWaitStore(path);
    expect(again.wait("ann-1")).toEqual(cpi);
    expect(again.wait("bob-1")).toEqual(fomc);
    expect(again.wait("cat-1")).toBeUndefined();
  });

  it("replaces an account's wait — one standing call per book", () => {
    const store = new BookWaitStore(path);
    store.set("ann-1", cpi);
    store.set("ann-1", fomc);
    expect(new BookWaitStore(path).wait("ann-1")).toEqual(fomc);
  });

  it("clears one account's wait and leaves the others", () => {
    const store = new BookWaitStore(path);
    store.set("ann-1", cpi);
    store.set("bob-1", fomc);
    expect(store.clear("ann-1")).toBe(true);
    expect(store.clear("ann-1")).toBe(true);
    expect(store.wait("ann-1")).toBeUndefined();
    expect(store.wait("bob-1")).toEqual(fomc);
  });

  it("drops a stored row with no reopen day or no reason, keeping the good ones", () => {
    writeFileSync(
      path,
      JSON.stringify({
        "ann-1": cpi,
        "bob-1": { reason: "open-ended", setAt: cpi.setAt },
        "cat-1": { reopensOn: "2026-11-20", reason: "", setAt: cpi.setAt },
      }),
    );
    const store = new BookWaitStore(path);
    expect(store.wait("ann-1")).toEqual(cpi);
    expect(store.wait("bob-1")).toBeUndefined();
    expect(store.wait("cat-1")).toBeUndefined();
  });

  it("never mistakes an Object.prototype name for a stored wait", () => {
    const store = new BookWaitStore(path);
    store.set("ann-1", cpi);
    for (const id of ["constructor", "toString", "__proto__", "hasOwnProperty"]) {
      expect(store.wait(id)).toBeUndefined();
    }
    expect(store.clear("constructor")).toBe(true);
    expect(store.wait("ann-1")).toEqual(cpi);
  });

  it("refuses to write over a file it could not read whole", () => {
    writeFileSync(path, "{ not json");
    const errors: string[] = [];
    const store = new BookWaitStore(path, (m) => errors.push(m));
    expect(store.wait("ann-1")).toBeUndefined();
    expect(store.set("ann-1", cpi)).toBe(false);
    expect(store.clear("ann-1")).toBe(false);
    expect(readFileSync(path, "utf8")).toBe("{ not json");
  });

  it("lives beside the subscriptions file, with no env var of its own", () => {
    const store = createBookWaitStore({ SKYNET_SUBSCRIPTIONS_FILE: join(dir, "subs.json") });
    store.set("ann-1", cpi);
    expect(JSON.parse(readFileSync(path, "utf8"))).toEqual({ "ann-1": cpi });
  });
});
