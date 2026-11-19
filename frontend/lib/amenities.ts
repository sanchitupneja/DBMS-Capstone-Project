/**
 * Normalize an amenities field coming from the API.
 *
 * The database stores amenities as JSON. Older seeded rows contain a JSON
 * *string* instead of a JSON array, so accept both shapes here to keep the UI
 * from crashing on `.map()` / `.join()` calls.
 */
export function parseAmenities(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === 'string');
  }
  if (typeof raw === 'string') {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string');
      }
    } catch {
      // Not JSON — fall through and treat it as a plain value.
    }
    return raw.trim() ? [raw] : [];
  }
  return [];
}
