// Type surface for steady.mjs — same arrangement as the other scripts/ specs import.

export interface StillShot {
  [key: string]: unknown;
}
export interface ShootPage {
  screenshot(shot?: StillShot): Promise<unknown>;
  evaluate(fn: (selectors: string[]) => string[], selectors?: string[]): Promise<unknown>;
  waitForLoadState(state: string, options: { timeout: number }): Promise<void>;
  clock: { setFixedTime(time: Date): Promise<void> };
}
export interface ShootContext {
  newPage(): Promise<ShootPage>;
}
export interface ShootBrowser {
  newPage(options?: Record<string, unknown>): Promise<ShootPage>;
  newContext(options?: Record<string, unknown>): Promise<ShootContext>;
}
export interface ShootChromium {
  launch(options?: Record<string, unknown>): Promise<ShootBrowser>;
}

export function steady<T extends ShootChromium>(
  chromium: T,
  options?: {
    into?: string;
    clock?: string;
    selectors?: string[];
    onSeen?: (matched: string[], frame?: string) => void;
  },
): T;
