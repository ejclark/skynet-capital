import type { DeliveryMessage } from "../alerts/alert-delivery.js";
import type { AlertDeliveryPort, DeliveryReceipt } from "../ports/alert-delivery.js";

/**
 * THE EMAIL TRANSPORT (#3407 P4 slice 3) — one `fetch` to a provider's HTTP send API, no SDK.
 *
 * Why no library: a mail SDK is a new RUNTIME dependency, and runtime dependencies are the
 * protected class in `envelope.json` — they would make this PR Eric's manual merge for a reason
 * that has nothing to do with the credential. The whole transport is one POST with a JSON body, so
 * the dependency buys nothing and costs a gate.
 *
 * Why Resend's shape as the default: one bearer key, one endpoint, plain-text bodies, and a free
 * tier that sends to a verified address — which is all this feature can ever do, because the
 * destination is always the member's own authenticated address (`alert-delivery.ts`). The endpoint
 * is injectable so specs drive it with a stub `fetch` and no network, and so a different
 * provider with the same `{from,to,subject,text}` body needs no new adapter.
 *
 * Failure is reported, never thrown and never swallowed: a refusal comes back as
 * `{ ok: false, reason }` and the dispatcher leaves the alert unmarked, so the next sweep tries
 * again rather than recording a send that never happened.
 */

export const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** How long a send may take before it is a failure. A hung provider must not hold the sweep. */
const SEND_TIMEOUT_MS = 10_000;

export interface EmailDeliveryOptions {
  readonly apiKey: string;
  /** The verified sender, e.g. `Skynet Capital <alerts@example.com>`. */
  readonly from: string;
  readonly endpoint?: string;
  readonly fetchFn?: typeof fetch;
  readonly timeoutMs?: number;
}

export class EmailAlertDelivery implements AlertDeliveryPort {
  readonly channel = "email" as const;
  readonly from: string;
  private readonly apiKey: string;
  private readonly endpoint: string;
  private readonly fetchFn: typeof fetch;
  private readonly timeoutMs: number;

  constructor(options: EmailDeliveryOptions) {
    this.apiKey = options.apiKey;
    this.from = options.from;
    this.endpoint = options.endpoint ?? RESEND_ENDPOINT;
    this.fetchFn = options.fetchFn ?? fetch;
    this.timeoutMs = options.timeoutMs ?? SEND_TIMEOUT_MS;
  }

  async send(message: DeliveryMessage): Promise<DeliveryReceipt> {
    const abort = AbortSignal.timeout(this.timeoutMs);
    let res: Response;
    try {
      res = await this.fetchFn(this.endpoint, {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          from: this.from,
          to: [message.to],
          subject: message.subject,
          text: message.text,
        }),
        signal: abort,
      });
    } catch (error) {
      return { ok: false, reason: `the mail provider could not be reached — ${String(error)}` };
    }
    if (!res.ok) {
      // The provider's own words, truncated: a 422 for an unverified sender is the single most
      // likely failure and its message is the fix.
      const body = await res.text().catch(() => "");
      return {
        ok: false,
        reason: `the mail provider refused it (${res.status}) ${body.slice(0, 200)}`.trim(),
      };
    }
    const parsed = (await res.json().catch(() => undefined)) as { id?: unknown } | undefined;
    return typeof parsed?.id === "string" ? { ok: true, id: parsed.id } : { ok: true };
  }
}

/**
 * Build the transport from the environment, or say why there isn't one. Both halves of the
 * credential are required: a key with no verified sender cannot send, and reporting that as
 * "delivery is on" would be the silent-drop failure the plan's done line forbids.
 */
export function createAlertDelivery(
  env: NodeJS.ProcessEnv,
): { readonly port: AlertDeliveryPort } | { readonly reason: string } {
  const apiKey = env.SKYNET_ALERT_EMAIL_API_KEY;
  const from = env.SKYNET_ALERT_EMAIL_FROM;
  if (!apiKey) return { reason: "no mail credential is set on this deployment" };
  if (!from) return { reason: "no verified sender address is set on this deployment" };
  return { port: new EmailAlertDelivery({ apiKey, from }) };
}
