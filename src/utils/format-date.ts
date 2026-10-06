/** Format a content-collection date without shifting the calendar day. */
export function formatEventDate(value: Date): string {
  const iso = value.toISOString().slice(0, 10);
  const [year, month, day] = iso.split('-').map(Number);
  const stable = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(stable);
}

export function isPastEvent(value: Date, now = new Date()): boolean {
  const iso = value.toISOString().slice(0, 10);
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Denver',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  return iso < today;
}
