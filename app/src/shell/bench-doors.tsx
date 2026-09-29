import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";

/**
 * THE DOCKED BENCH'S DOORS (#3807 slices 2a and 3b-2): docked at 1280 the section switch leaves the
 * page (frame.tsx → BENCH: every pane is on it), but two panes never dock on their own — Guidance
 * and the standalone Chain (`trade.tsx`'s `Bench` → `shows`), each opened by `?section=`. Folded,
 * the switch reaches both; docked, these two links do, riding the milestone strip's row. A link,
 * not a switch item: `?section=` docked names the pane to open and scroll to, it chooses nothing.
 *
 * The Chain's door closes dead end 8 (returning-trader j1 s6 in `e2e/journeys/`): docked Trade had
 * no entry to the standalone chain at all — the route listed it and nothing drew a way in.
 */
export function BenchDoors(): ReactElement {
  return (
    <span className="trade-bench-doors">
      <Link
        className="trade-guidance-link"
        to="/trade"
        search={(prev) => ({ ...prev, section: "guidance" as const })}
      >
        Guidance for this stock
      </Link>
      <Link
        className="trade-guidance-link"
        to="/trade"
        search={(prev) => ({ ...prev, section: "chain" as const })}
      >
        Options chain
      </Link>
    </span>
  );
}
