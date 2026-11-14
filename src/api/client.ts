import { API_URL } from './config';
import { borrarSesion, guardarSesion, obtenerSesion, obtenerToken } from './session';

/**
 * Error normalizado de la API. La API responde siempre
 * `{ error, detalles? }` (sección 9.3 del enunciado).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly detalles?: { campo: string; mensaje: string }[];

  constructor(status: number, mensaje: string, detalles?: { campo: string; mensaje: string }[]) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
    this.detalles = detalles;
  }
}

/** Se lanza cuando la sesión expira y no puede renovarse: hay que volver al login. */
export class SesionExpiradaError extends Error {
  constructor() {
    super('Sesión expirada. Inicia sesión de nuevo.');
    this.name = 'SesionExpiradaError';
  }
}

// Promesa compartida para renovar el token una sola vez ante varios 401 simultáneos.
let refrescando: Promise<string> | null = null;

async function renovarToken(): Promise<string> {
  if (!refrescando) {
    refrescando = (async () => {
      const sesion = await obtenerSesion();
      if (!sesion) {
        throw new SesionExpiradaError();
      }
      const resp = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: sesion.refreshToken }),
      });
      if (!resp.ok) {
        await borrarSesion();
        throw new SesionExpiradaError();
      }
      const datos = (await resp.json()) as { token: string; refreshToken: string };
      await guardarSesion({ token: datos.token, refreshToken: datos.refreshToken });
      return datos.token;
    })().finally(() => {
      refrescando = null;
    });
  }
  return refrescando;
}

async function parsearError(resp: Response): Promise<ApiError> {
  let mensaje = 'Error interno';
  let detalles: { campo: string; mensaje: string }[] | undefined;
  try {
    const datos = (await resp.json()) as { error?: string; detalles?: { campo: string; mensaje: string }[] };
    if (typeof datos?.error === 'string' && datos.error) {
      mensaje = datos.error;
    }
    detalles = datos?.detalles;
  } catch {
    // cuerpo no JSON: se mantiene el mensaje genérico.
  }
  return new ApiError(resp.status, mensaje, detalles);
}

interface PeticionOpts extends RequestInit {
  /** Si true, no añade el Bearer token (rutas públicas como /auth/login). */
  publico?: boolean;
}

/**
 * Cliente HTTP de la app. Añade el Bearer token, renueva una vez ante 401 y
 * reintenta; normaliza los errores a `ApiError`.
 */
export async function apiFetch<T>(path: string, init: PeticionOpts = {}): Promise<T> {
  const hacer = async (token: string | null) => {
    const headers = new Headers(init.headers);
    if (!init.publico && token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    // Solo se fuerza JSON cuando el cuerpo es una cadena (JSON). Para subir
    // imágenes se pasa un cuerpo binario con su propio Content-Type.
    if (typeof init.body === 'string' && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    return fetch(`${API_URL}${path}`, { ...init, headers });
  };

  let token: string | null = init.publico ? null : await obtenerToken();
  let resp = await hacer(token);

  if (resp.status === 401 && !init.publico) {
    // Un único reintento tras renovar el token.
    token = await renovarToken();
    resp = await hacer(token);
  }

  if (!resp.ok) {
    throw await parsearError(resp);
  }
  if (resp.status === 204) {
    return undefined as T;
  }
  return (await resp.json()) as T;
}
