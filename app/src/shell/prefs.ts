import { create } from "zustand";

/**
 * Viewer preferences — theme and density (#738 phase 1). Pure client state (Zustand, not Query):
 * the server has no opinion about how a viewer likes their board. Persisted per browser; the
 * un-stamped default is DARK (Eric, round 3) — an explicit choice stamps `data-theme` on <html>
 * so the CSS token overrides in theme.css win in both directions, and `data-density` narrows the
 * spacing tokens without any component redefining itself.
 *
 * THE SHELL FLAG (#3807 slice 3a): `?shell=watchtower` on any URL opts this viewer into the next
 * shell — today, the tower's crest at the calendar band's right cap (`vantage.tsx`). It is stored
 * per browser, so it survives navigation and reloads, and `?shell=off` clears it. It stamps
 * `data-shell="watchtower"` on <html> so the band's CSS can make room for the crest. Invisible
 * unless asked for: nothing in the app links to it.
 *
 * THE TOWER'S MOTION (#3807 slice 3a-3 → 3b-1): `live` (the Eye's constant slow sweep) is the
 * default by Eric's pick (2026-09-27: "the subtle animation in the background offers
 * opportunities"); `still` — one frame at rest, animating only while the Eye looks at a day or a
 * filter the member picks — is the member's own setting, Settings → Display → "Tower motion"
 * (`setCrest`), the WCAG 2.2.2 pause for the tower's ambient motion. It applies to every tower
 * view: the calendar head's (`vantage.tsx`) and the character card's (`sauron-card.tsx`).
 * `?crest=still|live` still sets it from a URL, so a compare link keeps working.
 *
 * THE CARD COMPARE (#3807 slice 3b-1, only while the flag is on): with the flag the Profile
 * page's Overview draws two towers — the head's and the character card's 664px art, which Eric
 * placed himself (#3725/#3727). Retiring the art is his call, made by eye: `?card=league` shows
 * the card without its art where the head's tower shows (≥861px), `?card=art` (the default) keeps
 * it. Stored like the motion, so the pick survives navigation.
 */

export type Theme = "dark" | "light";
export type Density = "comfortable" | "compact";

const THEME_KEY = "skynet-theme";
const DENSITY_KEY = "skynet-density";
const SHELL_KEY = "skynet-shell";
const CREST_KEY = "skynet-crest";
const CARD_KEY = "skynet-card";

/** The opt-in shell, or `undefined` for today's. */
export type Shell = "watchtower" | undefined;

/** The tower at rest: `live` (the default sweep) or `still` (one frame, live only on regard). */
export type Crest = "live" | "still";

/** The character card beside the head's tower: its `art` (default) or the `league` alone. */
export type CardPick = "art" | "league";

function readStored<T extends string>(key: string, allowed: readonly T[]): T | undefined {
  try {
    const value = localStorage.getItem(key);
    return allowed.includes(value as T) ? (value as T) : undefined;
  } catch {
    return undefined;
  }
}

function stamp(theme: Theme | undefined, density: Density): void {
  const root = document.documentElement;
  if (theme) root.setAttribute("data-theme", theme);
  if (density === "compact") root.setAttribute("data-density", "compact");
  else root.removeAttribute("data-density");
}

function stampShell(shell: Shell): void {
  if (shell) document.documentElement.setAttribute("data-shell", shell);
  else document.documentElement.removeAttribute("data-shell");
}

function storeShell(shell: Shell): void {
  try {
    if (shell) localStorage.setItem(SHELL_KEY, shell);
    else localStorage.removeItem(SHELL_KEY);
  } catch {
    /* no storage: the flag lasts this page load */
  }
}

/** `?shell=watchtower` sets the flag, `?shell=off` clears it; otherwise the stored choice. */
export function shellFromUrl(search: string, stored: Shell): Shell {
  const asked = new URLSearchParams(search).get("shell");
  if (asked === "watchtower") return "watchtower";
  if (asked === "off") return undefined;
  return stored;
}

