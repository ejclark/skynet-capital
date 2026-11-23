// Type surface for steps.mjs — same arrangement as coverage.d.mts (`allowJs` is off). The schema
// these types describe is docs/members/README.md → "The journey file".

/** One `expect` entry, also the aim of an action (docs/members/README.md → `expect` entries). */
export interface ExpectEntry {
  readonly url?: string;
  readonly text?: string;
  readonly role?: string;
  readonly name?: string;
  readonly testid?: string;
  readonly exact?: boolean;
  readonly within?: string;
  readonly href?: string;
  readonly absent?: boolean;
}

/** One action of a step's `act`: click · fill · press · await, each aimed by an expect entry. */
export type Action =
  | { readonly click: ExpectEntry }
  | { readonly fill: ExpectEntry; readonly value: string }
  | { readonly press: ExpectEntry; readonly key: string }
  | { readonly await: ExpectEntry };

export interface Step {
  readonly id: string;
  readonly goto: string;
  readonly only?: "phone" | "desktop";
  readonly sees?: string;
  readonly ears: string;
  readonly expect: readonly ExpectEntry[];
  readonly act?: Action | readonly Action[];
  readonly after?: readonly ExpectEntry[];
  readonly known_gap?: string;
  readonly where?: string;
  readonly severity?: string;
  readonly fix?: string;
  readonly judge?: string;
}

export interface Journey {
  readonly id: string;
  readonly name: string;
  readonly viewports?: readonly ("phone" | "desktop")[];
  readonly steps: readonly Step[];
}

export interface MemberJourneys {
  readonly file: string;
  readonly member: string;
  readonly source: string;
  readonly fixture: { readonly kind: "session" | "anonymous"; readonly email?: string };
  readonly viewports?: readonly ("phone" | "desktop")[];
  readonly journeys: readonly Journey[];
}

export interface Held {
  readonly ok: boolean;
  readonly detail: string;
}

// The page is Playwright's; typed loosely so the specs can pass a fake one.
// biome-ignore lint/suspicious/noExplicitAny: a Playwright Page or a test's stand-in
type AnyPage = any;

export const VIEWPORTS: Record<
  "phone" | "desktop",
  { viewport: { width: number; height: number }; hasTouch: boolean }
>;
export const ACT_TIMEOUT_MS: number;

export function loadJourneys(dir?: string): MemberJourneys[];
export function viewportsFor(member: MemberJourneys, journey: Journey): ("phone" | "desktop")[];
export function stepRunsAt(step: Step, viewport: "phone" | "desktop"): boolean;
export function describeExpect(e: ExpectEntry): string;
export function locatorFor(page: AnyPage, e: ExpectEntry): AnyPage;
export function expectHolds(page: AnyPage, e: ExpectEntry, timeout?: number): Promise<Held>;
export function actionsOf(act: Step["act"] | unknown): unknown[];
export function describeAction(a: unknown): string;
export function performAct(page: AnyPage, act: Step["act"] | unknown): Promise<void>;
export function afterMisses(page: AnyPage, step: { readonly after?: unknown }): Promise<string[]>;
export function settle(page: AnyPage): Promise<void>;
export function sessionCookie(
  token: string,
  baseURL: string,
): { name: string; value: string; domain: string; path: string };
