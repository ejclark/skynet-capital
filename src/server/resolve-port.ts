/**
 * Resolve the port the dashboard server listens on. Hosting platforms (Fly, Render, etc.)
 * inject `PORT`; locally we honor `SKYNET_DASHBOARD_PORT`; otherwise a sensible default.
 * Pure over its `env` argument so the precedence is unit-testable.
 */
export function resolvePort(env: Readonly<Record<string, string | undefined>>): number {
  const candidate = env.PORT ?? env.SKYNET_DASHBOARD_PORT;
  const parsed = candidate ? Number(candidate) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 8787;
}
