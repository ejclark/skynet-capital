import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import { pieceKey, projectWorld } from "../../src/universe/project.js";
import { diffWorld, empireVitals } from "../../src/universe/world-patch.js";
import { applyWorldOps } from "../../src/universe/world-patch-apply.js";
import type { WorldState } from "../../src/universe/world-state.js";

/**
 * The patch producer's contract, asserted as behavior rather than shape.
 *
 * The load-bearing one is the ROUND TRIP: applying a diff to the previous world must reconstruct
 * the next world exactly, and applying it twice must land in the same place. That pair is what
 * "replay missed patches idempotently" actually means — without it the reconnect path is a hope.
 */

const pos = (symbol: string, quantity: number, avgPrice: number, marketValue: number) => ({
  symbol,
  quantity,
  avgPrice,
  marketValue,
});

function snap(over: Partial<ParticipantSnapshot> = {}): ParticipantSnapshot {
  return {
    id: over.id ?? "human-eric",
    displayName: over.displayName ?? "Eric",
    kind: over.kind ?? "human",
    cash: over.cash ?? 50_000,
    equity: over.equity ?? 150_000,
    positions: over.positions ?? [pos("NVDA", 100, 500, 60_000), pos("AAPL", 100, 200, 40_000)],
    ...(over.personaId ? { personaId: over.personaId } : {}),
  };
}

const world = (...snaps: ParticipantSnapshot[]): WorldState => projectWorld(snaps);

describe("pieceKey", () => {
  it("is participantId:SYMBOL, uppercased so one holding is never two towers", () => {
    expect(pieceKey("bot-sauron", "nvda")).toBe("bot-sauron:NVDA");
    expect(pieceKey("bot-sauron", "NVDA")).toBe("bot-sauron:NVDA");
  });

  it("is stamped on every projected structure", () => {
    const [empire] = world(snap()).empires;
    expect(empire?.structures.map((s) => s.key)).toEqual(["human-eric:NVDA", "human-eric:AAPL"]);
  });
});

describe("diffWorld", () => {
  it("says nothing at all when nothing moved", () => {
    expect(diffWorld(world(snap()), world(snap()))).toEqual([]);
  });

  it("states a board a client has never seen as one add per empire", () => {
    const ops = diffWorld(undefined, world(snap(), snap({ id: "bot-sauron", kind: "bot" })));
    expect(ops.map((op) => op.kind)).toEqual(["empire-added", "empire-added"]);
  });

  it("emits ONLY the pieces whose state moved, addressed by their stable keys", () => {
    const before = world(snap(), snap({ id: "bot-sauron", kind: "bot" }));
    const after = world(
      snap({ positions: [pos("NVDA", 100, 500, 70_000), pos("AAPL", 100, 200, 40_000)] }),
      snap({ id: "bot-sauron", kind: "bot" }),
    );
    const ops = diffWorld(before, after);
    // The untouched empire contributes nothing at all — no op names it.
    expect(JSON.stringify(ops)).not.toContain("bot-sauron");
    // Within the empire that DID move, both towers are re-stated: mass is relative to the largest
    // holding, so one position repricing genuinely changes its neighbour's rendered size too.
    expect(ops.filter((op) => op.kind === "piece-set").map((op) => op.piece.key)).toEqual([
      "human-eric:NVDA",
      "human-eric:AAPL",
    ]);
  });

  it("emits a piece-removed when a holding is sold out of the empire", () => {
    const ops = diffWorld(
      world(snap()),
      world(snap({ positions: [pos("NVDA", 100, 500, 60_000)] })),
    );
    expect(ops).toContainEqual({
      kind: "piece-removed",
      empireId: "human-eric",
      key: "human-eric:AAPL",
    });
  });

  it("emits empire-vitals when only the cash reserve moved", () => {
    const ops = diffWorld(world(snap()), world(snap({ cash: 90_000 })));
    expect(ops.map((op) => op.kind)).toEqual(["empire-vitals"]);
  });

  it("emits empire-added / empire-removed as accounts join and leave the board", () => {
    const solo = world(snap());
    const pair = world(snap(), snap({ id: "bot-sauron", kind: "bot" }));
    expect(diffWorld(solo, pair).map((o) => o.kind)).toEqual(["empire-added"]);
    expect(diffWorld(pair, solo)).toEqual([{ kind: "empire-removed", empireId: "bot-sauron" }]);
  });
});

describe("empireVitals", () => {
  it("normalizes a missing landmark to null — absence is never a zeroed crown", () => {
    const [plain] = world(snap()).empires;
    const [crowned] = world(snap({ id: "bot-sauron", kind: "bot", personaId: "sauron" })).empires;
    expect(plain && empireVitals(plain).landmark).toBeNull();
    expect(crowned && empireVitals(crowned).landmark).toMatchObject({ kind: "eye" });
  });
});

describe("applyWorldOps — the replay contract", () => {
  const before = world(snap(), snap({ id: "bot-sauron", kind: "bot", personaId: "sauron" }));
  const after = world(
    snap({
      cash: 10_000,
      positions: [pos("NVDA", 100, 500, 90_000), pos("AAPL", 100, 200, 41_000)],
    }),
    snap({ id: "bot-sauron", kind: "bot", positions: [pos("GLD", 10, 200, 2_500)] }),
  );

  it("round-trips: applying the diff reconstructs the next world exactly", () => {
    expect(applyWorldOps(before, diffWorld(before, after))).toEqual(after);
  });

  it("is idempotent: applying the same patch twice lands in the same place", () => {
    const ops = diffWorld(before, after);
    expect(applyWorldOps(applyWorldOps(before, ops), ops)).toEqual(applyWorldOps(before, ops));
  });

  it("drops a landmark when the vitals say it is gone, rather than keeping a stale crown", () => {
    const crowned = world(snap({ id: "bot-sauron", kind: "bot", personaId: "sauron" }));
    const plain = world(snap({ id: "bot-sauron", kind: "bot" }));
    const replayed = applyWorldOps(crowned, diffWorld(crowned, plain));
    expect(replayed.empires[0]?.landmark).toBeUndefined();
  });

  it("ignores DOM-only and envelope ops — they carry no world state", () => {
    const state = world(snap());
    expect(
      applyWorldOps(state, [
        { kind: "field", key: "human-eric", text: { value: "$1" } },
        { kind: "reframe", reason: "structural" },
      ]),
    ).toEqual(state);
  });
});
