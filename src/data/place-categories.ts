export const PLACE_CATEGORIES = [
  'food-drink',
  'retail',
  'services',
  'arts-culture',
  'fitness-wellness',
  'nonprofit',
  'other',
] as const;

export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];

export const placeCategoryLabels: Record<PlaceCategory, string> = {
  'food-drink': 'Food & Drink',
  retail: 'Retail',
  services: 'Services',
  'arts-culture': 'Arts & Culture',
  'fitness-wellness': 'Fitness & Wellness',
  nonprofit: 'Nonprofit',
  other: 'Other',
};

/** Pin colors carried over from the neighborhood directory so categories stay distinct. */
export const placeCategoryMarker: Record<PlaceCategory, { fill: string; stroke: string }> = {
  'food-drink': { fill: '#ea580c', stroke: '#fff7ed' },
  retail: { fill: '#2563eb', stroke: '#eff6ff' },
  services: { fill: '#4b5563', stroke: '#f9fafb' },
  'arts-culture': { fill: '#9333ea', stroke: '#faf5ff' },
  'fitness-wellness': { fill: '#15803d', stroke: '#f0fdf4' },
  nonprofit: { fill: '#0d9488', stroke: '#f0fdfa' },
  other: { fill: '#6b7280', stroke: '#f9fafb' },
};

export function primaryCategory(categories: readonly PlaceCategory[]): PlaceCategory {
  return categories[0] ?? 'other';
}

export function formatCategoryLabels(categories: readonly PlaceCategory[]): string {
  return categories.map((category) => placeCategoryLabels[category]).join(' · ');
}
