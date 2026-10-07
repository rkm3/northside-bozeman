type LatLng = { lat: number; lng: number };

export type MapPoint = {
  name: string;
  lat: number;
  lng: number;
  slug: string;
  categories: string[];
  categoryLabel: string;
  address: string;
  phone?: string;
  fill: string;
  stroke: string;
  coverSrc?: string;
  coverSquare?: boolean;
  placeHref: string;
  website?: string;
  websiteLabel?: string;
};

export type NeighborhoodMapConfig = {
  key: string;
  points: MapPoint[];
  categoryLegend: { id: string; label: string; fill: string }[];
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
  panTo: (position: LatLng) => void;
};

type BoundsHandle = {
  extend: (point: LatLng) => void;
};

type MarkerHandle = {
  setMap: (map: MapHandle | null) => void;
  addListener: (event: string, handler: () => void) => void;
};

type InfoWindowHandle = {
  setContent: (content: HTMLElement) => void;
  open: (options: { map: MapHandle; anchor: MarkerHandle; shouldFocus: boolean }) => void;
  close: () => void;
};

type MapsApi = {
  Map: new (element: HTMLElement, options: Record<string, unknown>) => MapHandle;
  Marker: new (options: Record<string, unknown>) => MarkerHandle;
  InfoWindow: new (options: Record<string, unknown>) => InfoWindowHandle;
  Polygon: new (options: Record<string, unknown>) => { setMap: (map: MapHandle | null) => void };
  LatLngBounds: new () => BoundsHandle;
  SymbolPath: { CIRCLE: unknown };
  event: { trigger: (instance: MapHandle, name: string) => void };
};

declare global {
  interface Window {
    gm_authFailure?: () => void;
    google?: { maps: MapsApi };
  }
}

const SPREAD_METERS = 20;
const NEAR_METERS = 8000;

function spreadOverlapping(points: MapPoint[]): MapPoint[] {
  if (points.length <= 1) return points.map((point) => ({ ...point }));

  const groups = new Map<string, MapPoint[]>();
  for (const point of points) {
    const key = `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`;
    const group = groups.get(key);
    if (group) group.push(point);
    else groups.set(key, [point]);
  }

  const placed: MapPoint[] = [];
  for (const group of groups.values()) {
    if (group.length === 1) {
      const only = group[0];
      if (only) placed.push({ ...only });
      continue;
    }
    const sorted = [...group].sort((a, b) => a.slug.localeCompare(b.slug));
    sorted.forEach((point, index) => {
      const angle = (2 * Math.PI * index) / sorted.length;
      const latRad = (point.lat * Math.PI) / 180;
      const dLat = (SPREAD_METERS * Math.sin(angle)) / 111320;
      const dLng = (SPREAD_METERS * Math.cos(angle)) / (111320 * Math.cos(latRad));
      placed.push({ ...point, lat: point.lat + dLat, lng: point.lng + dLng });
    });
  }
  return placed;
}

function pointInRing(point: LatLng, ring: LatLng[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const current = ring[i];
    const previous = ring[j];
    if (!current || !previous) continue;
    const crosses =
      current.lat > point.lat !== previous.lat > point.lat &&
      point.lng <
        ((previous.lng - current.lng) * (point.lat - current.lat)) / (previous.lat - current.lat) +
          current.lng;
    if (crosses) inside = !inside;
  }
  return inside;
}

function distanceMeters(a: LatLng, b: LatLng): number {
  const earth = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.asin(Math.min(1, Math.sqrt(h)));
}

function textLine(text: string, className: string): HTMLParagraphElement {
  const line = document.createElement('p');
  line.className = className;
  line.textContent = text;
  return line;
}

function linkLine(href: string, label: string, external = false): HTMLAnchorElement {
  const link = document.createElement('a');
  link.href = href;
  link.textContent = label;
  link.style.color = '#6a2b1d';
  link.style.fontWeight = '600';
  if (external) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
  return link;
}

