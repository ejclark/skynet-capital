import type { KeyboardEvent, ReactElement } from "react";
import { useEffect, useId, useRef, useState } from "react";
// First app→root import in the repo (2026-09-08): the ticker directory is pure data with zero
// dependencies, and its spec in tests/domain reconciles it against the research desk's
// tracked-underlyings list, so one copy is the honest one. Whether app/src should share
// src/domain generally (vs. hand-duplicated shapes as app/src/live/*.ts does today) is an open
// question logged in docs/IDEAS.md, not a precedent this line sets.
import { searchTickers, type TickerEntry } from "../../../src/domain/ticker-directory/index";
import { fetchSymbolSearch, type SymbolHit } from "../live/symbol-search";

/**
 * THE SYMBOL FIELD (#738 phase 10, slice 8a; live tier-2 fallback added Phase 0.8b) —
 * intellisense over the curated ticker directory on top of a plain text input. A miss is NEVER a
 * block: the field always accepts free text and commits it uppercased/trimmed, exactly as the raw
 * `<input>` it replaces did — the directory only ranks suggestions while a member is typing, it
 * doesn't gate what they can submit. On a curated-directory miss (tier 1 empty) for a query of at
 * least two characters, a debounced (300ms) live Alpaca asset lookup (tier 2) fills in — never
 * per-keystroke, and never blocking free text either.
 *
 * Mobile-first: the suggestion list is an in-flow block directly under the input, never a floating
 * overlay — at 390px an overlay can run off the viewport. The active row is marked with a left
 * border and bolder weight, never colour alone (a standing reader is red/green colourblind).
 *
 * LEAVING THE FIELD NEVER MOVES THE TAP THAT LEFT IT (change-scenarios faculty run, 2026-11-16).
 * Because the list is in flow, closing it on blur moves everything under it, and committing on
 * blur lets the ticket insert its quote line above the fields. Both used to happen DURING the tap
 * that caused the blur: `mousedown` on the Shares label blurred this field, the form jumped, and
 * `mouseup` landed on the Shares input instead — so the browser sent `click` to their common
 * parent, nothing took focus, and the quantity the member typed next went nowhere (desktop and
 * phone alike; the probe that found it is scripts/faculty/README.md → *What it found*). The blur
 * now defers both until that gesture's `click` has been dispatched (the click target is settled by
 * then), so the in-flow list keeps its 390px reason and the tap lands where the member aimed.
 */
