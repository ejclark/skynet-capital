import { buildDashboardData } from "../../src/observatory/dashboard-data.js";
import type { Participant } from "../../src/participants/participant.js";
import {
  heldPriceStreamPlan,
  parseOfflineParticipants,
  resolveDataSource,
} from "../../src/runtime/data-source.js";

describe("resolveDataSource", () => {
  it("defaults to live", () => {
    expect(resolveDataSource({}).mode).toBe("live");
  });

  it("selects offline when SKYNET_DATA_SOURCE=offline", () => {
    expect(resolveDataSource({ SKYNET_DATA_SOURCE: "offline" }).mode).toBe("offline");
  });
});

describe("parseOfflineParticipants", () => {
  it("throws when the JSON is not an array", () => {
    expect(() => parseOfflineParticipants("{}")).toThrow();
  });
});

describe("offline data source (committed fixtures)", () => {
  const dataSource = resolveDataSource({ SKYNET_DATA_SOURCE: "offline" });

  it("loads the committed roster with placeholder credentials", () => {
    const participants = dataSource.loadParticipants();
    expect(participants.map((p) => p.id)).toContain("day-trader");
    expect(participants.map((p) => p.id)).toContain("human-eric");
    // No real keys are ever needed offline.
    expect(participants[0]?.credentials.apiKey).toBe("offline");
  });

  it("builds a dashboard from fixtures with no network", async () => {
    const participants = dataSource.loadParticipants();
    const data = await buildDashboardData(participants, {
      clientFactory: dataSource.clientFactory,
    });
    const dayTrader = data.participants.find((p) => p.id === "day-trader");
    expect(dayTrader?.cash).toBe(948_250);
    expect(dayTrader?.positions.map((pos) => pos.symbol)).toContain("NVDA");
    expect(dayTrader?.error).toBeUndefined();
  });
});

describe("heldPriceStreamPlan (#4864)", () => {
  const creds = (apiKey: string) => ({ apiKey, apiSecret: `${apiKey}-secret` });
  const bot = { id: "sauron", displayName: "Sauron", kind: "bot", credentials: creds("bot-key") };
  const human = {
    id: "human-eric",
    displayName: "Eric",
    kind: "human",
    credentials: creds("member-key"),
  };

  it("never streams on a bot's credential, even when the bot is listed first", () => {
    const plan = heldPriceStreamPlan([bot, human] as Participant[], ["NVDA"]);
    expect(plan.credentials?.apiKey).toBe("member-key");
  });

  it("idles rather than borrow a bot's credential when no member has one", () => {
    const plan = heldPriceStreamPlan([bot] as Participant[], ["NVDA"]);
    expect(plan.credentials).toBeUndefined();
    expect(plan.idleReason).toContain("price stream idle");
  });

  it("drops option contracts, which the stock feed rejects", () => {
    const plan = heldPriceStreamPlan([human] as Participant[], [
      "CRWV",
      "CRWV261106P00080000",
      "NVDA",
    ]);
    expect(plan.symbols).toEqual(["CRWV", "NVDA"]);
  });

  it("idles when only option contracts are held", () => {
    const plan = heldPriceStreamPlan([human] as Participant[], ["CRWV261106P00080000"]);
    expect(plan.symbols).toEqual([]);
    expect(plan.idleReason).toContain("idle");
  });
});
