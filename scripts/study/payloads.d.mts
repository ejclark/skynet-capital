// Type surface for payloads.mjs — same arrangement as scripts/crawl/phone.d.mts (`allowJs` is off).

import type { WorldAnswer } from "./routing.mjs";

export interface ComposedAnswer {
  url: string;
  status: number;
  body: unknown;
  source: string;
}

export interface ManifestRow {
  viewer: string;
  key: string;
  status: number;
  source: string;
  sha256: string;
}

export function canonicalUrl(input: string | URL): string;
export function writeViewer(dir: string, viewer: string, answers: ComposedAnswer[]): ManifestRow[];
export function answerFrom(dir: string, viewer: string): WorldAnswer;
