import { type ErrorComponentProps, Link, useRouter } from "@tanstack/react-router";
import { type ErrorInfo, type ReactElement, useEffect } from "react";

/**
 * Keep the app on screen when a route fails (#4614, slice 2 of #4612's stability audit).
 *
 * WHY: no route had an error boundary, so TanStack's only catcher sat ABOVE the root shell. One
 * failed chunk or one bad render replaced the whole app — topbar, nav and Moneypenny's rail — with a
 * bare "Something went wrong!", and Back or a manual reload was the only way out. The audit
 * reproduced it with a real deploy pair (40f0a5f0 → d7671dd5): a tab opened before the deploy
 * clicked Trade, asked for a chunk the new build no longer had, and blanked.
 *
 * WHAT: `main.tsx` passes `routeErrorOptions` to `createRouter`, which gives every route match its
 * own boundary (TanStack wraps a match in one only when an error component exists), so a failure
 * renders inside the root layout's `<Outlet/>` and the topbar stays.
 *  - A STALE CHUNK (the tab's code map points at files a deploy replaced) reloads the page ONCE —
 *    index.html is served `no-store`, so the reload picks up the new build. A timestamped
 *    sessionStorage marker guards it: a second failure inside `RELOAD_WINDOW_MS` shows a message
 *    with a manual Reload instead, so it can never loop. TanStack's own reload-once only matches
 *    native-ESM error text, which rspack's `ChunkLoadError` never produces.
 *  - ANY OTHER ERROR says so in plain words inside the route area, with the error's own message,
 *    "Try again" (re-runs the route) and Reload.
 *  - Only an error in the root layout itself may replace the shell (`ShellError`, `__root.tsx`).
 * The server half: a missing `/app/static/*` file now answers 404 instead of index.html
 * (`src/server/app-shell-routes.ts`), so a gone chunk fails as a chunk failure.
 */

/** sessionStorage key holding the time (ms) of the last automatic reload. */
export const RELOAD_MARKER = "skynet:stale-chunk-reload";

/** A second stale-chunk failure this soon after an automatic reload means reloading did not help. A
 *  minute covers a slow phone's reload-and-navigate; real deploys land minutes apart. */
export const RELOAD_WINDOW_MS = 60_000;

/** The page-level effects, behind one object so specs can stand them in. */
export const pageControls = {
  reload(): void {
    window.location.reload();
  },
  now(): number {
    return Date.now();
  },
};

/** These three are also what TanStack's `lazyRouteComponent` matches (router-core
 *  `isModuleNotFoundError`), and it reloads once under its own `tanstack_router_reload:*` key before
 *  rethrowing. So if a native-ESM failure ever reached us, the tab could reload twice — theirs, then
 *  ours — before our marker gives up: bounded, not a loop. Dormant today: rspack's runtime throws
 *  `ChunkLoadError` ("Loading chunk N failed"), which only our match catches. */
const NATIVE_IMPORT_FAILED = [
  /Failed to fetch dynamically imported module/, // Chromium
  /error loading dynamically imported module/, // Firefox
  /Importing a module script failed/, // Safari
];

/**
 * True when `error` means this tab's code is out of date (or its chunk never arrived): rspack's
 * `ChunkLoadError` ("Loading chunk N failed", "Loading CSS chunk N failed"), a browser's native
 * dynamic-import failure, or a page served where a script was expected (`Unexpected token '<'`).
 * An HTML body read as JSON is a data error, not a chunk, and stays out.
 */
export function isStaleChunkError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const { name, message } = error as { name?: unknown; message?: unknown };
  if (name === "ChunkLoadError") return true;
  if (typeof message !== "string") return false;
  if (/Loading (CSS )?chunk \S+ failed/.test(message)) return true;
  if (NATIVE_IMPORT_FAILED.some((re) => re.test(message))) return true;
  return name === "SyntaxError" && /Unexpected token '?<'?/.test(message) && !/JSON/.test(message);
}

type ChunkOutcome = "reloading" | "gave-up";

/** One decision per error object: a re-render (or StrictMode's double render) asks again and must
 *  get the same answer, never a second reload. */
