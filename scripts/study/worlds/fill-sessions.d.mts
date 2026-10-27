// Type surface for fill-sessions.mjs (`allowJs` is off; same arrangement as day-change.d.mts).

export interface SessionFill {
  orderId: string;
  participantId?: string;
  symbol: string;
  side?: string;
  at: string;
}

export function offSessionFills(book: { activity: Record<string, SessionFill[]> }): SessionFill[];
export function describeFill(fill: SessionFill): string;
