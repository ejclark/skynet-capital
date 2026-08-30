/**
 * THE OPS-STATUS SHAPE — pulled out as its own leaf module so the three files that
 * all need it (`ops-status-service.ts`, `ops-status-deploy-verdict.ts`, `ops-status-deploy-lag.ts`)
 * can depend on it without depending on EACH OTHER through it — a shared-types-through-the-service-
 * module import cycle is exactly what tripped `scripts/dep-graph-scan.mjs`'s `no-circular` rule the
 * first time this shipped. This module imports nothing of its own; it only ever gets imported.
 */

type SignalVerdict = "ok" | "attention" | "unknown";

export interface OpsSignalLink {
  readonly href: string;
  readonly label: string;
}

export interface OpsSignal {
  readonly id: string;
  readonly label: string;
  readonly verdict: SignalVerdict;
  readonly detail: string;
  readonly link?: OpsSignalLink;
}

export interface OpsStatus {
  readonly generatedAt: string;
  /** True when the deploy signals are running without a GitHub token — the honest smaller panel,
   *  not an error state. */
  readonly degraded: boolean;
  readonly signals: readonly OpsSignal[];
}
