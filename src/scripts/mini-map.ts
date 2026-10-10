import { loadGoogleMaps } from './load-google-maps';

type LatLng = { lat: number; lng: number };

export type MiniMapConfig = {
  key: string;
  points: Array<LatLng & { fill: string; stroke: string }>;
  boundaryRing: LatLng[];
  boundaryStyle: {
    fill: string;
    fillOpacity: number;
    stroke: string;
    strokeOpacity: number;
  };
  center: LatLng;
};

type MapHandle = {
  fitBounds: (bounds: BoundsHandle, padding: number) => void;
};

type BoundsHandle = {
  extend: (point: LatLng) => void;
};

type MapsApi = {
  Map: new (element: HTMLElement, options: Record<string, unknown>) => MapHandle;
  Marker: new (options: Record<string, unknown>) => { setMap: (map: MapHandle | null) => void };
  Polygon: new (options: Record<string, unknown>) => { setMap: (map: MapHandle | null) => void };
  LatLngBounds: new () => BoundsHandle;
  SymbolPath: { CIRCLE: unknown };
};

declare global {
  interface Window {
    google?: { maps: MapsApi };
  }
}

const MAP_STYLES = [
  { featureType: 'all', elementType: 'all', stylers: [{ saturation: -100 }, { gamma: 0.98 }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

export function mountMiniMap(config: MiniMapConfig): void {
  const mapElement = document.getElementById('northside-minimap');
  const fallback = document.querySelector<HTMLElement>('[data-minimap-fallback]');
  if (!config.key || !mapElement) return;

  const fail = () => {
    mapElement.replaceChildren();
    fallback?.classList.remove('hidden');
  };

  loadGoogleMaps(config.key, fail)
    .then(() => {
      const maps = window.google?.maps;
      if (!maps) {
        fail();
        return;
      }

      const map = new maps.Map(mapElement, {
        center: config.center,
        zoom: 15,
        disableDefaultUI: true,
        gestureHandling: 'none',
        keyboardShortcuts: false,
        clickableIcons: false,
        draggable: false,
        scrollwheel: false,
        disableDoubleClickZoom: true,
        styles: MAP_STYLES,
      });

      const style = config.boundaryStyle;
      new maps.Polygon({
        paths: config.boundaryRing,
        strokeColor: style.stroke,
        strokeOpacity: style.strokeOpacity,
        strokeWeight: 2,
        fillColor: style.fill,
        fillOpacity: style.fillOpacity,
        clickable: false,
        zIndex: 0,
        map,
      }).setMap(map);

      const bounds = new maps.LatLngBounds();
      for (const point of config.boundaryRing) bounds.extend(point);
      for (const point of config.points) {
        bounds.extend(point);
        new maps.Marker({
          position: { lat: point.lat, lng: point.lng },
          map,
          clickable: false,
          icon: {
            path: maps.SymbolPath.CIRCLE,
            scale: 5,
            fillColor: point.fill,
            fillOpacity: 1,
            strokeColor: point.stroke,
            strokeWeight: 1.5,
          },
        });
      }
      map.fitBounds(bounds, 36);
      fallback?.classList.add('hidden');
    })
    .catch(fail);
}
