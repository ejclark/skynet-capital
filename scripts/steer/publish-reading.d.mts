// Type surface for publish-reading.mjs.

export function publishReading(opts: {
  used: number;
  resetsAt: number;
  readAt?: number;
  source?: string;
  dryRun?: boolean;
  exec?: (cmd: string, args: readonly string[]) => string;
  trackingIssue?: number;
}): string;
