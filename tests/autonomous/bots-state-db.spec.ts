import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openBotsStateDb, restoreBotsState } from "../../src/autonomous/bots-state-db.js";
import { MomentumTracker } from "../../src/autonomous/momentum-tracker.js";
import { SentimentTracker } from "../../src/news/sentiment-tracker.js";

describe("BotsStateDb", () => {
  let dir: string;
  let dbPath: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "bots-state-"));
    dbPath = join(dir, "bots.db");
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("round-trips momentum across a fresh open of the same file (a restart)", () => {
    const first = openBotsStateDb(dbPath);
    first.saveMomentum("NVDA", [100, 105, 110]);
    first.close();

    const second = openBotsStateDb(dbPath);
    expect(second.loadMomentum()).toEqual({ NVDA: [100, 105, 110] });
    second.close();
  });

  it("upserts — saving the same symbol twice replaces, never duplicates", () => {
    const db = openBotsStateDb(dbPath);
    db.saveMomentum("NVDA", [100]);
    db.saveMomentum("NVDA", [100, 105]);
    expect(db.loadMomentum()).toEqual({ NVDA: [100, 105] });
    db.close();
  });

  it("round-trips sentiment across a fresh open of the same file", () => {
    const first = openBotsStateDb(dbPath);
    first.saveSentiment("NVDA", [0.5, -0.2]);
    first.close();

    const second = openBotsStateDb(dbPath);
    expect(second.loadSentiment()).toEqual({ NVDA: [0.5, -0.2] });
    second.close();
  });

  it("round-trips cooldowns, scoped per persona", () => {
    const first = openBotsStateDb(dbPath);
    first.saveCooldown("sauron", "NVDA", 1000);
    first.saveCooldown("day-trader", "NVDA", 2000);
    first.close();

    const second = openBotsStateDb(dbPath);
    expect(second.loadCooldowns("sauron")).toEqual(new Map([["NVDA", 1000]]));
    expect(second.loadCooldowns("day-trader")).toEqual(new Map([["NVDA", 2000]]));
    expect(second.loadCooldowns("prospector")).toEqual(new Map());
    second.close();
  });

  it("updates a cooldown in place on a later save for the same persona+symbol", () => {
    const db = openBotsStateDb(dbPath);
    db.saveCooldown("sauron", "NVDA", 1000);
    db.saveCooldown("sauron", "NVDA", 2000);
    expect(db.loadCooldowns("sauron")).toEqual(new Map([["NVDA", 2000]]));
    db.close();
  });

  it("starts empty for a brand-new file — nothing to restore, never a throw", () => {
    const db = openBotsStateDb(dbPath);
    expect(db.loadMomentum()).toEqual({});
    expect(db.loadSentiment()).toEqual({});
    expect(db.loadCooldowns("sauron")).toEqual(new Map());
    expect(db.loadScoutState()).toBeUndefined();
    db.close();
  });

  // Confirmed live 2026-09-04: the scout's day-state lived in process memory, so every restart
  // re-armed it and it placed another pair of forced picks — once per restart, not once per day.
  it("round-trips the scout's day-state across a restart, as one upserted row", () => {
    const first = openBotsStateDb(dbPath);
    first.saveScoutState({
      day: "2026-09-04",
      ranToday: false,
      firedOrganicallyToday: false,
      ownedSymbols: [],
    });
    first.saveScoutState({
      day: "2026-09-04",
      ranToday: true,
      firedOrganicallyToday: false,
      ownedSymbols: ["AVGO", "AAPL"],
    });
    first.close();

    const second = openBotsStateDb(dbPath);
    expect(second.loadScoutState()).toEqual({
      day: "2026-09-04",
      ranToday: true,
      firedOrganicallyToday: false,
      ownedSymbols: ["AVGO", "AAPL"],
    });
    second.close();
  });
});

// Issue #1181: the restore has to REPORT what it did, not just do it — that count is what the
// health stamp carries, and it is the only way a deploy proves the volume actually worked.
describe("restoreBotsState", () => {
  /** The only part of a bot this call reads: which persona's cooldown rows to count. */
  const bot = (id: string) => ({ persona: { id } });
  let dir: string;
  let dbPath: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "bots-restore-"));
    dbPath = join(dir, "bots.db");
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("rehydrates both trackers and reports what came back", () => {
    const seed = openBotsStateDb(dbPath);
    seed.saveMomentum("NVDA", [100, 105, 110]);
    seed.saveMomentum("AVGO", [200, 201]);
    seed.saveSentiment("NVDA", [0.4]);
    seed.saveCooldown("sauron", "NVDA", 1_700_000_000_000);
    seed.saveCooldown("sauron", "AVGO", 1_700_000_000_001);
    seed.saveCooldown("saruman", "NVDA", 1_700_000_000_002);
    seed.close();

    const db = openBotsStateDb(dbPath);
    const tracker = new MomentumTracker(20);
    const sentiment = new SentimentTracker(10);
    const restored = restoreBotsState(db, tracker, sentiment, [bot("sauron"), bot("saruman")]);

    expect(restored).toEqual({ momentumSymbols: 2, sentimentSymbols: 1, cooldowns: 3 });
    expect(tracker.snapshot()).toEqual({ NVDA: [100, 105, 110], AVGO: [200, 201] });
    expect(sentiment.snapshot()).toEqual({ NVDA: [0.4] });
    db.close();
  });

  it("counts cooldowns only for the personas actually on the roster", () => {
    const seed = openBotsStateDb(dbPath);
    seed.saveCooldown("sauron", "NVDA", 1);
    seed.saveCooldown("retired-persona", "NVDA", 2);
    seed.close();

    const db = openBotsStateDb(dbPath);
    const restored = restoreBotsState(db, new MomentumTracker(), new SentimentTracker(), [
      bot("sauron"),
    ]);
    expect(restored?.cooldowns).toBe(1);
    db.close();
  });

  it("does not count a symbol whose persisted window is empty", () => {
    const seed = openBotsStateDb(dbPath);
    seed.saveMomentum("NVDA", []);
    seed.saveMomentum("AVGO", [200]);
    seed.close();

    const db = openBotsStateDb(dbPath);
    const restored = restoreBotsState(db, new MomentumTracker(), new SentimentTracker(), []);
    expect(restored).toEqual({ momentumSymbols: 1, sentimentSymbols: 0, cooldowns: 0 });
    db.close();
  });

  it("returns null when durability is dark, leaving both trackers cold-start", () => {
    const tracker = new MomentumTracker();
    const restored = restoreBotsState(undefined, tracker, new SentimentTracker(), [bot("sauron")]);
    expect(restored).toBeNull();
    expect(tracker.snapshot()).toEqual({});
  });
});
