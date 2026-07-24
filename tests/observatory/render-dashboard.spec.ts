import type { DashboardData } from "../../src/observatory/dashboard-data.js";
import { renderDashboardBody } from "../../src/observatory/render-dashboard.js";
import { sampleDashboardData } from "../../src/observatory/sample-dashboard-data.js";

describe("renderDashboardBody", () => {
  const html = renderDashboardBody(sampleDashboardData());

  it("renders each participant with their kind chip", () => {
    expect(html).toContain("The News Fader");
    expect(html).toContain("BOT · news-fader");
    expect(html).toContain("Eric");
    expect(html).toContain(">HUMAN<");
  });

  it("shows a gain in the positive class and a loss in the negative class", () => {
    // News Fader EEM: mktValue 528,000 vs cost 12,000*42.10 = 505,200 -> +22,800 (gain)
    expect(html).toContain("+$22,800");
    // Futurist NVDA: mktValue 98,400 vs cost 800*140 = 112,000 -> -13,600 (loss)
    expect(html).toContain("-$13,600");
    expect(html).toContain('class="num neg"');
    expect(html).toContain('class="num pos"');
  });

  it("renders an error state for an unreachable account", () => {
    const withError: DashboardData = {
      generatedAt: "2026-07-24T15:30:00.000Z",
      participants: [
        {
          id: "x",
          displayName: "Broken Bot",
          kind: "bot",
          personaId: "futurist",
          cash: 0,
          equity: 0,
          positions: [],
          error: "AlpacaApiError 401",
        },
      ],
    };

    const errHtml = renderDashboardBody(withError);
    expect(errHtml).toContain("card-error");
    expect(errHtml).toContain("Account unreachable");
  });

  it("renders a recent-activity feed with the trade", () => {
    expect(html).toContain("Recent Activity");
    expect(html).toContain(">BUY<");
    // VWO fill from Eric's activity is present.
    expect(html).toContain("VWO");
  });

  it("renders Eric's activity times in his timezone (Chicago), not UTC", () => {
    // 14:05 UTC is 09:05 in America/Chicago (CDT). The Chicago label must appear.
    expect(html).toContain("CDT");
    expect(html).toContain("09:05");
  });

  it("escapes HTML in participant names", () => {
    const data: DashboardData = {
      generatedAt: "2026-07-24T15:30:00.000Z",
      participants: [
        { id: "x", displayName: "<script>", kind: "human", cash: 0, equity: 0, positions: [] },
      ],
    };
    expect(renderDashboardBody(data)).not.toContain("<script>");
  });
});
