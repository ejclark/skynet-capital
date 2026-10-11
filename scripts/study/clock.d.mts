// Type surface for clock.mjs (`allowJs` is off; same arrangement as metrics.d.mts).

export interface Clock {
  timeZone: string;
  locale: string;
}

export function ownerOf(membersDir: string): string;
export const DEFAULT_CLOCK: Readonly<Clock>;
export function declaredClock(markdown: string): Clock | null;
export function parseClock(text: string | undefined): Clock;
export function clockArg(clock: Clock): string;
export function memberClock(member: string, membersDir: string): Clock;
export function roundClock(members: string[], membersDir: string): Clock;
