import type { ReactElement } from "react";
import { useId, useState } from "react";
import { SymbolField } from "./symbol-field";

/**
 * A PANE THAT NEEDS A SYMBOL ASKS FOR ONE ITSELF (#3807 slice 2e, dead end 3). Trade's Chart, Chain
 * and Guidance panes read the same `?symbol=` the ticket commits; folded to one pane at a time, the
 * ticket is not on screen, so "pick a symbol on the Ticket" sent the member away to do it. The
 * sentence and the field now sit in one note: the field is the ticket's own `SymbolField`, and a
 * commit writes `?symbol=` exactly as the ticket's does (`trade.tsx`'s `commitSymbol`), so every
 * pane — the ticket too, when it remounts — follows.
 *
 * Without `onCommit` it is the sentence alone: docked, the ticket's own field is beside the pane,
 * and a second input there would write `?symbol=` under a mounted ticket that does not follow it.
 */
export function SymbolPrompt({
  ask,
  onCommit,
}: {
  /** What the pane will show once a symbol is picked, said as the ask. */
  readonly ask: string;
  readonly onCommit?: (symbol: string) => void;
}): ReactElement {
  const id = useId();
  const [value, setValue] = useState("");
  if (!onCommit) return <p className="note">{ask}</p>;
  return (
    <div className="note symbol-prompt">
      <span>{ask}</span>
      <SymbolField
        id={id}
        label="Symbol"
        value={value}
        placeholder="AAPL"
        maxLength={12}
        onChange={setValue}
        onCommit={(s) => {
          if (s.trim() !== "") onCommit(s);
        }}
      />
    </div>
  );
}
