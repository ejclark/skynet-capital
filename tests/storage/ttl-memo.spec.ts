import { memoPerKey } from "../../src/storage/ttl-memo.js";

describe("memoPerKey", () => {
  it("answers a repeat read inside the window from memory, per key", () => {
    let clock = 0;
    let reads = 0;
    const read = memoPerKey(
      30_000,
      (key) => {
        reads += 1;
        return `${key}#${reads}`;
      },
      () => clock,
    );
    expect(read("sauron")).toBe("sauron#1");
    clock = 29_999;
    expect(read("sauron")).toBe("sauron#1");
    expect(read("day-trader")).toBe("day-trader#2");
    expect(reads).toBe(2);
  });

  it("reads again once the window has passed", () => {
    let clock = 0;
    let reads = 0;
    const read = memoPerKey(
      30_000,
      () => ++reads,
      () => clock,
    );
    expect(read("a")).toBe(1);
    clock = 30_000;
    expect(read("a")).toBe(2);
  });

  it("never remembers a throw", () => {
    let fail = true;
    const read = memoPerKey(30_000, () => {
      if (fail) throw new Error("db busy");
      return "ok";
    });
    expect(() => read("a")).toThrow("db busy");
    fail = false;
    expect(read("a")).toBe("ok");
  });
});
