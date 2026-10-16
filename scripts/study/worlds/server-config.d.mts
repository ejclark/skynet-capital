// Type surface for server-config.mjs — same arrangement as scripts/crawl/phone.d.mts (`allowJs` is off).

import type { Book, BookDecision } from "./book.mjs";

export interface PortfolioHistory {
  timestamp: number[];
  equity: number[];
  profit_loss: (number | null)[];
  base_value: number | null;
}

export interface WorldConfig {
  now(): Date;
  resolveOwnerIds(email: string): string[];
  readDecisions(id: string, page?: { before?: number; limit?: number }): Promise<BookDecision[]>;
  findByOrderId(orderId: string): { record: BookDecision; intent: unknown } | undefined;
  tradingClientFor(id: string):
    | {
        isMarketOpen(): Promise<boolean>;
        listOrders(): Promise<{ id: string; submitted_at: string }[]>;
        getPortfolioHistory(period: string): Promise<PortfolioHistory>;
      }
    | undefined;
  [seam: string]: unknown;
}

export function serverConfig(book: Book): WorldConfig;
export function sessionFor(email: string): { email: string; provider: string; exp: number };