const decided = new WeakMap<object, ChunkOutcome>();
const reloadsSent = new WeakSet<object>();

function readMarker(): number | undefined {
  try {
    const at = Number(sessionStorage.getItem(RELOAD_MARKER));
    return Number.isFinite(at) && at > 0 ? at : undefined;
  } catch {
    return undefined;
  }
}

function chunkOutcome(error: object): ChunkOutcome {
  const known = decided.get(error);
  if (known) return known;
  const now = pageControls.now();
  const last = readMarker();
  let outcome: ChunkOutcome =
    last !== undefined && now - last >= 0 && now - last < RELOAD_WINDOW_MS
      ? "gave-up"
      : "reloading";
  if (outcome === "reloading") {
    try {
      sessionStorage.setItem(RELOAD_MARKER, String(now));
    } catch {
      outcome = "gave-up"; // no marker means no guard, and a reload without a guard could loop
    }
  }
  decided.set(error, outcome);
  return outcome;
}

/** The reload decision for an error, and the reload itself (once, after commit). */
function useStaleChunkRecovery(error: unknown): ChunkOutcome | undefined {
  const outcome =
    isStaleChunkError(error) && typeof error === "object" && error !== null
      ? chunkOutcome(error)
      : undefined;
  useEffect(() => {
    if (outcome !== "reloading" || typeof error !== "object" || error === null) return;
    if (reloadsSent.has(error)) return;
    reloadsSent.add(error);
    pageControls.reload();
  }, [error, outcome]);
  return outcome;
}

/** What a member reads: the error's own message when it has one, else what was thrown. */
function errorText(error: unknown): string {
  if (error instanceof Error) return error.message || error.name;
  if (typeof error === "string") return error;
  return "An unknown error.";
}

function WarningIcon(): ReactElement {
  return (
    <svg
      className="route-fault-icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3.5 2.5 20h19L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12 10v4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="17.2" r="1.1" fill="currentColor" />
    </svg>
  );
}

function ReloadButton({ primary = false }: { readonly primary?: boolean }): ReactElement {
  return (
    <button
      type="button"
      className={primary ? "btn btn-primary" : "btn"}
      onClick={() => pageControls.reload()}
    >
      Reload
    </button>
  );
}

/** The panel every failure state shares: an icon and a heading in words (never colour alone), the
 *  explanation, the error's own text, and the way out. */
function FaultPanel({
  title,
  children,
  detail,
  actions,
}: {
  readonly title: string;
  readonly children: string;
  readonly detail?: string;
  readonly actions: ReactElement;
}): ReactElement {
  return (
    <section className="route-fault" role="alert" aria-labelledby="route-fault-title">
      <h1 className="route-fault-head" id="route-fault-title">
        <WarningIcon />
        {title}
      </h1>
      <p className="route-fault-body">{children}</p>
      {detail ? <pre className="route-fault-detail">{detail}</pre> : null}
      <div className="route-fault-actions">{actions}</div>
    </section>
  );
}

/** The route area a failure renders into — the same frame and `<main>` a page would have had. This
 *  is `PageFrame towerless` (`frame.tsx`) written out on purpose: the fallback must not depend on
 *  the tower-column hook or anything else that could be the thing that just threw. */
function RouteArea({ children }: { readonly children: ReactElement }): ReactElement {
  return (
    <div className="frame">
      <main id="main" className="stage">
        {children}
      </main>
    </div>
  );
}

function StaleChunk({ outcome }: { readonly outcome: ChunkOutcome }): ReactElement {
  if (outcome === "reloading") {
    return (
      <p className="route-fault-status" role="status">
        The app was updated while this tab was open — loading the newest version…
      </p>
    );
  }
  return (
    <FaultPanel title="This page couldn't load" actions={<ReloadButton primary />}>
      Its code didn't arrive. The app may have just been updated or be restarting, or the connection
      dropped. Reload in a moment to get the newest version.
    </FaultPanel>
  );
}

/**
 * The default error component for every route below the root: renders inside the root layout's
 * `<Outlet/>`, so the topbar stays and a click on it leaves the error behind.
 */
