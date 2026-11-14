import { ApiError, apiFetch } from '../api/client';
import { tieneApiConfigurada } from '../api/config';
import { subirImagen } from '../api/imagenes';
import {
  aplicarRecetaRemota,
  getMeta,
  listarPendientes,
  marcarSincronizada,
  setMeta,
} from '../repositories/syncRepository';
import type { Receta, RecetaRemota } from '../types/receta';

/**
 * Estrategia offline-first (sección 9.3):
 *  1. La app escribe primero en SQLite con `pending = 1`.
 *  2. `subirPendientes()` envía lo pendiente cuando hay conexión.
 *  3. `bajarCambios()` pide `?since=` para traer cambios del servidor.
 *
 * Conflictos: gana la última escritura (la API decide por `updated_at`).
 */

const CLAVE_CURSOR = 'sync.cursor';
const TAMANO_PAGINA = 500;

export interface ResultadoSync {
  subidos: number;
  bajados: number;
}

/** Sincroniza subida y bajada. Es un no-op si la API no está configurada. */
export async function sincronizar(): Promise<ResultadoSync> {
  if (!tieneApiConfigurada()) {
    return { subidos: 0, bajados: 0 };
  }
  const subidos = await subirPendientes();
  const bajados = await bajarCambios();
  return { subidos, bajados };
}

function aDocumento(receta: Receta, fotoUrl: string | null) {
  return {
    nombre: receta.nombre,
    porciones: receta.porciones,
    minutos: receta.minutos,
    pasos: receta.pasos,
    favorita: receta.favorita,
    ingredientes: receta.ingredientes.map((i) => ({
      nombre: i.nombre,
      cantidad: i.cantidad,
      unidad: i.unidad,
    })),
    foto_url: fotoUrl,
  };
}

async function prepararFoto(receta: Receta): Promise<string | null> {
  const uri = receta.foto_uri;
  if (!uri) {
    return null;
  }
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }
  // Archivo local: se reduce con expo-image-manipulator antes (en la UI) y aquí se sube.
  try {
    const resp = await subirImagen(uri);
    return resp.url;
  } catch {
    // Si no se puede subir la foto, la receta se sincroniza igualmente sin ella.
    return null;
  }
}

export async function subirPendientes(): Promise<number> {
  if (!tieneApiConfigurada()) {
    return 0;
  }
  const pendientes = listarPendientes();
  let subidos = 0;

  for (const receta of pendientes) {
    try {
      if (!receta.remote_id) {
        // No debería ocurrir (crearReceta siempre asigna remote_id).
        continue;
      }
      if (receta.deleted) {
        await apiFetch<{ ok: boolean }>(`/api/recetas/${receta.remote_id}`, { method: 'DELETE' });
      } else {
        const fotoUrl = await prepararFoto(receta);
        await apiFetch(`/api/recetas/${receta.remote_id}`, {
          method: 'PUT',
          body: JSON.stringify(aDocumento(receta, fotoUrl)),
        });
      }
      marcarSincronizada(receta.id);
      subidos += 1;
    } catch (error) {
      // 401/403: sin sesión válida, se aborta (el resto requiere login).
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        throw error;
      }
      // Cualquier otro error: se deja `pending = 1` y se reintenta la próxima vez.
    }
  }

  return subidos;
}

export async function bajarCambios(): Promise<number> {
  if (!tieneApiConfigurada()) {
    return 0;
  }
  let cursor = getMeta(CLAVE_CURSOR) ?? '';
  let bajados = 0;
  let hayMas = true;

  while (hayMas) {
    const query = cursor ? `?since=${encodeURIComponent(cursor)}` : '';
    const resp = await apiFetch<{ items: RecetaRemota[]; servidor_ahora: string }>(
      `/api/recetas${query}`,
    );
    const items = resp.items ?? [];

    for (const remota of items) {
      aplicarRecetaRemota(remota);
      bajados += 1;
    }

    if (items.length > 0) {
      cursor = items[items.length - 1]!.updated_at;
      setMeta(CLAVE_CURSOR, cursor);
    }
    if (resp.servidor_ahora) {
      setMeta(CLAVE_CURSOR, resp.servidor_ahora);
    }

    hayMas = items.length >= TAMANO_PAGINA;
  }

  return bajados;
}
