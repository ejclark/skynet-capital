import type { KeyboardEvent, ReactElement } from "react";
import { useId, useState } from "react";
// First app→root import in the repo (2026-09-08): the ticker directory is pure data with zero
// dependencies, and its spec in tests/domain reconciles it against the research desk's
// tracked-underlyings list, so one copy is the honest one. Whether app/src should share
// src/domain generally (vs. hand-duplicated shapes as app/src/live/*.ts does today) is an open
// question logged in docs/IDEAS.md, not a precedent this line sets.
import { searchTickers, type TickerEntry } from "../../../src/domain/ticker-directory/index";

/**
 * THE SYMBOL FIELD (#738 phase 10, slice 8a) — intellisense over the curated ticker directory on
 * top of a plain text input. A miss is NEVER a block: the field always accepts free text and
 * commits it uppercased/trimmed, exactly as the raw `<input>` it replaces did — the directory only
 * ranks suggestions while a member is typing, it doesn't gate what they can submit. A live Alpaca
 * fallback for directory misses is a later slice (8b), not this one.
 *
 * Mobile-first: the suggestion list is an in-flow block directly under the input, never a floating
 * overlay — at 390px an overlay can run off the viewport. The active row is marked with a left
 * border and bolder weight, never colour alone (a standing reader is red/green colourblind).
 */
export function SymbolField({
  id,
  label,
  value,
  placeholder,
  maxLength,
  onChange,
  onCommit,
}: {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly placeholder?: string;
  readonly maxLength?: number;
  readonly onChange: (raw: string) => void;
  readonly onCommit: (symbol: string) => void;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listId = useId();

  const suggestions = searchTickers(value);
  const showList = open && suggestions.length > 0;
  const activeOptionId =
    activeIndex >= 0 && activeIndex < suggestions.length
      ? `${listId}-opt-${activeIndex}`
      : undefined;

  const commitEntry = (entry: TickerEntry) => {
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
          setOpen(searchTickers(raw).length > 0);
          setActiveIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          setOpen(false);
          setActiveIndex(-1);
          const trimmed = value.trim().toUpperCase();
          if (trimmed !== "") onCommit(trimmed);
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
