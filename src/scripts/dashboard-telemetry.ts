import { dirname } from "node:path";
import { startProcessGauge } from "../server/process-gauge.js";
import { openRunMarker, runMarkerPath } from "../server/run-marker.js";
import { formatStoreSizes, measureStores, STORE_SIZES_INTERVAL_MS } from "../server/store-sizes.js";
import { reportUncleanRestart, resolveIncidentConfig } from "../server/unclean-restart-report.js";

/**
 * Production telemetry for the dashboard (#4618, slice 6 of #4612), wired in two moments:
 *
 *   - `bootTelemetry` runs FIRST in `main()` — it must read the last run's marker before this run
 *     overwrites it, and a boot that dies on the way up should still leave a marker behind;
 *   - `listening()` runs once the server is up — the gauge, the store sizes, and (when the last
 *     run died) the incident report, none of which may slow the boot members are waiting on.
 *
 * `cleanExit()` belongs to the SIGTERM drain's exit and nowhere else: removing the marker is the
 * process saying "I chose this exit", so any other path out leaves it for the next boot to report.
 */
export function bootTelemetry(
  env: NodeJS.ProcessEnv,
  mode: "live" | "offline",
  log: (line: string) => void = (line) => console.log(line),
): { listening: () => void; cleanExit: () => void } {
  const marker = openRunMarker(runMarkerPath(env), env.GIT_SHA ?? null, undefined, log);
  const mount = dirname(env.SKYNET_HISTORY_DIR ?? "data/history");

  return {
    listening: () => {
      const logStores = (): void => log(formatStoreSizes(measureStores(env, mount)));
      logStores();
      setInterval(logStores, STORE_SIZES_INTERVAL_MS).unref();
      startProcessGauge({
        log,
        onReading: (r) =>
          marker.touch({ rssMb: r.rssMb, peakRssMb: r.peakRssMb, loopMaxMs: r.loopMaxMs }),
      });
      if (marker.previous) {
        void reportUncleanRestart(marker.previous, {
          config: resolveIncidentConfig(env),
          live: mode === "live",
          now: new Date(),
          log,
          reported: marker.reported,
        });
      }
    },
    cleanExit: marker.clear,
  };
}
