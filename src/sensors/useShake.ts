import * as Sensores from 'expo-sensors';
import { useEffect, useState } from 'react';

/**
 * Lógica pura de la sacudida, separada de la lectura del sensor para poder
 * probarla en Jest sin depender del acelerómetro (regla del enunciado).
 */

/** Magnitud del vector de aceleración (en g, incluyendo la gravedad ~1 g). */
export function magnitudAceleracion(x: number, y: number, z: number): number {
  return Math.sqrt(x * x + y * y + z * z);
}

/**
 * Decide si una lectura cuenta como sacudida: supera el umbral (por encima de
 * la gravedad en reposo).
 */
export function debeDispararSacudida(magnitud: number, umbral = 1.8): boolean {
  return magnitud > umbral;
}

export interface UsoShake {
  /** `true` si el acelerómetro está disponible en este dispositivo. */
  disponible: boolean;
}

/**
 * Hook: llama `onShake` cuando se agita el dispositivo (manos sucias para
 * avanzar de paso). Usa `isAvailableAsync()` antes de suscribirse y cancela la
 * suscripción al desmontar. Si el sensor no está disponible, no hace nada: la
 * UI siempre ofrece un botón alternativo.
 *
 * `onShake` debe ser estable (p. ej. con `useCallback`) para no resuscribir.
 */
export function useShake(
  onShake: () => void,
  opciones: { umbral?: number; intervaloMinimoMs?: number } = {},
): UsoShake {
  const { umbral = 1.8, intervaloMinimoMs = 800 } = opciones;
  const [disponible, setDisponible] = useState(false);

  useEffect(() => {
    let activo = true;
    let sub: { remove(): void } | null = null;
    let ultimoDisparo = 0;

    (async () => {
      try {
        const ok = await Sensores.Accelerometer.isAvailableAsync();
        if (!ok) {
          return;
        }
        if (activo) {
          setDisponible(true);
        }
        Sensores.Accelerometer.setUpdateInterval(100);
        sub = Sensores.Accelerometer.addListener((m) => {
          const magnitud = magnitudAceleracion(m.x, m.y, m.z);
          const ahora = Date.now();
          if (debeDispararSacudida(magnitud, umbral) && ahora - ultimoDisparo > intervaloMinimoMs) {
            ultimoDisparo = ahora;
            onShake();
          }
        });
      } catch {
        // Sin sensor: se mantiene `disponible = false`.
      }
    })();

    return () => {
      activo = false;
      sub?.remove();
      Sensores.Accelerometer.removeAllListeners();
    };
  }, [onShake, umbral, intervaloMinimoMs]);

  return { disponible };
}
