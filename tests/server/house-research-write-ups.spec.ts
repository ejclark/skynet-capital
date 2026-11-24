import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { DiscoveryAsk } from "../../src/domain/discovery-queue.js";
import { shelfAnswered } from "../../src/server/discovery-answered.js";
import { createHouseResearchReader } from "../../src/server/house-research.js";
import { shelfWriteUps } from "../../src/server/shelf-write-ups.js";

/**
 * #7441: the discovery lane answers an ask by writing `docs/research/discovery/<slug>.md`, and the
 * live reader drops that ask from the list (`withoutAnswered`). Before this fix nothing else in
 * `get_research_on` read that folder, so a subject the lane had written up read exactly like one
 * nobody had touched — "no ledger yet", nothing waiting — and Moneypenny told members the house
 * had not researched it. These specs wire the reader the way `src/scripts/dashboard-companion.ts`
 * does, over a scratch shelf.
 */

const PLTR_ASK: DiscoveryAsk = {
  id: "name:PLTR",
  kind: "name",
  subject: "PLTR",
  askedAt: "2026-11-01T00:00:00Z",
  askers: ["m-aaaa"],
};

function scratchShelf(): string {
  const root = mkdtempSync(join(tmpdir(), "house-shelf-"));
  mkdirSync(join(root, "docs/research/discovery"), { recursive: true });
  return root;
}

function readerOver(root: string) {
  return createHouseResearchReader({
    shelf: () => () => false,
    queue: () => [PLTR_ASK],
    answered: shelfAnswered(root),
    writeUps: shelfWriteUps(root),
    today: () => "2026-11-11",
    laneReads: true,
    campaigns: [],
    lessons: [],
  });
}

const write = (root: string, slug: string, body: string): void =>
  writeFileSync(join(root, "docs/research/discovery", `${slug}.md`), body);

describe("get_research_on sees the discovery lane's write-ups (#7441)", () => {
  it("before the write-up lands, the ask waits and no write-up is claimed", () => {
    const read = readerOver(scratchShelf());
    const out = read({ kind: "name", subject: "PLTR" }, []);
    expect(out.onTheList).toEqual({ waiting: true, ahead: 0, askedBy: 1 });
    expect(out.writeUps).toBeUndefined();
  });

  it("once the write-up is on the shelf, the read names it instead of reading as never researched", () => {
    const root = scratchShelf();
    write(root, "name-pltr", "# PLTR\n\n**Call:** priced for a lot of growth already.\n");
    const read = readerOver(root);
    const out = read({ kind: "name", subject: "PLTR" }, []);
    const untouched = read({ kind: "name", subject: "ZZZQ" }, []);
    // The answered ask is still off the list…
    expect(out.onTheList).toEqual({ waiting: false });
    // …but the read now says the house wrote it up, so it no longer equals a never-touched name.
    expect(out.writeUps).toEqual([
      {
        file: "docs/research/discovery/name-pltr.md",
        opening: "Call: priced for a lot of growth already.",
      },
    ]);
    expect({ ...out, subject: "-" }).not.toEqual({ ...untouched, subject: "-" });
    expect(untouched.writeUps).toBeUndefined();
  });

  it("counts a write-up made inside a campaign, bare one first, and never a name that only shares a prefix", () => {
    const root = scratchShelf();
    write(root, "name-pltr-in-energy-for-ai", "Inside the house campaign.\n");
    write(root, "name-pltr-in-0a1b2c3d", "Inside a member's campaign.\n");
    write(root, "name-pltr", "The bare write-up.\n");
    write(root, "name-pltrx", "A different ticker.\n");
    write(root, "sector-energy", "A sector write-up.\n");
    const out = readerOver(root)({ kind: "name", subject: "PLTR" }, []);
    expect(out.writeUps?.map((w) => w.file)).toEqual([
      "docs/research/discovery/name-pltr.md",
      "docs/research/discovery/name-pltr-in-0a1b2c3d.md",
      "docs/research/discovery/name-pltr-in-energy-for-ai.md",
    ]);
  });

  it("reads a sector or market write-up at its own kind", () => {
    const root = scratchShelf();
    write(root, "sector-energy", "Energy, written up.\n");
    write(root, "market-us-large-caps", "Large caps, written up.\n");
    const read = readerOver(root);
    expect(read({ kind: "sector", subject: "Energy" }, []).writeUps?.[0]?.file).toBe(
      "docs/research/discovery/sector-energy.md",
    );
    expect(read({ kind: "market", subject: "us-large-caps" }, []).writeUps?.[0]?.opening).toBe(
      "Large caps, written up.",
    );
  });

  it("a shelf that is missing or unreadable reads as no write-up, never a thrown tool", () => {
    const missing = join(tmpdir(), "house-shelf-never-made-7441");
    expect(shelfWriteUps(missing)({ kind: "name", subject: "PLTR" })).toEqual([]);
  });
});