function buildPlaceCard(point: MapPoint): HTMLElement {
  const card = document.createElement('div');
  card.style.maxWidth = '320px';
  card.style.fontFamily = '"Source Sans 3", sans-serif';
  card.style.color = '#221c17';

  if (point.categoryLabel) {
    const category = textLine(point.categoryLabel, '');
    category.style.margin = '0 0 6px';
    category.style.fontSize = '11px';
    category.style.letterSpacing = '0.08em';
    category.style.textTransform = 'uppercase';
    category.style.color = '#5c5146';
    card.appendChild(category);
  }

  if (point.coverSrc) {
    const image = document.createElement('img');
    image.src = point.coverSrc;
    image.alt = point.name;
    image.width = 320;
    image.height = 180;
    image.style.width = point.coverSquare ? '220px' : '100%';
    image.style.height = point.coverSquare ? '220px' : '160px';
    image.style.objectFit = point.coverSquare ? 'contain' : 'cover';
    image.style.display = 'block';
    if (point.coverSquare) image.style.margin = '0 auto';
    const imageLink = document.createElement('a');
    imageLink.href = point.placeHref;
    imageLink.appendChild(image);
    card.appendChild(imageLink);
  }

  const name = document.createElement('p');
  name.style.margin = '8px 0 0';
  name.style.fontFamily = 'Fraunces, serif';
  name.style.fontSize = '18px';
  name.appendChild(linkLine(point.placeHref, point.name));
  card.appendChild(name);

  const listing = document.createElement('p');
  listing.style.margin = '8px 0 0';
  listing.style.fontSize = '13px';
  listing.appendChild(linkLine(point.placeHref, 'View listing →'));
  card.appendChild(listing);

  if (point.website && point.websiteLabel) {
    const site = document.createElement('p');
    site.style.margin = '4px 0 0';
    site.style.fontSize = '13px';
    site.appendChild(linkLine(point.website, point.websiteLabel, true));
    card.appendChild(site);
  }

  const address = textLine(point.address, '');
  address.style.margin = '6px 0 0';
  address.style.fontSize = '13px';
  address.style.lineHeight = '1.4';
  address.style.color = '#5c5146';
  card.appendChild(address);

  if (point.phone) {
    const phone = document.createElement('p');
    phone.style.margin = '4px 0 0';
    phone.style.fontSize = '13px';
    phone.appendChild(linkLine(`tel:${point.phone.replace(/[^\d+]/g, '')}`, point.phone));
    card.appendChild(phone);
  }

  return card;
}

function buildYouCard(message: string): HTMLElement {
  const card = document.createElement('div');
  card.style.maxWidth = '240px';
  card.style.fontFamily = '"Source Sans 3", sans-serif';
  card.style.color = '#221c17';
  const title = document.createElement('p');
  title.textContent = 'You are here';
  title.style.margin = '0';
  title.style.fontFamily = 'Fraunces, serif';
  title.style.fontSize = '18px';
  const detail = textLine(message, '');
  detail.style.margin = '6px 0 0';
  detail.style.fontSize = '13px';
  detail.style.lineHeight = '1.4';
  detail.style.color = '#5c5146';
  card.append(title, detail);
  return card;
}

