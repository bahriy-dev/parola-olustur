/** Full-byte comparison; JavaScript engines do not guarantee constant-time execution. */
export function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  let difference = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) difference |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return difference === 0;
}
export function equalText(a: string, b: string): boolean {
  return equalBytes(new TextEncoder().encode(a), new TextEncoder().encode(b));
}
export function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  if (!Number.isInteger(length) || length < 1 || length > 65536) throw new Error('Geçersiz bayt uzunluğu.');
  if (!globalThis.crypto?.getRandomValues) throw new Error('Güvenli rastgelelik kullanılamıyor.');
  return crypto.getRandomValues(new Uint8Array(length));
}
