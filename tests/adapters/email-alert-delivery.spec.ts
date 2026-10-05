import {
  createAlertDelivery,
  EmailAlertDelivery,
  RESEND_ENDPOINT,
} from "../../src/adapters/email-alert-delivery.js";

/**
 * The email transport: one POST, the provider's own refusal reported in words, and an environment
 * missing either half of the credential reading as "no transport" with the reason — never as a
 * transport that silently drops.
 */

const message = { to: "ann@x.com", subject: "[Act now] NVDA", text: "body" };

function stubFetch(answer: {
  readonly ok?: boolean;
  readonly status?: number;
  readonly body?: unknown;
}): {
  fetchFn: typeof fetch;
  calls: { url: string; init: RequestInit }[];
} {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchFn = ((url: string, init: RequestInit) => {
    calls.push({ url, init });
    return Promise.resolve({
      ok: answer.ok ?? true,
      status: answer.status ?? 200,
      json: () => Promise.resolve(answer.body ?? {}),
      text: () => Promise.resolve(typeof answer.body === "string" ? answer.body : ""),
    } as Response);
  }) as unknown as typeof fetch;
  return { fetchFn, calls };
}

describe("EmailAlertDelivery", () => {
  it("posts the message as plain text to the provider, bearing the key", async () => {
    const { fetchFn, calls } = stubFetch({ body: { id: "msg-1" } });
    const transport = new EmailAlertDelivery({
      apiKey: "k",
      from: "Skynet <alerts@x.com>",
      fetchFn,
    });
    expect(await transport.send(message)).toEqual({ ok: true, id: "msg-1" });
    const [call] = calls;
    if (!call) throw new Error("expected one call");
    expect(call.url).toBe(RESEND_ENDPOINT);
    expect((call.init.headers as Record<string, string>).authorization).toBe("Bearer k");
    expect(JSON.parse(String(call.init.body))).toEqual({
      from: "Skynet <alerts@x.com>",
      to: ["ann@x.com"],
      subject: "[Act now] NVDA",
      text: "body",
    });
  });

  it("reports the provider's refusal in words rather than throwing", async () => {
    const { fetchFn } = stubFetch({ ok: false, status: 422, body: "domain not verified" });
    const transport = new EmailAlertDelivery({ apiKey: "k", from: "a@x.com", fetchFn });
    const receipt = await transport.send(message);
    expect(receipt.ok).toBe(false);
    expect(receipt.ok === false && receipt.reason).toContain("422");
    expect(receipt.ok === false && receipt.reason).toContain("domain not verified");
  });

  it("reports an unreachable provider rather than taking the caller down", async () => {
    const fetchFn = (() => Promise.reject(new Error("ENOTFOUND"))) as unknown as typeof fetch;
    const transport = new EmailAlertDelivery({ apiKey: "k", from: "a@x.com", fetchFn });
    const receipt = await transport.send(message);
    expect(receipt.ok === false && receipt.reason).toContain("ENOTFOUND");
  });
});

describe("createAlertDelivery", () => {
  it("says why there is no transport when either half of the credential is missing", () => {
    expect(createAlertDelivery({})).toEqual({
      reason: "no mail credential is set on this deployment",
    });
    expect(createAlertDelivery({ SKYNET_ALERT_EMAIL_API_KEY: "k" })).toEqual({
      reason: "no verified sender address is set on this deployment",
    });
  });

  it("builds the transport once both halves are set", () => {
    const built = createAlertDelivery({
      SKYNET_ALERT_EMAIL_API_KEY: "k",
      SKYNET_ALERT_EMAIL_FROM: "alerts@x.com",
    });
    expect("port" in built && built.port.channel).toBe("email");
    expect("port" in built && built.port.from).toBe("alerts@x.com");
  });
});