function loadMaps(key: string, onAuthFailure: () => void): Promise<void> {
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

function showMapMessage(mapElement: HTMLElement, title: string, body: string): void {
  mapElement.textContent = '';
  const wrap = document.createElement('div');
  wrap.className = 'p-5 text-sm';
  const heading = document.createElement('p');
  heading.className = 'font-serif text-lg text-ink';
  heading.textContent = title;
  const copy = document.createElement('p');
  copy.className = 'mt-2 leading-relaxed text-muted';
  copy.textContent = body;
  wrap.append(heading, copy);
  mapElement.append(wrap);
}

export function mountNeighborhoodMap(config: NeighborhoodMapConfig): void {
  const filterRoot = document.getElementById('place-filters');
  const list = document.getElementById('place-list');
  const empty = document.getElementById('place-filter-empty');
  const legend = document.getElementById('place-legend');
  const youLegend = document.getElementById('you-legend');
  const showMeButton = document.getElementById('show-me-on-map');
  const showMeStatus = document.getElementById('show-me-status');
  let activeCategory = '';

  function setStatus(message: string): void {
    if (showMeStatus) showMeStatus.textContent = message;
  }

  function syncFilters(): void {
    filterRoot?.querySelectorAll<HTMLButtonElement>('button[data-category]').forEach((button) => {
      button.setAttribute('aria-pressed', button.dataset.category === activeCategory ? 'true' : 'false');
    });
  }

  function updateLegend(): void {
    legend?.querySelectorAll<HTMLElement>('[data-legend-cat]').forEach((item) => {
      const id = item.dataset.legendCat ?? '';
      item.classList.toggle('is-dim', Boolean(activeCategory) && id !== activeCategory);
    });
  }

  function updateList(): void {
    if (!list) return;
    let visible = 0;
    list.querySelectorAll<HTMLElement>('[data-categories]').forEach((item) => {
      const categories = (item.dataset.categories ?? '').split(',').filter(Boolean);
      const show = !activeCategory || categories.includes(activeCategory);
      item.classList.toggle('hidden', !show);
      if (show) visible += 1;
    });
    empty?.classList.toggle('hidden', visible > 0);
  }

  filterRoot?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest('button[data-category]');
    if (!(button instanceof HTMLButtonElement)) return;
    activeCategory = button.dataset.category ?? '';
    syncFilters();
    updateLegend();
    updateList();
    redrawPlaces();
  });

  syncFilters();
  updateLegend();
  updateList();

  const mapElement = document.getElementById('neighborhood-map');
  if (!config.key || !mapElement) return;

  let map: MapHandle | null = null;
  let infoWindow: InfoWindowHandle | null = null;
  let maps: MapsApi | null = null;
  let mapReady = false;
  let mapFailed = false;
  const placeMarkers: MarkerHandle[] = [];
  let youMarker: MarkerHandle | null = null;
  let youPosition: LatLng | null = null;
  let youMessage = '';

  function redrawPlaces(): void {
    if (!mapReady || !map || !maps || !infoWindow || mapFailed) return;
    for (const marker of placeMarkers) marker.setMap(null);
    placeMarkers.length = 0;
    infoWindow.close();

    const points = spreadOverlapping(
      config.points.filter(
        (point) => !activeCategory || point.categories.includes(activeCategory),
      ),
    );
    const bounds = new maps.LatLngBounds();
    for (const point of config.boundaryRing) bounds.extend(point);

    for (const point of points) {
      const position = { lat: point.lat, lng: point.lng };
      bounds.extend(position);
      const marker = new maps.Marker({
        position,
        map,
        title: point.name,
        zIndex: 2,
        icon: {
          path: maps.SymbolPath.CIRCLE,
          fillColor: point.fill,
          fillOpacity: 1,
          strokeColor: point.stroke,
          strokeWeight: 2,
          scale: 9,
        },
      });
      marker.addListener('click', () => {
        infoWindow?.setContent(buildPlaceCard(point));
        infoWindow?.open({ map: map as MapHandle, anchor: marker, shouldFocus: false });
      });
      placeMarkers.push(marker);
    }

    if (youPosition && distanceMeters(youPosition, config.center) <= NEAR_METERS) {
      bounds.extend(youPosition);
    }
    map.fitBounds(bounds, 48);
    maps.event.trigger(map, 'resize');
  }

  function placeYou(position: LatLng): void {
    if (!map || !maps || !infoWindow) return;
    const nearby = distanceMeters(position, config.center) <= NEAR_METERS;
    if (!nearby) {
      setStatus('That location is outside this neighborhood, so it isn’t shown on this view.');
      return;
    }
    youPosition = position;
    const inside = pointInRing(position, config.boundaryRing);
    youMessage = inside
      ? 'Inside the approximate Northside boundary.'
      : 'Just outside the approximate Northside boundary.';
    youMarker?.setMap(null);
    const marker = new maps.Marker({
      position,
      map,
      title: 'You are here',
      zIndex: 20,
      icon: {
        path: maps.SymbolPath.CIRCLE,
        fillColor: '#24382e',
        fillOpacity: 1,
        strokeColor: '#b08958',
        strokeWeight: 3,
        scale: 12,
      },
    });
    youMarker = marker;
    marker.addListener('click', () => {
      if (!map) return;
      infoWindow?.setContent(buildYouCard(youMessage));
      infoWindow?.open({ map, anchor: marker, shouldFocus: false });
    });
    youLegend?.classList.remove('hidden');
    if (showMeButton) showMeButton.textContent = 'Hide me from the map';
    setStatus(
      inside
        ? 'You’re on the map, inside the approximate boundary.'
        : 'You’re on the map, just outside the approximate boundary.',
    );
    redrawPlaces();
    infoWindow.setContent(buildYouCard(youMessage));
    infoWindow.open({ map, anchor: marker, shouldFocus: false });
  }

  function hideYou(): void {
    youMarker?.setMap(null);
    youMarker = null;
    youPosition = null;
    youMessage = '';
    infoWindow?.close();
    youLegend?.classList.add('hidden');
    if (showMeButton) showMeButton.textContent = 'Show me on the map';
    setStatus('');
    redrawPlaces();
  }

  function locateMe(): void {
    if (mapFailed) {
      setStatus('The map didn’t load, so your location can’t be shown.');
      return;
    }
    if (!mapReady) {
      setStatus('The map isn’t ready yet, so your location can’t be shown.');
      return;
    }
    if (youPosition) {
      hideYou();
      return;
    }
    if (!navigator.geolocation) {
      setStatus('This browser can’t share your location.');
      return;
    }
    if (showMeButton instanceof HTMLButtonElement) showMeButton.disabled = true;
    setStatus('Finding you…');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (showMeButton instanceof HTMLButtonElement) showMeButton.disabled = false;
        placeYou({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (error) => {
        if (showMeButton instanceof HTMLButtonElement) showMeButton.disabled = false;
        if (error.code === error.PERMISSION_DENIED) {
          setStatus('Location access is blocked. Allow it for this site to see yourself on the map.');
          return;
        }
        setStatus('Couldn’t read your location. Try again in a moment.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }

  showMeButton?.addEventListener('click', locateMe);

  const failAuth = (): void => {
    mapFailed = true;
    showMapMessage(
      mapElement,
      'Google Maps could not use this API key',
      'In Google Cloud Console, enable the Maps JavaScript API and billing, and allow this site origin under HTTP referrer restrictions. The browser console has the exact error.',
    );
  };

  void loadMaps(config.key, failAuth)
    .then(() => {
      if (mapFailed) return;
      const googleMaps = window.google?.maps;
      if (!googleMaps) {
        showMapMessage(mapElement, 'Map failed to load', 'Google Maps did not initialize. Check the API key and the browser console.');
        return;
      }
      maps = googleMaps;
      map = new googleMaps.Map(mapElement, {
        center: config.center,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          { featureType: 'all', elementType: 'all', stylers: [{ saturation: -100 }, { gamma: 0.98 }] },
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        ],
      });
      infoWindow = new googleMaps.InfoWindow({ maxWidth: 360 });
      const style = config.boundaryStyle;
      new googleMaps.Polygon({
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
      mapReady = true;
      redrawPlaces();
    })
    .catch(() => {
      mapFailed = true;
      showMapMessage(
        mapElement,
        'Map failed to load',
        'The Maps JavaScript API script did not load. Check the network connection and that the key is allowed to call that API.',
      );
    });
}
