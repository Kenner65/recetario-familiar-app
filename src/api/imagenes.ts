import { apiFetch } from './client';

export interface RespuestaImagen {
  url: string;
  pathname: string;
}

const EXTENSIONES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

/** Infiere el `Content-Type` a partir de la extensión del archivo. */
export function adivinarContentType(uri: string): string {
  const sinQuery = uri.split('?')[0] ?? '';
  const ext = (sinQuery.split('.').pop() ?? '').toLowerCase();
  return EXTENSIONES[ext] ?? 'image/jpeg';
}

/**
 * Sube una imagen a Vercel Blob a través de la API (POST /api/imagenes).
 * La app nunca conoce el token de Blob: solo envía los bytes y recibe la URL.
 */
export async function subirImagen(uri: string, contentType?: string): Promise<RespuestaImagen> {
  const tipo = contentType ?? adivinarContentType(uri);
  // `fetch` global en Expo soporta URIs `file://`, `content://` y `data:`.
  const respuesta = await fetch(uri);
  const blob = await respuesta.blob();

  return apiFetch<RespuestaImagen>('/api/imagenes', {
    method: 'POST',
    body: blob,
    headers: { 'Content-Type': tipo },
  });
}

/** Borra una imagen propia (DELETE /api/imagenes?url=). */
export async function eliminarImagen(url: string): Promise<void> {
  await apiFetch<{ ok: boolean }>('/api/imagenes?url=' + encodeURIComponent(url), {
    method: 'DELETE',
  });
}
