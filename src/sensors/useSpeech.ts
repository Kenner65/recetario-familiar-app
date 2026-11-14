import * as Speech from 'expo-speech';
import { useCallback } from 'react';

/**
 * Hook para leer el paso actual en voz alta (accesibilidad / manos sucias).
 * Envuelve `expo-speech`; si el dispositivo no tiene TTS simplemente no habla.
 */
export function useSpeech() {
  const leer = useCallback((texto: string) => {
    const limpio = texto?.trim();
    if (!limpio) {
      return;
    }
    try {
      Speech.speak(limpio, { language: 'es-ES' });
    } catch {
      // Sin soporte de TTS: no romper la app.
    }
  }, []);

  const detener = useCallback(() => {
    try {
      Speech.stop();
    } catch {
      // no-op
    }
  }, []);

  return { leer, detener };
}
