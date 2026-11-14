/**
 * Configuración pública de la API.
 *
 * `EXPO_PUBLIC_API_URL` es la única variable que la app conoce. Es la URL
 * pública de la API desplegada en Vercel (no un secreto: va dentro del APK).
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').trim().replace(/\/+$/, '');

export function tieneApiConfigurada(): boolean {
  return API_URL.length > 0;
}
