/**
 * The Alpaca `client_order_id` a bot stamps on every option order, immediately before submit — never
 * a playbook. It ENCODES the persona and the underlying, so a resting order is recognizable as ours
 * and as being on that ticker (the no-stacking fence), and a boot sweep can cancel every order a
 * crashed process left behind by its prefix alone. About 40 characters, inside Alpaca's 128 and the
 * `CLIENT_ORDER_ID_PATTERN` alphabet.
 *
 *   sk1-<persona slug, ≤16>-<UNDERLYING>-<epoch ms base 36>-<index in the cycle>
 */

const slug = (personaId: string): string =>
  personaId
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 16);

/** Every client order id this persona's bot stamps starts with this. */
export function clientOrderIdPrefix(personaId: string): string {
  return `sk1-${slug(personaId)}-`;
}

export function clientOrderIdFor(
  personaId: string,
  underlying: string,
  atMs: number,
  index: number,
): string {
  return `${clientOrderIdPrefix(personaId)}${underlying}-${atMs.toString(36)}-${index}`;
}
