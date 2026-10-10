/** Trim and validate the public Maps API key from the environment. */
export function getGoogleMapsApiKey(): string {
  const raw = import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY;
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  return /^[A-Za-z0-9_-]{10,}$/.test(trimmed) ? trimmed : '';
}
