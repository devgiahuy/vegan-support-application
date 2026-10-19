/**
 * Collapses image assets that carry identical content. Uploading the same photo twice creates two
 * distinct media assets, but the storage provider reports the same content ETag for both, so the
 * second copy must not be sent to the vision provider (it would only produce duplicate lines).
 * Assets without an ETag are always kept because their content cannot be compared.
 */
export function uniqueAssetIdsByContent(
  orderedAssetIds: readonly string[],
  assets: ReadonlyMap<string, { providerEtag: string | null }>,
  alreadyAttachedEtags: Iterable<string | null> = [],
): string[] {
  const seen = new Set<string>();
  for (const etag of alreadyAttachedEtags) if (etag) seen.add(etag);
  const kept: string[] = [];
  for (const id of orderedAssetIds) {
    const etag = assets.get(id)?.providerEtag ?? null;
    if (etag) {
      if (seen.has(etag)) continue;
      seen.add(etag);
    }
    kept.push(id);
  }
  return kept;
}
