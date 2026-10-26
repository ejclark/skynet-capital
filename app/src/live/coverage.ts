import type { CoverageJson } from "../../../src/observatory/coverage-json-view";

/**
 * R&D → COVERAGE's client model (#3811 slice 3) — `/api/research/coverage`, rendered as served.
 * The server formats every number and orders the rows; nothing here re-derives a figure.
 */
export type { CoverageJson, CoverageRowJson } from "../../../src/observatory/coverage-json-view";

export async function fetchCoverage(): Promise<CoverageJson> {
  const res = await fetch("/api/research/coverage", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`/api/research/coverage ${res.status}`);
  return (await res.json()) as CoverageJson;
}

/** The map moves when a ledger lands or a position changes, never by the second — ten minutes is
 *  fresh, and the fund bars behind it are daily. */
export function coverageQuery(enabled: boolean) {
  return {
    queryKey: ["research-coverage"] as const,
    queryFn: fetchCoverage,
    enabled,
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  };
}
