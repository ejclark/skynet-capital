// The small pieces every pr-review CLI shares, kept once so they cannot drift apart.
import { readFileSync } from "node:fs";

/** A `--name value` flag's value, or undefined. */
export const flag = (args, name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

/** envelope.json's protected list. envelope-scan's own default is empty when imported. */
export const envelopeRules = () =>
  JSON.parse(readFileSync("envelope.json", "utf8")).protected ?? [];

/** The work gate's verdict; a gate that throws is a refusal that says why, never a pass. */
export function readGate(gate) {
  try {
    return gate();
  } catch (err) {
    return { dispatch: false, reason: `refused: ${String(err?.message ?? err).slice(0, 200)}` };
  }
}
