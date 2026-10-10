/** Build an “Open in Google Maps” URL for a place. Prefer Place ID when present. */
export function googleMapsPlaceUrl(options: {
  name: string;
  address: string;
  googlePlaceId?: string;
}): string {
  const { name, address, googlePlaceId } = options;
  if (googlePlaceId) {
    const params = new URLSearchParams({
      api: '1',
      query: name,
      query_place_id: googlePlaceId,
    });
    return `https://www.google.com/maps/search/?${params.toString()}`;
  }
  const params = new URLSearchParams({
    api: '1',
    query: address,
  });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}