export function SymbolField({
  id,
  label,
  value,
  placeholder,
  maxLength,
  onChange,
  onCommit,
  commitOnBlur = true,
}: {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly placeholder?: string;
  readonly maxLength?: number;
  readonly onChange: (raw: string) => void;
  readonly onCommit: (symbol: string) => void;
  /**
   * Whether leaving the field commits what is in it. True everywhere this field writes something
   * REVERSIBLE — a `?symbol=` a member can retype — which is why it is the default. The watchlist
   * (#4332) sets it false: there, a commit is a durable append to the member's own list, so
   * half-typed text that loses focus (tapping a row blurs the input first) would otherwise persist
   * a name nobody asked for and spend a slot against the cap. Enter and picking a suggestion still
   * commit, so the field loses nothing a member meant to do.
   */
  readonly commitOnBlur?: boolean;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [tier2Hits, setTier2Hits] = useState<readonly SymbolHit[]>([]);
  const listId = useId();
  // Whether a pointer is held right now — on a mouse, `mousedown` blurs this field before
  // `mouseup`, so a blur with the button still down must wait for the gesture's `click`.
  const pointerHeld = useRef(false);
  const afterGesture = useRef<(() => void) | undefined>(undefined);
  useEffect(() => {
    const down = () => {
      pointerHeld.current = true;
    };
    const up = () => {
      pointerHeld.current = false;
    };
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("pointerup", up, true);
    document.addEventListener("pointercancel", up, true);
    return () => {
      document.removeEventListener("pointerdown", down, true);
      document.removeEventListener("pointerup", up, true);
      document.removeEventListener("pointercancel", up, true);
      afterGesture.current?.();
    };
  }, []);
  /** Run `fn` once the tap that blurred the field has finished: on its `click` when a pointer is
   *  still held (a mouse), else on the next task (a touch's synthesized mouseup/click are already
   *  queued behind this blur). A 600ms backstop covers a press that never clicks (a drag away). */
  const whenGestureEnds = (fn: () => void) => {
    afterGesture.current?.();
    let done = false;
    const run = () => {
      if (done) return;
      done = true;
      document.removeEventListener("click", onClick, true);
      clearTimeout(backstop);
      afterGesture.current = undefined;
      fn();
    };
    const onClick = () => setTimeout(run, 0);
    const backstop = setTimeout(run, pointerHeld.current ? 600 : 0);
    if (pointerHeld.current) document.addEventListener("click", onClick, true);
    afterGesture.current = run;
  };

  // Live-value ref for the debounced tier-2 fetch's staleness guard below — avoids a stale
  // closure over `value` from the keystroke that scheduled the fetch.
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(debounceTimer.current), []);

  const tier1 = searchTickers(value);
  // Never merged: tier 2 only ever has something to show when tier 1 is empty by construction
  // (see the onChange handler below).
  const suggestions: readonly { readonly symbol: string; readonly name: string }[] =
    tier1.length > 0 ? tier1 : tier2Hits;
  const showList = open && suggestions.length > 0;
  const activeOptionId =
    activeIndex >= 0 && activeIndex < suggestions.length
      ? `${listId}-opt-${activeIndex}`
      : undefined;

  const commitEntry = (entry: TickerEntry | SymbolHit) => {
    onChange(entry.symbol);
    onCommit(entry.symbol);
    setOpen(false);
    setActiveIndex(-1);
  };

  const commitFreeText = () => {
    onCommit(value.trim().toUpperCase());
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (suggestions.length === 0) return;
      setOpen(true);
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (suggestions.length === 0) return;
      setOpen(true);
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      const active = activeIndex >= 0 ? suggestions[activeIndex] : undefined;
      if (active) {
        e.preventDefault();
        commitEntry(active);
      } else {
        commitFreeText();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className="field symbol-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={activeOptionId}
        spellCheck={false}
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw);
          setActiveIndex(-1);
          clearTimeout(debounceTimer.current);

          const tier1Hits = searchTickers(raw);
          if (tier1Hits.length > 0) {
            // Tier 1 has answers — clear any pending/stale tier-2 fetch and state; the two
            // sources never merge.
            setTier2Hits([]);
            setOpen(true);
            return;
          }
          setTier2Hits([]);
          const trimmed = raw.trim();
          if (trimmed.length < 2) {
            setOpen(false);
            return;
          }
          // No loading affordance by design — the debounce window (300ms) is the only visible
          // latency, and this repo's restraint doctrine says don't manufacture ceremony for it.
          setOpen(false);
          debounceTimer.current = setTimeout(() => {
            fetchSymbolSearch(trimmed)
              .then((result) => {
                // Stale-response guard: only apply if the query this fetch was issued for still
                // matches the CURRENT input value — a since-changed query discards the result.
                if (valueRef.current.trim() !== trimmed) return;
                setTier2Hits(result.hits);
                setOpen(result.hits.length > 0);
              })
              .catch(() => {
                // Fail soft: a tier-2 lookup failure is silent, same doctrine as every other
                // fail-soft feed in this app — free text still works regardless.
              });
          }, 300);
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          setActiveIndex(-1);
          const trimmed = value.trim().toUpperCase();
          whenGestureEnds(() => {
            setOpen(false);
            if (commitOnBlur && trimmed !== "") onCommit(trimmed);
          });
        }}
      />
      {showList ? (
        // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: ARIA 1.2 combobox pattern — the input keeps DOM focus, driving selection via aria-activedescendant below.
        <ul role="listbox" id={listId} className="symbol-listbox">
          {suggestions.map((entry, index) => (
            // biome-ignore lint/a11y/useFocusableInteractive: intentionally unfocusable — aria-activedescendant marks "active", not per-option tabIndex.
            <li
              key={entry.symbol}
              id={`${listId}-opt-${index}`}
              // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: same combobox pattern as the ul above.
              role="option"
              aria-selected={index === activeIndex}
              className={
                index === activeIndex ? "symbol-option symbol-option-active" : "symbol-option"
              }
              onMouseDown={(e) => {
                e.preventDefault();
                commitEntry(entry);
              }}
            >
              {entry.symbol} - {entry.name}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