export function RouteError({ error, reset }: ErrorComponentProps): ReactElement {
  const router = useRouterOrNull();
  const outcome = useStaleChunkRecovery(error);
  if (outcome) {
    return (
      <RouteArea>
        <StaleChunk outcome={outcome} />
      </RouteArea>
    );
  }
  return (
    <RouteArea>
      <FaultPanel
        title="This page hit an error"
        detail={errorText(error)}
        actions={
          <>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                reset();
                void router?.invalidate();
              }}
            >
              Try again
            </button>
            <ReloadButton />
          </>
        }
      >
        The rest of the app still works — pick another view above, or try this page again.
      </FaultPanel>
    </RouteArea>
  );
}

/** `useRouter` without its missing-router warning: the specs also render `RouteError` bare. */
function useRouterOrNull(): ReturnType<typeof useRouter> | null {
  return useRouter({ warn: false }) ?? null;
}

/** The root route's error component — the one case that replaces the shell, because the shell
 *  itself is what failed. A plain link home does a full page load rather than trusting the router. */
export function ShellError({ error }: ErrorComponentProps): ReactElement {
  const outcome = useStaleChunkRecovery(error);
  return (
    <div className="route-fault-page">
      <p className="route-fault-brand">Skynet Capital</p>
      {outcome ? (
        <StaleChunk outcome={outcome} />
      ) : (
        <FaultPanel
          title="The app hit an error"
          detail={errorText(error)}
          actions={
            <>
              <ReloadButton primary />
              <a className="btn" href="/app/leaderboard">
                Go to the leaderboard
              </a>
            </>
          }
        >
          The menu and the page around it couldn't draw. Reloading usually clears this.
        </FaultPanel>
      )}
    </div>
  );
}

/** The default not-found component: an address no route owns, said plainly inside the shell. */
export function RouteNotFound(): ReactElement {
  return (
    <RouteArea>
      <section className="route-fault" aria-labelledby="route-fault-title">
        <h1 className="route-fault-head" id="route-fault-title">
          There's no page at this address
        </h1>
        <p className="route-fault-body">The link may be old, or the address mistyped.</p>
        <div className="route-fault-actions">
          <Link className="btn btn-primary" to="/leaderboard" search={{ by: "equity" }}>
            Go to the leaderboard
          </Link>
        </div>
      </section>
    </RouteArea>
  );
}

/** One caught route error — the body `POST /api/client-error` accepts (`client-error-route.ts`). */
interface RouteErrorReport {
  readonly kind: "stale-chunk" | "render";
  readonly name: string;
  readonly message: string;
  readonly path: string;
}

/** The longest message the server keeps; anything longer is cut here rather than refused there. */
const BEACON_MESSAGE_MAX = 500;

/** The browser error beacon (#4618, slice 6 of #4612): a caught route error reaches the server log
 *  instead of only the member's console. Fire-and-forget — `keepalive` lets it outlive the reload
 *  a stale chunk triggers, and a failed beacon must never become a second error. */
function sendErrorBeacon(report: RouteErrorReport): void {
  if (typeof fetch === "undefined") return;
  const body = JSON.stringify({ ...report, message: report.message.slice(0, BEACON_MESSAGE_MAX) });
  void fetch("/api/client-error", {
    method: "POST",
    credentials: "same-origin",
    keepalive: true,
    headers: { "content-type": "application/json" },
    body,
  }).catch(() => undefined);
}

/** `defaultOnCatch`: every error a route boundary catches passes through here. */
export function reportRouteError(error: unknown, info?: Pick<ErrorInfo, "componentStack">): void {
  // biome-ignore lint/suspicious/noConsole: the console keeps the stack and component trace the beacon leaves out.
  console.error("[skynet] route error", error, info?.componentStack);
  sendErrorBeacon({
    kind: isStaleChunkError(error) ? "stale-chunk" : "render",
    name: error instanceof Error ? error.name : typeof error,
    message: errorText(error),
    path: typeof location === "undefined" ? "" : location.pathname,
  });
}

/** The router options `main.tsx` spreads into `createRouter` (and the specs mount with). */
export const routeErrorOptions = {
  defaultErrorComponent: RouteError,
  defaultNotFoundComponent: RouteNotFound,
  defaultOnCatch: reportRouteError,
} as const;
