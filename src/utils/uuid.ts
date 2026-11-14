/**
 * Genera un UUID v4 para usar como `remote_id` (mismo id en SQLite y Firestore).
 *
 * Usa `crypto.getRandomValues` cuando está disponible (Hermes lo expone) y cae
 * a `Math.random` en entornos sin él. Para ids de recursos (no secretos) es
 * suficiente.
 */
export function generarUuid(): string {
  const bytes = new Uint8Array(16);
  const cryptoObj = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => void } }).crypto;
  if (typeof cryptoObj?.getRandomValues === 'function') {
    cryptoObj.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  // Versión 4 (random) y variante 10xx.
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Fecha actual en formato ISO 8601 UTC (mismo formato que la API). */
export function ahoraIso(): string {
  return new Date().toISOString();
}
