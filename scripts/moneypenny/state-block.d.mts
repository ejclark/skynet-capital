// Type surface for state-block.mjs — same arrangement as continuation.d.mts: the scripts/ tree is
// plain ESM with `allowJs` off, so a spec that imports from it needs this.

export interface RestComment {
  readonly id?: number;
  readonly body?: string;
  readonly created_at?: string;
  readonly createdAt?: string;
  readonly updated_at?: string;
}

export interface Receipt {
  readonly createdAt: string;
  readonly runId: string;
  readonly fingerprint: string;
  readonly target?: number;
}

export const CONTINUE_MARKER: string;
export const STOP_MARKER: string;

export function stateBlockOf(
  comments?: readonly RestComment[],
): { id?: number; body: string; updatedAt?: string } | null;
export function nextPickupOf(blockBody?: string): string | null;
export function blockFingerprint(blockBody?: string): string;
export function receiptData(data: {
  runId?: string | number;
  fingerprint?: string;
  target?: number;
}): string;
export function parseReceipt(
  body?: string,
): { runId: string; fingerprint: string; target?: number } | null;
export function allReceiptsOf(comments?: readonly RestComment[]): Receipt[];
export function receiptsOf(comments?: readonly RestComment[]): Receipt[];
export function receiptBody(receipt: {
  pickup?: string;
  target?: number;
  runId?: string | number;
  runUrl?: string;
  fingerprint?: string;
  model?: string;
  footer?: string;
}): string;
