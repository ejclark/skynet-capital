import { gapRecovery } from "../../src/observatory/gap-recovery.js";
import type { Participant } from "../../src/participants/participant.js";

const account = (id: string): Participant => ({ id }) as unknown as Participant;

/** A promise the spec settles by hand. */
function gate(): { promise: Promise<void>; open: () => void } {
  let open = () => undefined as void;
  const promise = new Promise<void>((resolve) => {
    open = resolve;
  });
  return { promise, open };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("gapRecovery (#8251)", () => {
  it("waits for the boot reconcile before the first re-read", async () => {
    const boot = gate();
    const calls: string[] = [];
    const onResume = gapRecovery({
      after: boot.promise,
      recover: (p, at) => {
        calls.push(`${p.id}@${at}`);
        return Promise.resolve();
      },
    });
    onResume(account("a"), "T1");
    await flush();
    expect(calls).toEqual([]);
    boot.open();
    await flush();
    expect(calls).toEqual(["a@T1"]);
  });

  it("runs one re-read per account at a time and coalesces resumes into one follow-up from the earliest drop", async () => {
    const first = gate();
    const calls: string[] = [];
    const onResume = gapRecovery({
      after: Promise.resolve(),
      recover: (p, at) => {
        calls.push(`${p.id}@${at}`);
        return calls.length === 1 ? first.promise : Promise.resolve();
      },
    });
    onResume(account("a"), "2026-11-24T14:00:00Z");
    await flush();
    onResume(account("a"), "2026-11-24T14:05:00Z");
    onResume(account("a"), "2026-11-24T14:02:00Z");
    await flush();
    expect(calls).toHaveLength(1);

    first.open();
    await flush();
    await flush();
    expect(calls).toEqual(["a@2026-11-24T14:00:00Z", "a@2026-11-24T14:02:00Z"]);
  });

  it("does not hold one account's re-read behind another's", async () => {
    const slow = gate();
    const calls: string[] = [];
    const onResume = gapRecovery({
      after: Promise.resolve(),
      recover: (p) => {
        calls.push(p.id);
        return p.id === "a" ? slow.promise : Promise.resolve();
      },
    });
    onResume(account("a"), "T");
    onResume(account("b"), "T");
    await flush();
    expect(calls).toEqual(["a", "b"]);
  });

  it("a failed re-read still lets the next one run", async () => {
    const calls: string[] = [];
    const onResume = gapRecovery({
      after: Promise.reject(new Error("boot reconcile failed")),
      recover: () => {
        calls.push("x");
        return Promise.reject(new Error("broker down"));
      },
    });
    onResume(account("a"), "T1");
    await flush();
    onResume(account("a"), "T2");
    await flush();
    expect(calls).toEqual(["x", "x"]);
  });
});
