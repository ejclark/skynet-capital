import { create } from "zustand";

/**
 * Viewer preferences — theme and density (#738 phase 1). Pure client state (Zustand, not Query):
 * the server has no opinion about how a viewer likes their board. Persisted per browser; the
 * un-stamped default is DARK (Eric, round 3) — an explicit choice stamps `data-theme` on <html>
 * so the CSS token overrides in theme.css win in both directions, and `data-density` narrows the
 * spacing tokens without any component redefining itself.
 *
 * THE SHELL FLAG (`?shell=watchtower`, #3807 slice 3a) is retired (#3977, 2026-09-30): the tower
 * left the calendar head for the page frame's own column, for everyone (`vantage.tsx`).
 *
 * THE TOWER'S MOTION (#3807 slice 3a-3 → 3b-1): `live` (the Eye's constant slow sweep) is the
 * default by Eric's pick (2026-09-27: "the subtle animation in the background offers
 * opportunities"); `still` — one frame at rest, animating only while the Eye looks at a day or a
 * filter the member picks — is the member's own setting, Settings → Display → "Tower motion"
 * (`setCrest`), the WCAG 2.2.2 pause for the tower's ambient motion. It applies to every tower
 * view: the page frame's column (`vantage.tsx`) and the boxed character card's (`sauron-card.tsx`).
 * `?crest=still|live` still sets it from a URL, so a compare link keeps working.
 *
 * THE CARD COMPARE (`?card=art|league`, #3807 slice 3b-1) is retired (#3977, 2026-09-30): Eric
 * picked neither — one big tower in the page frame's own column (`frame.tsx`, `vantage.tsx`).
 */

export type Theme = "dark" | "light";
export type Density = "comfortable" | "compact";

const THEME_KEY = "skynet-theme";
const DENSITY_KEY = "skynet-density";
const CREST_KEY = "skynet-crest";

/** The tower at rest: `live` (the default sweep) or `still` (one frame, live only on regard). */
export type Crest = "live" | "still";

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

function initialTheme(): Theme {
  const stored = readStored(THEME_KEY, ["dark", "light"] as const);
  if (stored) return stored;
  // dark-first: only an explicit OS light preference flips the un-stamped default
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

interface PrefsState {
  readonly theme: Theme;
  readonly density: Density;
  readonly crest: Crest;
  readonly setCrest: (crest: Crest) => void;
  readonly setTheme: (theme: Theme) => void;
  readonly setDensity: (density: Density) => void;
}

export const usePrefs = create<PrefsState>((set) => {
  const theme = initialTheme();
  const density = readStored(DENSITY_KEY, ["comfortable", "compact"] as const) ?? "comfortable";
  // Stamp only what was explicitly stored so the system-following default keeps following the
  // system; density always stamps (it has no OS equivalent to defer to).
  stamp(readStored(THEME_KEY, ["dark", "light"] as const), density);
  return {
    theme,
    density,
    crest: initialCrest(),
    setCrest: (next) => {
      storeCrest(next);
      set({ crest: next });
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
