// Type surface for routing.mjs — same arrangement as scripts/crawl/phone.d.mts (`allowJs` is off).

export interface WorldRequest {
  method: string;
  url: URL;
  path: string;
  params: URLSearchParams;
}

export type WorldAnswer = (req: WorldRequest) => { status?: number; body: unknown } | undefined;

export type Routed =
  | { kind: "stream" }
  | { kind: "write"; status: number; body: unknown }
  | { kind: "json"; status: number; body: unknown }
  | { kind: "unstubbed" };

export function wantsEventStream(path: string, accept?: string): boolean;
export function routeRequest(
  req: { method: string; url: URL; accept?: string },
  answer: WorldAnswer,
): Routed;
