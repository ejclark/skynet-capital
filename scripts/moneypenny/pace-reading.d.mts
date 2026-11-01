// Type surface for pace-reading.mjs — same arrangement as work-mode.d.mts.

export interface PublishedReading {
  readonly used: number;
  readonly at: number;
  readonly resetsAt: number;
  readonly source?: string;
}

export function readingFrom(body: string | null | undefined): PublishedReading | null;
export function withReading(body: string | null | undefined, reading: PublishedReading): string;
