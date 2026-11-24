import { useQuery } from "@tanstack/react-query";
import type { DeskPosition } from "../live/desk";
import { fetchOptionPositions } from "../live/options";

/**
 * AN OPTION'S STOCK PRICE, READ WHERE THE ROW IS ACTED ON (#7383 slice 1). A sold option is judged
 * on its strike before its premium (`position-mark.ts` → `soldMark`), so its Consider badge needs
 * the stock's price — the blotter's marks read it off the option book (`use-row-marks.ts`), and the
 * two close paths (the row's Close, the guidance sheet's Place) and the Roll read the same one here,
 * so a buy-back carries the badge the member actually saw into `lockInFlag`.
 *
 * Same cache key and staleness as the blotter, the Money strip and Trade's option card: inside the
 * blotter the book is already read, so this is one more observer on that read, not a second
 * request. Undefined for a share row, and until the book answers — `lockInFlag` then flags no sold
 * option (a badge we cannot confirm is a celebration we must not make).
 */
export function useHeldSpot(deskId: string, position: DeskPosition): number | undefined {
  const book = useQuery({
    queryKey: ["option-positions", deskId],
    queryFn: () => fetchOptionPositions(deskId),
    enabled: position.isOption,
    staleTime: 30_000,
  });
  return position.isOption
    ? book.data?.rows.find((r) => r.symbol === position.symbol)?.spot
    : undefined;
}
