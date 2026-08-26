/**
 * The boundary between the alert substrate and wherever "I've already seen this" is kept.
 *
 * Dismissal is the one piece of alert state that must outlive the process: a member who waves an
 * alert away and reloads the page has said something durable. Everything else in `src/alerts/` is
 * in-memory and pure, so this is the substrate's only outward reach — an in-memory adapter backs
 * the specs, and a JSONL/volume-backed one can drop in later with nothing upstream changing.
 *
 * The unit is a FINGERPRINT (`alertFingerprint`), not an alert id: producers that re-derive their
 * signals mint a fresh id each poll, and keying on that would re-show what was just dismissed.
 */
export interface AlertDismissalsPort {
  /** Fingerprints this consumer has already dismissed. Empty is a real answer: nothing dismissed. */
  loadDismissed(consumerId: string): Promise<readonly string[]>;
  /** Record one dismissal. Must be idempotent — re-dismissing is a no-op, never an error. */
  dismiss(consumerId: string, fingerprint: string): Promise<void>;
}
