export function labelPatches(
  live?: { name: string; description?: string | null }[],
): { name: string; description: string }[];

export function applyPriorityLabels(opts?: {
  dryRun?: boolean;
  read?: (name: string) => { name: string; description?: string | null };
  patch?: (patch: { name: string; description: string }) => unknown;
  log?: (line: string) => void;
}): { name: string; description: string }[];
