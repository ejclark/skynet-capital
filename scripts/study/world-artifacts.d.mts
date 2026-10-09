// Type surface for world-artifacts.mjs — same arrangement as parity-judge.d.mts (`allowJs` is off).

export interface WorldArtifact {
  route: string;
  sees: string;
  why: string;
  source: string;
}

export function worldArtifacts(input: {
  declared?: { route: string; sees: string; why: string }[];
  payloads?: { key: string; source: string }[];
  rows?: { surface: { label: string; route?: string; struck?: string } }[];
  unstubbed?: string[];
  offsite?: string[];
}): WorldArtifact[];
