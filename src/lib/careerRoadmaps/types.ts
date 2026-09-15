export interface CareerDay {
  /** Global 1-based index across the whole track. */
  day: number;
  title: string;
  tasks: string[];
}

export interface CareerPhase {
  key: string;
  name: string;
  goal: string;
  days: CareerDay[];
}

export interface CareerTrack {
  slug: string;
  name: string;
  emoji: string;
  tagline: string;
  blurb: string;
  /** Tailwind-token-based accent class used for the hub card ring. */
  accent: string;
  phases: CareerPhase[];
}

/** Flattens a track's phases into one ordered list of days. */
export const trackDays = (track: CareerTrack): CareerDay[] =>
  track.phases.flatMap((p) => p.days);

export const trackDayCount = (track: CareerTrack): number =>
  track.phases.reduce((n, p) => n + p.days.length, 0);

/** Assigns sequential day numbers to phases defined with local day lists. */
export function numberPhases(
  phases: Array<Omit<CareerPhase, "days"> & { days: Array<Omit<CareerDay, "day">> }>,
): CareerPhase[] {
  let n = 0;
  return phases.map((p) => ({
    ...p,
    days: p.days.map((d) => ({ ...d, day: ++n })),
  }));
}
