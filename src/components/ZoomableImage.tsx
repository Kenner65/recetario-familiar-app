/* eslint-disable react-hooks/immutability -- los `SharedValue` de reanimated son mutables por diseño (`.value = …`). */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Colores, Espaciado, Radio } from '../constants/theme';

interface Props {
  uri: string;
  alto?: number;
}

const ESCALA_MAXIMA = 4;
const ESCALA_DOBLE_TAP = 2.5;

/**
 * Imagen con zoom por pellizco (gesto `Pinch`) y doble toque para ampliar.
 * Incluye botones accesibles como alternativa (un lector de pantalla no hace
 * gestos complejos).
 */
export function ZoomableImage({ uri, alto = 280 }: Props) {
  const escala = useSharedValue(1);
  const escalaGuardada = useSharedValue(1);
  const [nivel, setNivel] = useState(1);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      const siguiente = Math.max(1, Math.min(escalaGuardada.value * e.scale, ESCALA_MAXIMA));
      escala.value = siguiente;
    })
    .onEnd(() => {
      escalaGuardada.value = escala.value;
    });

  const dobleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (escala.value > 1) {
        escala.value = withTiming(1);
        escalaGuardada.value = 1;
      } else {
        escala.value = withTiming(ESCALA_DOBLE_TAP);
        escalaGuardada.value = ESCALA_DOBLE_TAP;
      }
    });

  const gesto = Gesture.Simultaneous(pinch, dobleTap);

  const estiloImagen = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }));

  const ampliar = () => {
    const siguiente = Math.min(escala.value * 1.5, ESCALA_MAXIMA);
    escala.value = withTiming(siguiente);
    escalaGuardada.value = siguiente;
    setNivel(siguiente);
  };

  const reducir = () => {
    const siguiente = Math.max(1, escala.value / 1.5);
    escala.value = withTiming(siguiente);
    escalaGuardada.value = siguiente;
    setNivel(siguiente);
  };

  const restablecer = () => {
    escala.value = withTiming(1);
    escalaGuardada.value = 1;
    setNivel(1);
  };

  return (
    <View style={styles.contenedor}>
      <GestureDetector gesture={gesto}>
        <View style={[styles.marco, { height: alto }]}>
          <Animated.View style={[styles.zonaImagen, estiloImagen]}>
            <Image source={{ uri }} style={styles.imagen} contentFit="cover" accessibilityLabel="Foto del plato" />
          </Animated.View>
        </View>
      </GestureDetector>

      <View style={styles.controles}>
        <Pressable
          onPress={reducir}
          style={styles.boton}
          accessibilityRole="button"
          accessibilityLabel="Reducir zoom de la foto"
        >
          <Ionicons name="remove" size={20} color={Colores.texto} />
        </Pressable>
        <Text style={styles.zoom} accessibilityLiveRegion="polite">
          {Math.round(nivel * 100)} %
        </Text>
        <Pressable
          onPress={ampliar}
          style={styles.boton}
          accessibilityRole="button"
          accessibilityLabel="Ampliar zoom de la foto"
        >
          <Ionicons name="add" size={20} color={Colores.texto} />
        </Pressable>
        <Pressable
          onPress={restablecer}
          style={[styles.boton, styles.botonRestablecer]}
          accessibilityRole="button"
          accessibilityLabel="Restablecer zoom"
        >
          <Ionicons name="refresh" size={18} color={Colores.texto} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    gap: Espaciado.sm,
  },
  marco: {
    overflow: 'hidden',
    borderRadius: Radio.md,
    backgroundColor: Colores.borde,
  },
  zonaImagen: {
    flex: 1,
  },
  imagen: {
    width: '100%',
    height: '100%',
  },
  controles: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espaciado.sm,
  },
  boton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colores.borde,
  },
  botonRestablecer: {
    marginLeft: Espaciado.xs,
  },
  zoom: {
    minWidth: 52,
    textAlign: 'center',
    color: Colores.textoSuave,
  },
});
