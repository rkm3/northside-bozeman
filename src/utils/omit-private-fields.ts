/**
 * Drop any `private_*` keys from a place (or other) data object before it is
 * serialized for public client JS. The prefix is a footgun guard, not encryption.
 */
export function omitPrivateFields<T extends Record<string, unknown>>(
  data: T,
): { [K in keyof T as K extends `private_${string}` ? never : K]: T[K] } {
  return Object.fromEntries(
    Object.entries(data).filter(([key]) => !key.startsWith('private_')),
  ) as { [K in keyof T as K extends `private_${string}` ? never : K]: T[K] };
}
