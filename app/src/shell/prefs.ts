import { create } from "zustand";

/**
 * Viewer preferences — theme and density (#738 phase 1). Pure client state (Zustand, not Query):
 * the server has no opinion about how a viewer likes their board. Persisted per browser; the
 * un-stamped default is DARK (Eric, round 3) — an explicit choice stamps `data-theme` on <html>
 * so the CSS token overrides in theme.css win in both directions, and `data-density` narrows the
 * spacing tokens without any component redefining itself.
 */

export type Theme = "dark" | "light";
export type Density = "comfortable" | "compact";

const THEME_KEY = "skynet-theme";
const DENSITY_KEY = "skynet-density";

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

function initialTheme(): Theme {
  const stored = readStored(THEME_KEY, ["dark", "light"] as const);
  if (stored) return stored;
  // dark-first: only an explicit OS light preference flips the un-stamped default
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

interface PrefsState {
  readonly theme: Theme;
  readonly density: Density;
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
