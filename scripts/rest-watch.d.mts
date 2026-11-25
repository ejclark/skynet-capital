// Type surface for rest-watch.mjs (#8289 slice 2) — scripts/ is plain ESM with `allowJs` off.
export interface BucketReading {
  limit: number;
  used: number;
  remaining: number;
  reset: number;
}
export interface WatchSample {
  at: string;
  bucket: "user" | "app" | "unknown" | string;
  core: BucketReading | null;
  graphql: BucketReading | null;
}
export interface WindowVerdict {
  opened: string;
  reset: string;
  samples: number;
  seen: [number, number];
  peakUsed: number;
  emptyAt: number | null;
  verdict: "wrong" | "held" | "unread";
}
export interface WatchVerdict {
  verdict: "wrong" | "held" | "unread";
  bucket: string;
  windows: WindowVerdict[];
  otherBuckets: number;
}
export const WINDOW_SECONDS: number;
export const FALSIFIER_MINUTE: number;
export function toSample(
  rateLimit: unknown,
  bucket: "user" | "app" | "unknown",
  now?: Date,
): WatchSample;
export function bucketOf(result: {
  status: number | null;
  stdout?: string;
  stderr?: string;
}): "user" | "app" | "unknown";
export function judge(samples: WatchSample[], opts?: { bucket?: string }): WatchVerdict;
export function formatVerdict(result: WatchVerdict): string;
export function readLog(text: string): WatchSample[];
