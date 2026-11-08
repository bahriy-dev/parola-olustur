/**
 * Single-algorithm hash tools that duplicate a /hash/<slug> page. Their /araclar routes redirect there and
 * the hash page carries the tool's explanatory content. No imports: next.config.ts reads this file directly.
 */
export const HASH_TOOL_SLUGS: Record<string, string> = {
  'hash-md5': 'md5',
  'hash-sha1': 'sha-1',
  'hash-sha224': 'sha-224',
  'hash-sha256': 'sha-256',
  'hash-sha384': 'sha-384',
  'hash-sha512': 'sha-512',
  'hash-sha3-224': 'sha3-224',
  'hash-sha3-256': 'sha3-256',
  'hash-sha3-384': 'sha3-384',
  'hash-sha3-512': 'sha3-512',
  'hash-blake2b': 'blake2b',
  'hash-blake3': 'blake3',
  'ripemd160-tool': 'ripemd-160',
};

export const toolIdForHashSlug = (slug: string) => Object.keys(HASH_TOOL_SLUGS).find((id) => HASH_TOOL_SLUGS[id] === slug);
