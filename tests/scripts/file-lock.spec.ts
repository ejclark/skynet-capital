import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "@rstest/core";
// @ts-expect-error plain .mjs script, no declarations
import { LockBusyError, lockIsDead, withFileLock } from "../../scripts/file-lock.mjs";

const lockPath = () => join(mkdtempSync(join(tmpdir(), "file-lock-")), "x.lock");
// A pid that has certainly exited: the child is gone by the time spawnSync returns.
const deadPid = () => spawnSync("node", ["-e", ""]).pid;

describe("file lock", () => {
  it("holds the lock during the body and removes it after", () => {
    const lock = lockPath();
    const seen = withFileLock(lock, () => existsSync(lock));
    expect(seen).toBe(true);
    expect(existsSync(lock)).toBe(false);
  });

  it("releases when the body throws", () => {
    const lock = lockPath();
    expect(() =>
      withFileLock(lock, () => {
        throw new Error("boom");
      }),
    ).toThrow("boom");
    expect(existsSync(lock)).toBe(false);
  });

  it("refuses when a live writer holds it past the wait, and leaves that lock alone", () => {
    const lock = lockPath();
    const held = `${process.pid} ${Date.now()}\n`;
    writeFileSync(lock, held);
    let ran = false;
    expect(() =>
      withFileLock(
        lock,
        () => {
          ran = true;
        },
        { waitMs: 50 },
      ),
    ).toThrow(LockBusyError);
    expect(ran).toBe(false);
    expect(readFileSync(lock, "utf8")).toBe(held);
  });

  it("takes over a lock whose writer has died", () => {
    const lock = lockPath();
    writeFileSync(lock, `${deadPid()} ${Date.now()}\n`);
    expect(withFileLock(lock, () => "ran", { waitMs: 50 })).toBe("ran");
    expect(existsSync(lock)).toBe(false);
  });

  it("takes over a lock held longer than any honest run, even with a live pid", () => {
    const lock = lockPath();
    writeFileSync(lock, `${process.pid} ${Date.now() - 120_000}\n`);
    expect(withFileLock(lock, () => "ran", { waitMs: 50, deadAfterMs: 60_000 })).toBe("ran");
  });

  it("does not remove a lock another writer took over from it", () => {
    const lock = lockPath();
    const theirs = `${process.pid + 1} ${Date.now()}\n`;
    withFileLock(lock, () => writeFileSync(lock, theirs));
    expect(readFileSync(lock, "utf8")).toBe(theirs);
  });

  // A long queue must not make the next holder look old the moment it gets its turn.
  it("dates a lock from when it was taken, not from when the writer began waiting", () => {
    const lock = lockPath();
    const began = Date.now();
    const holder = spawn("node", [
      "--input-type=module",
      "-e",
      `import { withFileLock } from ${JSON.stringify(resolve("scripts/file-lock.mjs"))};
       withFileLock(${JSON.stringify(lock)}, () => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 400));`,
    ]);
    while (!existsSync(lock)) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5);
    const since = withFileLock(lock, () => Number(readFileSync(lock, "utf8").split(" ")[1]));
    holder.kill();
    // The holder ran for 400 ms, so a stamp taken at the turn is well past the moment we began.
    expect(since - began).toBeGreaterThan(300);
  }, 30_000);

  it("reads a lock as dead only when its holder is gone or its age is past the limit", () => {
    const now = 1_000_000;
    expect(lockIsDead(`${process.pid} ${now}`, 60_000, now)).toBe(false);
    expect(lockIsDead(`${process.pid} ${now - 60_001}`, 60_000, now)).toBe(true);
    expect(lockIsDead(`${deadPid()} ${now}`, 60_000, now)).toBe(true);
    expect(lockIsDead("not a lock", 60_000, now)).toBe(true);
  });

  it("lets exactly one of many processes in at a time", async () => {
    const dir = mkdtempSync(join(tmpdir(), "file-lock-"));
    const lock = join(dir, "x.lock");
    const counter = join(dir, "count");
    writeFileSync(counter, "0");
    // Read, wait, write: without exclusion the writers overlap and increments are lost.
    const child = `
      import { readFileSync, writeFileSync } from "node:fs";
      import { withFileLock } from ${JSON.stringify(resolve("scripts/file-lock.mjs"))};
      withFileLock(${JSON.stringify(lock)}, () => {
        const n = Number(readFileSync(${JSON.stringify(counter)}, "utf8"));
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20);
        writeFileSync(${JSON.stringify(counter)}, String(n + 1));
      }, { waitMs: 30000 });
    `;
    const codes = await Promise.all(
      Array.from(
        { length: 12 },
        () =>
          new Promise((done) => {
            spawn("node", ["--input-type=module", "-e", child], { stdio: "ignore" }).on(
              "close",
              done,
            );
          }),
      ),
    );
    expect(codes).toEqual(codes.map(() => 0));
    expect(readFileSync(counter, "utf8")).toBe("12");
  }, 60_000);
});
