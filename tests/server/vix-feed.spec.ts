import { lastVixClose, vixReader } from "../../src/server/vix-feed.js";

/** The latest VIX close, read from Cboe's published history (#7028 slice 3). */

const CSV = [
  "DATE,OPEN,HIGH,LOW,CLOSE",
  "11/04/2026,21.10,22.00,20.50,21.30",
  "11/05/2026,24.00,26.10,23.40,25.64",
  "",
].join("\n");

describe("lastVixClose", () => {
  it("reads the last row's date and close", () => {
    expect(lastVixClose(CSV)).toEqual({ session: "2026-11-05", close: 25.64 });
  });

  it("refuses a file whose last row isn't a date and a positive close", () => {
    expect(lastVixClose("DATE,OPEN,HIGH,LOW,CLOSE\nnot a date,1,1,1,2")).toBeUndefined();
    expect(lastVixClose("DATE,OPEN,HIGH,LOW,CLOSE\n11/05/2026,1,1,1,n/a")).toBeUndefined();
    expect(lastVixClose("<html>blocked</html>")).toBeUndefined();
  });
});

describe("vixReader", () => {
  it("shares one read for 30 minutes, then reads again", async () => {
    let clock = 0;
    let reads = 0;
    const read = vixReader(
      () => {
        reads++;
        return Promise.resolve(CSV);
      },
      () => clock,
    );
    await read();
    clock = 29 * 60_000;
    await read();
    expect(reads).toBe(1);
    clock = 31 * 60_000;
    await read();
    expect(reads).toBe(2);
  });

  it("coalesces overlapping callers into one request", async () => {
    let reads = 0;
    const read = vixReader(() => {
      reads++;
      return Promise.resolve(CSV);
    });
    await Promise.all([read(), read(), read()]);
    expect(reads).toBe(1);
  });

  it("answers undefined on a failed read, and keeps the last good one through an outage", async () => {
    let clock = 0;
    let fail = false;
    const read = vixReader(
      () => (fail ? Promise.reject(new Error("down")) : Promise.resolve(CSV)),
      () => clock,
    );
    expect((await read())?.close).toBe(25.64);
    fail = true;
    clock = 60 * 60_000;
    expect((await read())?.close).toBe(25.64);
    const cold = vixReader(() => Promise.resolve(undefined));
    expect(await cold()).toBeUndefined();
  });
});
