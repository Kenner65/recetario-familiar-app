import { apiFetch } from './client';
import { borrarSesion, guardarSesion } from './session';

export interface Usuario {
  id: string;
  email: string;
}

export interface RespuestaAuth {
  token: string;
  refreshToken: string;
  expiraEnSeg: number;
  usuario: Usuario;
}

/** POST /api/auth/registro */
export async function registrar(email: string, password: string): Promise<RespuestaAuth> {
  const datos = await apiFetch<RespuestaAuth>('/api/auth/registro', {
    method: 'POST',
    publico: true,
    body: JSON.stringify({ email, password }),
  });
  await guardarSesion({ token: datos.token, refreshToken: datos.refreshToken });
  return datos;
}

/** POST /api/auth/login */
export async function iniciarSesion(email: string, password: string): Promise<RespuestaAuth> {
  const datos = await apiFetch<RespuestaAuth>('/api/auth/login', {
    method: 'POST',
    publico: true,
    body: JSON.stringify({ email, password }),
  });
  await guardarSesion({ token: datos.token, refreshToken: datos.refreshToken });
  return datos;
}

/** GET /api/auth/yo */
export async function obtenerUsuario(): Promise<Usuario> {
  const datos = await apiFetch<{ usuario: Usuario }>('/api/auth/yo');
  return datos.usuario;
}

/** Cierra la sesión local (borra los tokens). */
export async function cerrarSesion(): Promise<void> {
  await borrarSesion();
}
