// Type surface for server-reads.mjs — same arrangement as scripts/crawl/phone.d.mts (`allowJs` is off).

export function serverRead(
  url: string,
  config: unknown,
  channel: unknown,
  session: unknown,
): Promise<{ status: number; body: unknown } | undefined>;
