export type HttpParamValue = string | number | boolean | ReadonlyArray<string | number | boolean>;

/**
 * Builds a query-params object from a DTO by copying every own-enumerable field
 * whose value is truthy. This reproduces the `value && (params[key] = value)`
 * convention used by the uniform-truthy resource services (genres, collections,
 * productions, tags): falsy values (`undefined`, `null`, `''`, `0`, `false`) are
 * omitted, and every other value — including a (truthy) empty array, matching the
 * original `ids && (params['ids'] = ids)` behaviour — is copied as-is.
 *
 * Only behaviour-preserving for services whose query DTOs contain exactly their
 * wire params. Mixed-convention services (media, auth, history, playlists, ratings,
 * queue-upload) deliberately send `false`/`0` for some fields and must keep their
 * per-field code.
 */
export function toTruthyHttpParams<T extends object>(dto: T): Record<string, HttpParamValue> {
  const params: Record<string, HttpParamValue> = {};
  for (const key of Object.keys(dto)) {
    const value = (dto as Record<string, unknown>)[key];
    if (value) {
      params[key] = value as HttpParamValue;
    }
  }
  return params;
}
