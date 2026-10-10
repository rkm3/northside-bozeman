import type { CollectionEntry } from 'astro:content';
import { isPastEvent } from './format-date';

type Event = CollectionEntry<'events'>;

const byDateAsc = (a: Event, b: Event) => a.data.date.getTime() - b.data.date.getTime();

/** Upcoming events soonest first; past events most recent first. */
export function splitEvents(events: Event[], now = new Date()) {
  const upcoming = events.filter((event) => !isPastEvent(event.data.date, now)).sort(byDateAsc);
  const past = events
    .filter((event) => isPastEvent(event.data.date, now))
    .sort((a, b) => byDateAsc(b, a));
  return { upcoming, past };
}

/** The event to spotlight: a featured upcoming one, else the next one, else the latest past one. */
export function pickSpotlightEvent(events: Event[], now = new Date()): Event | undefined {
  const { upcoming, past } = splitEvents(events, now);
  return upcoming.find((event) => event.data.featured) ?? upcoming[0] ?? past[0];
}

/** Summer and Winter Stroll event files are named `<year>-<season>-stroll`. */
export function isStrollEvent(event: Event): boolean {
  return /(?:^|-)stroll$/.test(event.id);
}

/** Soonest upcoming stroll, if any — used by the stable `/northside-stroll` URL. */
export function pickNextStrollEvent(events: Event[], now = new Date()): Event | undefined {
  const { upcoming } = splitEvents(events, now);
  return upcoming.find(isStrollEvent);
}

const IMAGE_EXTENSIONS = /\.(avif|gif|jpe?g|png|webp)$/i;

export function isImageFile(path: string): boolean {
  return IMAGE_EXTENSIONS.test(path);
}
