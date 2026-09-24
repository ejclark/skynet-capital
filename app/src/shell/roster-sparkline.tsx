import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { fetchEquityCurve } from "../live/equity-curve";

/**
 * One account's last month as a 88×24 line (#3689 slice 10, the All-accounts roster). It shares
 * the `["equity-curve", id, "1M"]` cache with the hero chart. Coloured by the month's direction,
 * which the roster's 1M cell also says with a sign. Draws nothing until the curve answers, and
 * nothing for an empty month (never a flat line that looks like a real zero).
 */
const W = 88;
const H = 24;

export function sparkPath(values: readonly number[]): string {
  if (values.length < 2) return "";
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * W;
      const y = H - 2 - ((v - lo) / span) * (H - 4);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export function RosterSparkline({
  accountId,
  className = "roster-spark",
}: {
  readonly accountId: string;
  /** The ceremony draws the same month bigger, by CSS; the geometry stays one viewBox. */
  readonly className?: string;
}): ReactElement | null {
  const curve = useQuery({
    queryKey: ["equity-curve", accountId, "1M"],
    queryFn: () => fetchEquityCurve(accountId, "1M"),
    staleTime: 60_000,
  });
  const values = curve.data?.points?.map((p) => p.value) ?? [];
  const d = sparkPath(values);
  if (!d) return null;
  const last = values[values.length - 1] ?? 0;
  return (
    <svg
      className={`${className} tone-${last > 0 ? "pos" : last < 0 ? "neg" : "flat"}`}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
