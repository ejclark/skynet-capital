import { type RefObject, useEffect, useRef } from "react";

/**
 * Escape and a click outside both close a toggle-button popover; Escape hands focus back to the
 * button. A click outside lets focus go where the member clicked rather than pulling it back.
 * Shared by the top bar's member menu and the bot heartbeat chip (#4949), so the app's floating
 * popovers never close differently. (The bar's status line is not one: its panel sits in the flow
 * and closes only on its own tap or Escape — `session-status.tsx` says why.) `close` should be
 * stable (`useCallback`) — a new one per render re-binds the listeners every render.
 */
export function useDismiss(
  open: boolean,
  close: () => void,
): {
  readonly wrapRef: RefObject<HTMLDivElement | null>;
  readonly buttonRef: RefObject<HTMLButtonElement | null>;
} {
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        buttonRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, close]);
  return { wrapRef, buttonRef };
}
