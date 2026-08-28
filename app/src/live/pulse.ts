/**
 * The Pulse page's client model (#738 phase 4a) — mirrors `DeskPulseView` on the server. All
 * figures arrive formatted and all geometry arrives normalized 0..1; this module fetches and
 * types, the route draws, nothing re-derives a number.
 */

export interface PulsePointData {
  readonly x: number;
  readonly y: number;
}

export interface PulseCurveData {
  readonly points: readonly PulsePointData[];
  readonly startLabel: string;
  readonly endLabel: string;
  readonly lowLabel: string;
  readonly highLabel: string;
  readonly peak: string;
  readonly drawdown: string;
  readonly drawdownTone: "neg" | "flat";
}

export interface PulseWeekData {
  readonly label: string;
  readonly pl: string;
  readonly tone: "pos" | "neg" | "flat";
  readonly bar: number;
}

export interface PulseTileData {
  readonly label: string;
  readonly value: string;
  readonly note: string;
  readonly tone?: "pos" | "neg" | "flat";
}

export interface PulseRaceData {
  readonly line: string;
  readonly progress: number;
  readonly doubled: boolean;
}

export interface DeskPulse {
  readonly curve: PulseCurveData | null;
  readonly weeks: readonly PulseWeekData[];
  readonly tiles: readonly PulseTileData[];
  readonly race: PulseRaceData | null;
}

export async function fetchDeskPulse(id: string): Promise<DeskPulse> {
  const res = await fetch(`/api/desk/${encodeURIComponent(id)}/pulse`, {
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error(`pulse ${res.status}`);
  const body = (await res.json()) as { pulse: DeskPulse };
  return body.pulse;
}
