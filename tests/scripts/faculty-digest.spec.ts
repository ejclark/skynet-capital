import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { entry, memberWrites, worstTurn } from "../../scripts/faculty/digest.mjs";

// The round digest reads a session for whoever opens the round: what the member said, the writes
// the page sent (never the dock's read receipts), and the frame of the turn they were most lost on.

function session(turns: object[], frames: string[]): string {
  const dir = mkdtempSync(join(tmpdir(), "faculty-digest-"));
  writeFileSync(join(dir, "turns.jsonl"), turns.map((t) => JSON.stringify(t)).join("\n"));
  mkdirSync(join(dir, "frames"));
  for (const f of frames) writeFileSync(join(dir, "frames", f), "");
  return dir;
}

describe("the round digest", () => {
  it("names the most-lost turn and, for a give-up, the last frame the member saw", () => {
    const dir = session(
      [
        { n: 0, step: 0, confusion: 1, as_member: "looking" },
        { n: 1, step: 1, confusion: 3, as_member: "lost", action: { type: "give_up" } },
      ],
      ["000.jpg", "001.jpg"],
    );
    const worst = worstTurn(
      [
        { n: 0, step: 0, confusion: 1 },
        { n: 1, step: 1, confusion: 3 },
      ],
      dir,
    );
    expect(worst?.turn.n).toBe(1);
    expect(worst?.frame).toBe(join(dir, "frames", "001.jpg"));
  });

  it("lists the page's writes, never the dock's read receipts", () => {
    const writes = memberWrites({
      writes: [
        { method: "POST", url: "/api/companion/ack", body: null },
        { method: "POST", url: "/api/trade/cancel", body: '{"orderId":"o1"}' },
      ],
    });
    expect(writes).toEqual(['POST /api/trade/cancel {"orderId":"o1"}']);
  });

  it("heads a set-aside session with why it was set aside", () => {
    const dir = session([], []);
    const text = entry(dir, {
      scenario: "AC-01",
      member: "invited-friend",
      viewport: "phone",
      confounded: "the page could not load its code (a stale build chunk)",
      verdict: { success: false, reason: "order 1: no new order was placed", unintended: [] },
      ended: "give_up",
      turns: 1,
      cap: 22,
      ease: { score: 1, reason: "never loaded" },
      said: "black screen",
      writes: [],
    });
    expect(text).toContain(
      "AC-01 · invited-friend · phone — set aside: the page could not load its code",
    );
  });
});
