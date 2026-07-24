import { buildDashboardData } from "../../src/observatory/dashboard-data.js";
import { parseOfflineParticipants, resolveDataSource } from "../../src/runtime/data-source.js";

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