function initialShell(): Shell {
  const stored = readStored(SHELL_KEY, ["watchtower"] as const);
  let search = "";
  try {
    search = window.location.search;
  } catch {
    /* no location: keep what is stored */
  }
  const shell = shellFromUrl(search, stored);
  if (shell !== stored) storeShell(shell);
  return shell;
}

/** `?crest=still` picks the still crest, `?crest=live` today's; otherwise the stored choice. */
export function crestFromUrl(search: string, stored: Crest | undefined): Crest {
  const asked = new URLSearchParams(search).get("crest");
  if (asked === "still" || asked === "live") return asked;
  return stored ?? "live";
}

function initialCrest(): Crest {
  const stored = readStored(CREST_KEY, ["still"] as const);
  let search = "";
  try {
    search = window.location.search;
  } catch {
    /* no location: keep what is stored */
  }
  const crest = crestFromUrl(search, stored);
  if (crest !== (stored ?? "live")) storeCrest(crest);
  return crest;
}

function storeCrest(crest: Crest): void {
  try {
    if (crest === "still") localStorage.setItem(CREST_KEY, crest);
    else localStorage.removeItem(CREST_KEY);
  } catch {
    /* no storage: the choice lasts this page load */
  }
}

/** `?card=league` picks the art-less card, `?card=art` the default; otherwise the stored choice. */
export function cardFromUrl(search: string, stored: CardPick | undefined): CardPick {
  const asked = new URLSearchParams(search).get("card");
  if (asked === "art" || asked === "league") return asked;
  return stored ?? "art";
}

function storeCard(card: CardPick): void {
  try {
    if (card === "league") localStorage.setItem(CARD_KEY, card);
    else localStorage.removeItem(CARD_KEY);
  } catch {
    /* no storage: the choice lasts this page load */
  }
}

function initialCard(): CardPick {
  const stored = readStored(CARD_KEY, ["league"] as const);
  let search = "";
  try {
    search = window.location.search;
  } catch {
    /* no location: keep what is stored */
  }
  const card = cardFromUrl(search, stored);
  if (card !== (stored ?? "art")) storeCard(card);
  return card;
}

function initialTheme(): Theme {
  const stored = readStored(THEME_KEY, ["dark", "light"] as const);
  if (stored) return stored;
  // dark-first: only an explicit OS light preference flips the un-stamped default
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

interface PrefsState {
  readonly theme: Theme;
  readonly density: Density;
  readonly shell: Shell;
  readonly crest: Crest;
  readonly card: CardPick;
  readonly setCrest: (crest: Crest) => void;
  readonly setCard: (card: CardPick) => void;
  readonly setTheme: (theme: Theme) => void;
  readonly setDensity: (density: Density) => void;
  readonly setShell: (shell: Shell) => void;
}

export const usePrefs = create<PrefsState>((set) => {
  const theme = initialTheme();
  const density = readStored(DENSITY_KEY, ["comfortable", "compact"] as const) ?? "comfortable";
  // Stamp only what was explicitly stored so the system-following default keeps following the
  // system; density always stamps (it has no OS equivalent to defer to).
  stamp(readStored(THEME_KEY, ["dark", "light"] as const), density);
  const shell = initialShell();
  stampShell(shell);
  return {
    theme,
    density,
    shell,
    crest: initialCrest(),
    card: initialCard(),
    setCrest: (next) => {
      storeCrest(next);
      set({ crest: next });
    },
    setCard: (next) => {
      storeCard(next);
      set({ card: next });
    },
    setShell: (next) => {
      storeShell(next);
      stampShell(next);
      set({ shell: next });
    },
    setTheme: (next) => {
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        /* a viewer without storage still gets the session's choice */
      }
      document.documentElement.setAttribute("data-theme", next);
      set({ theme: next });
    },
    setDensity: (next) => {
      try {
        localStorage.setItem(DENSITY_KEY, next);
      } catch {
        /* same */
      }
      stamp(undefined, next);
      set({ density: next });
    },
  };
});
