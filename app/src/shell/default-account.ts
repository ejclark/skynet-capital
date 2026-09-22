import { create } from "zustand";

/**
 * THE DEFAULT ACCOUNT — which owned account the Cockpit opens on when the URL names none
 * (Eric, 2026-09-22: with a human account and a bot account both on the board, he wants Sauron's
 * behavior in front of him by default — not whichever account happens to sort first). Same
 * pattern as `prefs.ts`/`saved-views.ts`: pure client state, a viewer's own way of looking, the
 * server has no opinion. `accounts.tsx` reads it only as a FALLBACK — an explicit `?account=` in
 * the URL always wins, and a stored id that no longer names an owned account is ignored rather
 * than trusted blindly.
 */

const DEFAULT_ACCOUNT_KEY = "skynet-default-account";

function readStored(): string | undefined {
  try {
    return localStorage.getItem(DEFAULT_ACCOUNT_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

interface DefaultAccountState {
  readonly id: string | undefined;
  readonly setDefault: (id: string) => void;
  readonly clearDefault: () => void;
}

export const useDefaultAccount = create<DefaultAccountState>((set) => ({
  id: readStored(),
  setDefault: (id) => {
    try {
      localStorage.setItem(DEFAULT_ACCOUNT_KEY, id);
    } catch {
      /* a viewer without storage still keeps the choice for this session */
    }
    set({ id });
  },
  clearDefault: () => {
    try {
      localStorage.removeItem(DEFAULT_ACCOUNT_KEY);
    } catch {
      /* same */
    }
    set({ id: undefined });
  },
}));
