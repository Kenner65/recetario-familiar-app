import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Colores, Espaciado, Tipografia } from '../constants/theme';

interface Props {
  icono?: keyof typeof Ionicons.glyphMap;
  titulo: string;
  mensaje?: string;
}

export function EmptyState({ icono = 'restaurant-outline', titulo, mensaje }: Props) {
  return (
    <View style={styles.contenedor} accessible accessibilityLabel={titulo}>
      <Ionicons name={icono} size={48} color={Colores.textoSuave} />
      <Text style={styles.titulo}>{titulo}</Text>
      {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Espaciado.xl,
    gap: Espaciado.sm,
  },
  titulo: {
    fontSize: Tipografia.subtitulo,
    fontWeight: '600',
    color: Colores.texto,
  },
  mensaje: {
    fontSize: Tipografia.cuerpo,
    color: Colores.textoSuave,
    textAlign: 'center',
    paddingHorizontal: Espaciado.lg,
  },
});
