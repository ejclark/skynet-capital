// Type surface for markers.mjs: scripts/ is plain ESM.
import type { ReviewApi } from "./rest.mjs";

export interface Receipt {
  sha: string;
  patchId: string | null;
  tier: string;
  round: number;
  at: string | null;
}
export interface FindingMark {
  id: string;
  severity: "important" | "nit";
  at: string | null;
  file?: string;
  line?: number | null;
  originalLine?: number | null;
  commentId?: number;
}
export interface ReplyMark {
  id: string;
  outcome: "fixed" | "declined";
  sha: string | null;
  at: string | null;
  reason?: string;
  inReplyTo?: number | null;
}
export interface Markers {
  receipts: Receipt[];
  findings: FindingMark[];
  replies: ReplyMark[];
  responds: { sha: string; round: number; at: string | null }[];
}
type Said = Record<string, unknown>;

export const SEVERITIES: string[];
export const OUTCOMES: string[];
export const TIERS: string[];
export function receiptMarker(m: {
  sha: string;
  patchId?: string | null;
  tier: string;
  round: number;
}): string;
export function findingMarker(m: { id: string; severity: string }): string;
export function replyMarker(m: { id: string; outcome: string; sha?: string | null }): string;
export function respondMarker(m: { sha: string; round: number }): string;
export function parseMarkers(text: string): ({ kind: string } & Record<string, unknown>)[];
export function stripMarkers(text: string): string;
export function readMarkers(sources?: {
  reviews?: Said[];
  reviewComments?: Said[];
  issueComments?: Said[];
}): Markers;
export function roundOf(markers: Markers | null | undefined): number;
export function lastReceipt(markers: Markers | null | undefined): Receipt | null;
export function readPrMarkers(number: number, api: Pick<ReviewApi, "get">): Markers;
