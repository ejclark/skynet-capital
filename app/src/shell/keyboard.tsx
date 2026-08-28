import { useNavigate } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";

/**
 * THE KEYBOARD GRAMMAR (#738 phase 4d) — GitHub's chord language, transplanted whole: `g` then a
 * letter jumps to a view, `/` drops into the page's filter, `?` shows the map. Three rules keep it
 * polite: chords never fire while the viewer is typing (input/textarea/select/contenteditable),
 * the `g` prefix expires after a second, and every shortcut is discoverable — `?` IS the docs.
 */

/** In-shell chord targets (router navigation). */
const SHELL_CHORDS: readonly (readonly [string, string, string])[] = [
  ["s", "/", "Standings"],
  ["t", "/trade", "Trade ticket"],
  ["w", "/wire", "The Wire"],
];

/** Server-rendered chord targets (full navigation, honestly cross-linked like the topbar). */
const SERVER_CHORDS: readonly (readonly [string, string, string])[] = [
  ["r", "/research", "Research"],
  ["c", "/collections", "Collections"],
  ["m", "/learn", "Milestones"],
];

const CHORD_WINDOW_MS = 1000;

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable === true
  );
}

/** The page's filter input, when the current view has one (the desk blotter's bar). */
function focusFilter(): boolean {
  const input = document.querySelector<HTMLInputElement>(".filter-query input");
  if (!input) return false;
  input.focus();
  input.select();
  return true;
}

function ShortcutRow({ keys, label }: { readonly keys: string; readonly label: string }) {
  return (
    <div className="kbd-row">
      <span className="kbd-keys">
        {keys.split(" ").map((k) => (
          <kbd key={k}>{k}</kbd>
        ))}
      </span>
      <span>{label}</span>
    </div>
  );
}

/** The `g <letter>` jump, resolved against both chord tables. True when the chord landed. */
function jumpTo(key: string, navigate: (opts: { to: string }) => unknown): boolean {
  const shell = SHELL_CHORDS.find(([k]) => k === key);
  if (shell) {
    void navigate({ to: shell[1] });
    return true;
  }
  const server = SERVER_CHORDS.find(([k]) => k === key);
  if (server) {
    window.location.assign(server[1]);
    return true;
  }
  return false;
}

export function KeyboardChords(): ReactElement | null {
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);
  const pendingG = useRef<number>(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      switch (e.key) {
        case "Escape":
          setHelpOpen(false);
          return;
        case "?":
          e.preventDefault();
          setHelpOpen((open) => !open);
          return;
        case "/":
          if (focusFilter()) e.preventDefault();
          return;
        case "g":
        case "G":
          pendingG.current = Date.now();
          return;
        default: {
          const armed = Date.now() - pendingG.current <= CHORD_WINDOW_MS;
          pendingG.current = 0;
          if (armed && jumpTo(e.key.toLowerCase(), navigate)) e.preventDefault();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  if (!helpOpen) return null;
  return (
    <div className="kbd-scrim">
      <dialog className="kbd-help" open aria-label="Keyboard shortcuts">
        <h2>Keyboard shortcuts</h2>
        <div className="kbd-cols">
          <div>
            <h3>Go to</h3>
            {[...SHELL_CHORDS, ...SERVER_CHORDS].map(([k, , label]) => (
              <ShortcutRow key={k} keys={`g ${k}`} label={label} />
            ))}
          </div>
          <div>
            <h3>On the page</h3>
            <ShortcutRow keys="/" label="Focus the filter" />
            <ShortcutRow keys="?" label="This map" />
            <ShortcutRow keys="esc" label="Close" />
          </div>
        </div>
        <button type="button" className="kbd-close" onClick={() => setHelpOpen(false)}>
          Close
        </button>
      </dialog>
    </div>
  );
}
