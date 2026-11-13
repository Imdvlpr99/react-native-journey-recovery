/**
 * Escapes a key segment (journey id or user id) so it can never contain the ":" separator.
 * Only ":" and "%" are escaped, so ordinary ids map to themselves and existing keys stay valid.
 */
export function encodeKeySegment(segment: string): string {
  return segment.replace(/[%:]/g, (c) => (c === '%' ? '%25' : '%3A'));
}
