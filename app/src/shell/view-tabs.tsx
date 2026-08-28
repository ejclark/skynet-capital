import type { ReactElement } from "react";
import { useId, useState } from "react";
import { type SavedView, useSavedViews, viewCapReached } from "./saved-views";

/**
 * VIEW TABS (#738 phase 3b) — the Projects view model on the blotter. Each tab is a saved filter
 * query; "All positions" is the implicit first tab (q="", not saved, not deletable). The one
 * honesty rule transplanted from Projects: **the unsaved-changes dot** — edit the filter while a
 * saved view is selected and the tab says so until you Save it or click away. Selection is local
 * (a view is this browser's own way of looking); the query it writes is URL state on the route.
 */

const NO_VIEWS: readonly SavedView[] = [];

function NewViewForm({
  onAdd,
  onCancel,
}: {
  readonly onAdd: (name: string) => void;
  readonly onCancel: () => void;
}): ReactElement {
  const [name, setName] = useState("");
  const inputId = useId();
  return (
    <form
      className="view-new-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim() !== "") onAdd(name);
      }}
    >
      <label className="visually-hidden" htmlFor={inputId}>
        Name this view
      </label>
      <input
        id={inputId}
        value={name}
        maxLength={24}
        placeholder="Name this view…"
        // biome-ignore lint/a11y/noAutofocus: the form only exists because the viewer just asked for it
        autoFocus
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
        }}
      />
      <button type="submit" className="view-save-btn" disabled={name.trim() === ""}>
        Save view
      </button>
    </form>
  );
}

export function ViewTabs({
  deskId,
  query,
  onPick,
}: {
  readonly deskId: string;
  readonly query: string;
  readonly onPick: (q: string) => void;
}): ReactElement {
  // NO_VIEWS is a module constant: a selector must return a STABLE reference for an absent desk,
  // or useSyncExternalStore sees a new snapshot every render and loops (React #185).
  const views = useSavedViews((s) => s.byDesk[deskId] ?? NO_VIEWS);
  const addView = useSavedViews((s) => s.addView);
  const saveView = useSavedViews((s) => s.saveView);
  const removeView = useSavedViews((s) => s.removeView);
  // On first render, land on the saved view whose query the URL already carries (a shared or
  // refreshed link re-selects its tab); otherwise the implicit All tab.
  const [selected, setSelected] = useState<string | null>(
    () => views.find((view) => view.q === query.trim())?.id ?? null,
  );
  const [naming, setNaming] = useState(false);

  const current = views.find((view) => view.id === selected);
  const dirty = current !== undefined && query.trim() !== current.q;

  const pick = (view: SavedView | null) => {
    setSelected(view?.id ?? null);
    setNaming(false);
    onPick(view?.q ?? "");
  };

  return (
    <nav className="view-tabs" aria-label="Saved views">
      <button
        type="button"
        className="view-tab"
        aria-current={current === undefined}
        onClick={() => pick(null)}
      >
        All positions
      </button>
      {views.map((view) => (
        <span key={view.id} className="view-tab-wrap">
          <button
            type="button"
            className="view-tab"
            aria-current={view.id === selected}
            onClick={() => pick(view)}
          >
            {view.name}
            {view.id === selected && dirty ? (
              <span className="view-dirty" title="Filter edited — not saved">
                ●
              </span>
            ) : null}
          </button>
          {view.id === selected ? (
            <button
              type="button"
              className="view-del"
              aria-label={`Delete view ${view.name}`}
              onClick={() => {
                removeView(deskId, view.id);
                pick(null);
              }}
            >
              ×
            </button>
          ) : null}
        </span>
      ))}
      {naming ? (
        <NewViewForm
          onAdd={(name) => {
            const view = addView(deskId, name, query.trim());
            if (view) setSelected(view.id);
            setNaming(false);
          }}
          onCancel={() => setNaming(false)}
        />
      ) : (
        <button
          type="button"
          className="view-tab view-add"
          disabled={viewCapReached(views)}
          title={viewCapReached(views) ? "Eight views is plenty — delete one first" : undefined}
          onClick={() => setNaming(true)}
        >
          + New view
        </button>
      )}
      {dirty && current ? (
        <button
          type="button"
          className="view-save-btn"
          onClick={() => saveView(deskId, current.id, query.trim())}
        >
          Save to “{current.name}”
        </button>
      ) : null}
    </nav>
  );
}
