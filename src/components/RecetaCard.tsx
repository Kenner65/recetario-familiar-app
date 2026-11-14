import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { Colores, Espaciado, Radio, Tipografia } from '../constants/theme';
import type { Receta } from '../types/receta';
import { formatearCantidad } from '../utils/escalar';

interface Props {
  receta: Receta;
  onPress: () => void;
  onToggleFavorita: () => void;
}

/**
 * Tarjeta de receta en el listado.
 * - Tocar la tarjeta → abrir detalle.
 * - Doble toque → marcar/desmarcar favorita (gesto).
 * - Botón estrella → alternativa accesible para la misma acción.
 */
export function RecetaCard({ receta, onPress, onToggleFavorita }: Props) {
  const simple = Gesture.Tap()
    .numberOfTaps(1)
    .maxDuration(250)
    .runOnJS(true)
    .onEnd(() => onPress());

  const doble = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .runOnJS(true)
    .onEnd(() => onToggleFavorita());

  const gesto = Gesture.Exclusive(doble, simple);

  const resumen = receta.ingredientes
    .slice(0, 3)
    .map((i) => `${formatearCantidad(i.cantidad)} ${i.unidad} ${i.nombre}`)
    .join(' · ');

  return (
    <View style={styles.contenedor}>
      <GestureDetector gesture={gesto}>
        <View
          style={styles.tarjeta}
          accessible
          accessibilityRole="button"
          accessibilityLabel={`Receta ${receta.nombre}`}
          accessibilityHint="Toca para abrir el detalle o toca dos veces para marcar como favorita."
        >
          {receta.foto_uri ? (
            <Image
              source={{ uri: receta.foto_uri }}
              style={styles.miniatura}
              contentFit="cover"
              accessibilityLabel={`Foto de ${receta.nombre}`}
            />
          ) : (
            <View style={[styles.miniatura, styles.sinFoto]}>
              <Ionicons name="restaurant" size={30} color={Colores.textoSuave} />
            </View>
          )}

          <View style={styles.cuerpo}>
            <Text style={styles.nombre} numberOfLines={1}>
              {receta.nombre}
            </Text>
            <Text style={styles.detalle} numberOfLines={1}>
              {receta.porciones} porciones
              {receta.minutos != null ? ` · ${receta.minutos} min` : ''}
            </Text>
            {resumen ? (
              <Text style={styles.resumen} numberOfLines={1}>
                {resumen}
              </Text>
            ) : null}
          </View>
        </View>
      </GestureDetector>

      <Pressable
        onPress={onToggleFavorita}
        hitSlop={10}
        style={styles.botonFavorita}
        accessibilityRole="button"
        accessibilityLabel={receta.favorita ? 'Quitar de favoritas' : 'Marcar como favorita'}
      >
        <Ionicons
          name={receta.favorita ? 'star' : 'star-outline'}
          size={24}
          color={receta.favorita ? Colores.favorito : Colores.textoSuave}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    position: 'relative',
  },
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colores.superficie,
    borderRadius: Radio.md,
    padding: Espaciado.sm,
    paddingRight: 48,
    gap: Espaciado.sm,
    shadowColor: Colores.sombra,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  miniatura: {
    width: 64,
    height: 64,
    borderRadius: Radio.sm,
    backgroundColor: Colores.borde,
  },
  sinFoto: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cuerpo: {
    flex: 1,
    gap: 2,
  },
  nombre: {
    fontSize: Tipografia.cuerpo,
    fontWeight: '700',
    color: Colores.texto,
  },
  detalle: {
    fontSize: Tipografia.pequena,
    color: Colores.textoSuave,
  },
  resumen: {
    fontSize: Tipografia.pequena,
    color: Colores.textoSuave,
  },
  botonFavorita: {
    position: 'absolute',
    top: Espaciado.sm,
    right: Espaciado.sm,
    padding: 4,
  },
});
