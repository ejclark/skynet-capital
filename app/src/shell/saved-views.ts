import { create } from "zustand";

/**
 * SAVED VIEWS (#738 phase 3b) — the Projects pattern on the blotter: a named filter query,
 * saved as a tab. Pure client state (Zustand + localStorage, the prefs.ts pattern): a view is a
 * viewer's own way of looking, so the server has no opinion and no other member ever sees it.
 * The filter itself stays URL state on the desk route — a tab click just writes the URL.
 */

export interface SavedView {
  readonly id: string;
  readonly name: string;
  readonly q: string;
}

const VIEWS_KEY = "skynet-desk-views";
const VIEW_CAP = 8;
const NAME_CAP = 24;

type ViewsByDesk = Readonly<Record<string, readonly SavedView[]>>;

function isSavedView(value: unknown): value is SavedView {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === "string" && typeof v.name === "string" && typeof v.q === "string";
}

function readStoredViews(): ViewsByDesk {
  try {
    const raw = localStorage.getItem(VIEWS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    const clean: Record<string, readonly SavedView[]> = {};
    for (const [desk, views] of Object.entries(parsed)) {
      if (Array.isArray(views)) clean[desk] = views.filter(isSavedView).slice(0, VIEW_CAP);
    }
    return clean;
  } catch {
    return {};
  }
}

function persist(byDesk: ViewsByDesk): void {
  try {
    localStorage.setItem(VIEWS_KEY, JSON.stringify(byDesk));
  } catch {
    /* a viewer without storage still keeps the session's views in memory */
  }
}

const newId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `v-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

interface SavedViewsState {
  readonly byDesk: ViewsByDesk;
  /** Save the current query as a new named tab; returns it (or null at the cap) for selection. */
  readonly addView: (deskId: string, name: string, q: string) => SavedView | null;
  /** Overwrite a view's query — the "Save" on a dirty tab. */
  readonly saveView: (deskId: string, id: string, q: string) => void;
  readonly removeView: (deskId: string, id: string) => void;
}

export const useSavedViews = create<SavedViewsState>((set, get) => ({
  byDesk: readStoredViews(),
  addView: (deskId, name, q) => {
    const views = get().byDesk[deskId] ?? [];
    const trimmed = name.trim().slice(0, NAME_CAP);
    if (trimmed === "" || views.length >= VIEW_CAP) return null;
    const view: SavedView = { id: newId(), name: trimmed, q };
    const byDesk = { ...get().byDesk, [deskId]: [...views, view] };
    persist(byDesk);
    set({ byDesk });
    return view;
  },
  saveView: (deskId, id, q) => {
    const views = get().byDesk[deskId] ?? [];
    const byDesk = {
      ...get().byDesk,
      [deskId]: views.map((view) => (view.id === id ? { ...view, q } : view)),
    };
    persist(byDesk);
    set({ byDesk });
  },
  removeView: (deskId, id) => {
    const views = get().byDesk[deskId] ?? [];
    const byDesk = { ...get().byDesk, [deskId]: views.filter((view) => view.id !== id) };
    persist(byDesk);
    set({ byDesk });
  },
}));

export const viewCapReached = (views: readonly SavedView[]): boolean => views.length >= VIEW_CAP;
