// Types for oracle.mjs (the change oracle) — read by tests/scripts/faculty-oracle.spec.ts.

export interface OrderRow {
  readonly id: string;
  readonly symbol?: string;
  readonly side?: string;
  readonly quantity?: number;
  readonly orderType?: string;
  readonly limitPrice?: number;
  readonly stopPrice?: number;
  readonly timeInForce?: string;
  readonly state?: string;
  readonly replaces?: string;
  readonly replacedBy?: string;
}

export interface Account {
  readonly orders: readonly OrderRow[];
  readonly positions: Readonly<Record<string, number>>;
}

export interface Described extends OrderRow {
  readonly underlying?: string;
  readonly optionType?: "call" | "put";
  readonly strike?: number;
  readonly expiry?: string;
  readonly expiryDays?: number;
}

export interface ChangeVerdict {
  readonly success: boolean;
  readonly reason: string;
  readonly problems: readonly string[];
  readonly unintended: readonly string[];
  readonly newOrders: readonly string[];
}

export function daysUntil(date: string, now: Date): number;
export function describeOrder(row: OrderRow, now: Date): Described;
export function misses(want: Record<string, unknown>, order: Described): string[];
export function gradeChange(
  before: Account,
  after: Account,
  end: Record<string, unknown>,
  now: Date,
): ChangeVerdict;
export function label(o: Described): string;
