// An exclusive lock between processes on one machine, for the few writers that share a file with no
// server in between (the memory folder: scripts/run-memory.mjs promote, scripts/hooks/memory-history.mjs).
//
// WHY a lock that can be broken: these writers are short scripts that get killed (a `claude -p`
// teardown kills async hooks mid-run, and process.exit skips finally), so a lock that only its owner
// can release would block memory for good after one crash. The lock file says who holds it and since
// when, and a waiter takes it over once that holder is gone or has held it past any honest run.
//
// WHY link and not open("wx"): a hard link appears with its content already in place, so no waiter can
// ever read an empty lock and have to guess about it.
//
// Known gap, kept on purpose: a waiter that judges a lock dead can take over one that changed hands in
// the instant between its read and its rename. It checks what it took and puts a live lock back, which
// leaves a window of microseconds that opens only while a dead lock is being cleared.
import { linkSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";

/** Thrown when the lock is still held by a live writer after the wait. */
export class LockBusyError extends Error {}

const pause = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

function read(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

/** Whether a lock's stated holder can no longer be writing. Pure but for the process table. */
export function lockIsDead(content, deadAfterMs, now = Date.now()) {
  const [pid, since] = content.trim().split(" ").map(Number);
  if (!(pid > 0 && since > 0)) return true;
  if (now - since > deadAfterMs) return true;
  try {
    process.kill(pid, 0);
    return false;
  } catch (error) {
    // EPERM means a process owns that pid and is not ours to signal, so it is alive.
    return error.code === "ESRCH";
  }
}

/** The lock's content when this call took it, or null. Stamped per try: age counts holding, not waiting. */
function tryTake(lock) {
  const mine = `${lock}.${process.pid}`;
  const content = `${process.pid} ${Date.now()}\n`;
  writeFileSync(mine, content);
  try {
    linkSync(mine, lock);
    return content;
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    return null;
  } finally {
    rmSync(mine, { force: true });
  }
}

function clearDead(lock, seen) {
  const tomb = `${lock}.dead-${process.pid}`;
  try {
    renameSync(lock, tomb);
  } catch {
    return; // Another waiter cleared it first.
  }
  if (read(tomb) !== seen) {
    try {
      linkSync(tomb, lock);
    } catch {
      // A third writer already holds it, and that holder is the one the lock now protects.
    }
  }
  rmSync(tomb, { force: true });
}

/**
 * Runs body with lock held, and releases it however body ends, short of the process dying.
 * body must not call process.exit: that skips the release, so return the outcome and exit after.
 */
export function withFileLock(lock, body, { waitMs = 10_000, deadAfterMs = 60_000 } = {}) {
  const deadline = Date.now() + waitMs;
  let content = tryTake(lock);
  while (content === null) {
    const seen = read(lock);
    if (seen !== null && lockIsDead(seen, deadAfterMs)) {
      clearDead(lock, seen);
    } else {
      if (Date.now() > deadline) {
        throw new LockBusyError(`${lock} still held after ${waitMs} ms (holder: ${seen?.trim()})`);
      }
      pause(10 + Math.random() * 40); // Jitter, so waiters do not all retry on the same beat.
    }
    content = tryTake(lock);
  }
  try {
    return body();
  } finally {
    // Only our own: past deadAfterMs a waiter may have taken this over, and that lock is theirs.
    if (read(lock) === content) rmSync(lock, { force: true });
  }
}
