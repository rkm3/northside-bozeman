export const PLACE_STATUSES = ['live', 'draft', 'archived'] as const;

export type PlaceStatus = (typeof PLACE_STATUSES)[number];

type PlaceLike = {
  data: {
    status: PlaceStatus;
  };
};

function envFlagTrue(value: unknown): boolean {
  return typeof value === 'string' && ['1', 'true', 'yes'].includes(value.trim().toLowerCase());
}

/** Drafts ship in `astro dev`, or when PUBLIC_INCLUDE_DRAFTS=1 (e.g. preview deploys). */
export function includeDraftPlaces(): boolean {
  if (import.meta.env.DEV) return true;
  return envFlagTrue(import.meta.env.PUBLIC_INCLUDE_DRAFTS);
}

export function placeStatus(place: PlaceLike): PlaceStatus {
  return place.data.status;
}

/** Map pins and directory cards: live always; drafts only when drafts are included. */
export function isListedPlace(place: PlaceLike): boolean {
  const status = placeStatus(place);
  switch (status) {
    case 'live':
      return true;
    case 'draft':
      return includeDraftPlaces();
    case 'archived':
      return false;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

/** Individual /places/<id> pages: live + archived always; drafts only when included. */
export function isPlacePageBuilt(place: PlaceLike): boolean {
  const status = placeStatus(place);
  switch (status) {
    case 'live':
    case 'archived':
      return true;
    case 'draft':
      return includeDraftPlaces();
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export const PLACE_STATUS_LABELS: Record<PlaceStatus, string> = {
  live: 'Live',
  draft: 'Draft',
  archived: 'Archived',
};
