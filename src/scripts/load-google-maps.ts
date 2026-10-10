type MapsApi = {
  Map: unknown;
};

declare global {
  interface Window {
    gm_authFailure?: () => void;
    google?: { maps: MapsApi };
  }
}

/** Load the Maps JavaScript API once; safe to call from multiple mounts. */
export function loadGoogleMaps(key: string, onAuthFailure: () => void): Promise<void> {
  window.gm_authFailure = onAuthFailure;
  if (window.google?.maps) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-northside-maps]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Maps script failed to load')));
      return;
    }
    const script = document.createElement('script');
    script.dataset.northsideMaps = '';
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Maps script failed to load'));
    document.head.appendChild(script);
  });
}
