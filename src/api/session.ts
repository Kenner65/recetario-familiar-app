import * as SecureStore from 'expo-secure-store';

/**
 * Los tokens de sesión se guardan en `expo-secure-store`, NUNCA en
 * AsyncStorage (requisito de seguridad de la sección 9).
 */

const CLAVE_TOKEN = 'recetario.token';
const CLAVE_REFRESH = 'recetario.refresh_token';

export interface Sesion {
  token: string;
  refreshToken: string;
}

export async function guardarSesion(sesion: Sesion): Promise<void> {
  await SecureStore.setItemAsync(CLAVE_TOKEN, sesion.token);
  await SecureStore.setItemAsync(CLAVE_REFRESH, sesion.refreshToken);
}

export async function obtenerSesion(): Promise<Sesion | null> {
  const [token, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(CLAVE_TOKEN),
    SecureStore.getItemAsync(CLAVE_REFRESH),
  ]);
  if (!token || !refreshToken) {
    return null;
  }
  return { token, refreshToken };
}

export async function obtenerToken(): Promise<string | null> {
  return SecureStore.getItemAsync(CLAVE_TOKEN);
}

export async function borrarSesion(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(CLAVE_TOKEN),
    SecureStore.deleteItemAsync(CLAVE_REFRESH),
  ]);
}
