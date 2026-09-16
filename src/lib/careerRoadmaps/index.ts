import { CareerTrack } from "./types";
import { sweTrack } from "./swe";
import { cyberTrack } from "./cyber";
import { cloudTrack } from "./cloud";
import { uiuxTrack } from "./uiux";

export * from "./types";

export const CAREER_TRACKS: CareerTrack[] = [
  sweTrack,
  cyberTrack,
  cloudTrack,
  uiuxTrack,
];

export const getTrack = (slug?: string): CareerTrack | undefined =>
  CAREER_TRACKS.find((t) => t.slug === slug);
