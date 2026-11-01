// Type surface for frame-diff.mjs — same arrangement as the other scripts/ specs import.

export interface PixelCount {
  n: number;
  total?: number;
  size?: string;
}

export function compareFrames(opts: {
  before: string;
  after: string;
  baselines?: string[];
  pixelDiff: (pathA: string, pathB: string) => Promise<PixelCount>;
}): Promise<{
  exit: 0 | 1 | 2;
  framesCompared: number;
  framesJudged: number;
  unstable: string[];
  missing: string[];
  framesThatMoved: number;
  pixelDiffs: Array<PixelCount & { frame: string }>;
  meanFrameKb: number;
}>;
