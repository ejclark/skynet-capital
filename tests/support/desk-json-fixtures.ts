import type { ServerResponse } from "node:http";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";

// Shared fixtures for the desk JSON route specs (tests/server/desk-json-routes*.spec.ts).

export interface Answer {
  status?: number;
  body?: string;
}

export function fakeRes(): { res: ServerResponse; out: Answer } {
  const out: Answer = {};
  const res = {
    writeHead(status: number) {
      out.status = status;
      return res;
    },
    end(body?: string) {
      out.body = body ?? "";
    },
  } as unknown as ServerResponse;
  return { res, out };
}

export const bot = {
  id: "sauron",
  displayName: "Sauron",
  kind: "bot" as const,
  cash: 5_000,
  equity: 10_000,
  positions: [{ symbol: "NVDA", quantity: 10, avgPrice: 150, marketValue: 1_760 }],
  activity: [],
};

export const human = { ...bot, id: "human-eric", displayName: "Eric", kind: "human" as const };

export function configWith(over: Partial<DashboardServerConfig> = {}): DashboardServerConfig {
  return {
    hub: { getState: () => ({ generatedAt: "t", participants: [bot, human], collisions: [] }) },
    ...over,
  } as unknown as DashboardServerConfig;
}

export const answered = (out: Answer): Record<string, unknown> => JSON.parse(out.body ?? "{}");
