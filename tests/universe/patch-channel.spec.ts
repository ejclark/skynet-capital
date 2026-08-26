import { WorldPatchChannel } from "../../src/universe/patch-channel.js";
import type { WorldPatchOp } from "../../src/universe/world-patch.js";

/**
 * The channel's three promises: a gapless seq run, an honest replay, and a ceremony that can never
 * fire twice. Each one is what a reconnecting browser depends on, so each gets a test that fails
 * loudly rather than a comment that claims it.
 */

const vitals = (equity: number): WorldPatchOp => ({
  kind: "empire-vitals",
  empireId: "human-eric",
  vitals: {
    theme: "TECH",
    founded: true,
    equity,
    reserveShare: 0.1,
    reserveCash: 1_000,
    landmark: null,
  },
});

const cue = (id: string): WorldPatchOp => ({
  kind: "cue",
  cue: { id, type: "took_profit", participantId: "human-eric", at: "2026-08-26T15:00:00Z" },
});

const at = "2026-08-26T15:00:00Z";

describe("WorldPatchChannel", () => {
  it("numbers patches from 1, gaplessly", () => {
    const channel = new WorldPatchChannel<undefined>();
    expect(channel.head).toBe(0);
    expect(channel.publish(at, [vitals(1)], undefined)?.seq).toBe(1);
    expect(channel.publish(at, [vitals(2)], undefined)?.seq).toBe(2);
    expect(channel.head).toBe(2);
  });

  it("publishes an empty op list — the caller's context is what carries the change", () => {
    const channel = new WorldPatchChannel<string>();
    expect(channel.publish(at, [], "state-moved")?.context).toBe("state-moved");
  });

  it("notifies subscribers and stops on unsubscribe", () => {
    const channel = new WorldPatchChannel<undefined>();
    const seen: number[] = [];
    const off = channel.subscribe((p) => seen.push(p.seq));
    channel.publish(at, [vitals(1)], undefined);
    off();
    channel.publish(at, [vitals(2)], undefined);
    expect(seen).toEqual([1]);
  });

  describe("replay", () => {
    it("returns exactly the patches after the client's position", () => {
      const channel = new WorldPatchChannel<undefined>();
      for (const n of [1, 2, 3]) channel.publish(at, [vitals(n)], undefined);
      const replay = channel.since(1);
      expect(replay.ok && replay.patches.map((p) => p.seq)).toEqual([2, 3]);
    });

    it("returns nothing for a client that is already level", () => {
      const channel = new WorldPatchChannel<undefined>();
      channel.publish(at, [vitals(1)], undefined);
      const replay = channel.since(1);
      expect(replay.ok && replay.patches).toEqual([]);
    });

    it("admits a GAP rather than replaying a partial history it has already evicted", () => {
      const channel = new WorldPatchChannel<undefined>({ buffer: 2 });
      for (const n of [1, 2, 3, 4]) channel.publish(at, [vitals(n)], undefined);
      expect(channel.since(1)).toEqual({ ok: false, reason: "gap", head: 4 });
    });

    it("admits a gap for a seq it never issued — what a server restart looks like from outside", () => {
      const channel = new WorldPatchChannel<undefined>();
      channel.publish(at, [vitals(1)], undefined);
      expect(channel.since(99).ok).toBe(false);
      expect(channel.since(-1).ok).toBe(false);
      expect(channel.since(Number.NaN).ok).toBe(false);
    });
  });

  describe("ceremony cues", () => {
    it("emits a cue id at most once, ever", () => {
      const channel = new WorldPatchChannel<undefined>();
      expect(channel.publish(at, [cue("took_profit:eric:t1:t2")], undefined)?.seq).toBe(1);
      expect(channel.publish(at, [cue("took_profit:eric:t1:t2")], undefined)).toBeUndefined();
      // A repeat must not even spend a seq — a hole in the run would read as a gap to every client.
      expect(channel.head).toBe(1);
    });

    it("still publishes when a repeated cue travels alongside real state", () => {
      const channel = new WorldPatchChannel<undefined>();
      channel.publish(at, [cue("c1")], undefined);
      const patch = channel.publish(at, [cue("c1"), vitals(2)], undefined);
      expect(patch?.ops.map((op) => op.kind)).toEqual(["empire-vitals"]);
    });

    it("never re-delivers a cue through a replay", () => {
      const channel = new WorldPatchChannel<undefined>();
      channel.publish(at, [cue("c1")], undefined);
      channel.publish(at, [vitals(2)], undefined);
      const replay = channel.since(1);
      expect(replay.ok && JSON.stringify(replay.patches)).not.toContain("c1");
    });
  });
});
