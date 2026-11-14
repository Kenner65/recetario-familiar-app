import { Ionicons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';

import { Colores, Espaciado, Radio, Tipografia } from '@/constants/theme';
import { useShake } from '@/sensors/useShake';
import { useSpeech } from '@/sensors/useSpeech';

export interface IngredienteCocina {
  nombre: string;
  texto: string;
}

interface Props {
  pasos: string[];
  ingredientes: IngredienteCocina[];
  onSalir: () => void;
}

interface IngredienteItemProps {
  ing: IngredienteCocina;
  indice: number;
  tachado: boolean;
  onAlternar: (indice: number) => void;
}

/** Fila de ingrediente tachable con pulsación larga (gesto) y botón (accesible). */
function IngredienteItem({ ing, indice, tachado, onAlternar }: IngredienteItemProps) {
  const longPress = Gesture.LongPress()
    .minDuration(400)
    .runOnJS(true)
    .onEnd(() => onAlternar(indice));

  return (
    <GestureDetector gesture={longPress}>
      <View style={styles.filaIngrediente} accessible accessibilityLabel={`Ingrediente ${ing.nombre}, ${ing.texto}`}>
        <Pressable
          onPress={() => onAlternar(indice)}
          hitSlop={8}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: tachado }}
          accessibilityLabel={tachado ? `Desmarcar ${ing.nombre}` : `Tachar ${ing.nombre}`}
        >
          <Ionicons
            name={tachado ? 'checkbox' : 'square-outline'}
            size={24}
            color={tachado ? Colores.exito : Colores.textoSuave}
          />
        </Pressable>
        <View style={styles.textoIngrediente}>
          <Text style={[styles.nombreIngrediente, tachado && styles.tachado]}>{ing.nombre}</Text>
          <Text style={[styles.cantidadIngrediente, tachado && styles.tachado]}>{ing.texto}</Text>
        </View>
      </View>
    </GestureDetector>
  );
}

/**
 * Modo cocina (RF-06): pasos en grande, pantalla siempre encendida, deslizar
 * para cambiar de paso, agitar para avanzar y leer el paso en voz alta.
 * Toda acción por gesto tiene su botón accesible equivalente.
 */
export function ModoCocina({ pasos, ingredientes, onSalir }: Props) {
  useKeepAwake('modo-cocina');

  const [pasoActual, setPasoActual] = useState(0);
  const [tachados, setTachados] = useState<Set<number>>(new Set());
  const { leer, detener } = useSpeech();

  const totalPasos = pasos.length;
  const paso = pasos[pasoActual] ?? '';

  const siguiente = useCallback(() => {
    detener();
    setPasoActual((prev) => Math.min(prev + 1, totalPasos - 1));
  }, [detener, totalPasos]);

  const anterior = useCallback(() => {
    detener();
    setPasoActual((prev) => Math.max(prev - 1, 0));
  }, [detener]);

  useShake(siguiente);

  const alternarTachado = (indice: number) => {
    setTachados((prev) => {
      const nuevos = new Set(prev);
      if (nuevos.has(indice)) {
        nuevos.delete(indice);
      } else {
        nuevos.add(indice);
      }
      return nuevos;
    });
  };

  const flingIzquierda = Gesture.Fling().direction(Directions.LEFT).runOnJS(true).onEnd(() => siguiente());
  const flingDerecha = Gesture.Fling().direction(Directions.RIGHT).runOnJS(true).onEnd(() => anterior());
  const gestoPasos = Gesture.Exclusive(flingIzquierda, flingDerecha);

  return (
    <View style={styles.contenedor}>
      <View style={styles.cabecera}>
        <Text style={styles.titulo}>Modo cocina</Text>
        <Pressable
          onPress={onSalir}
          style={styles.botonSalir}
          accessibilityRole="button"
          accessibilityLabel="Salir del modo cocina"
        >
          <Ionicons name="close" size={22} color={Colores.texto} />
        </Pressable>
      </View>

      <GestureDetector gesture={gestoPasos}>
        <View style={styles.pasoContenedor} accessible accessibilityLabel={`Paso ${pasoActual + 1} de ${totalPasos}: ${paso}`}>
          <Text style={styles.indicador}>
            Paso {pasoActual + 1} de {totalPasos}
          </Text>
          <ScrollView contentContainerStyle={styles.pasoTxtScroll}>
            <Text style={styles.pasoTexto}>{paso}</Text>
          </ScrollView>
          <Text style={styles.hintDesliza}>Desliza para cambiar de paso · agita para avanzar</Text>
        </View>
      </GestureDetector>

      <View style={styles.controlesPasos}>
        <Pressable
          onPress={anterior}
          disabled={pasoActual === 0}
          style={[styles.botonPaso, pasoActual === 0 && styles.deshabilitado]}
          accessibilityRole="button"
          accessibilityLabel="Paso anterior"
        >
          <Ionicons name="arrow-back" size={26} color={Colores.superficie} />
        </Pressable>
        <Pressable
          onPress={() => leer(`Paso ${pasoActual + 1}. ${paso}`)}
          style={styles.botonLeer}
          accessibilityRole="button"
          accessibilityLabel="Leer el paso en voz alta"
        >
          <Ionicons name="volume-high" size={22} color={Colores.superficie} />
        </Pressable>
        <Pressable
          onPress={siguiente}
          disabled={pasoActual === totalPasos - 1}
          style={[styles.botonPaso, pasoActual === totalPasos - 1 && styles.deshabilitado]}
          accessibilityRole="button"
          accessibilityLabel="Paso siguiente"
        >
          <Ionicons name="arrow-forward" size={26} color={Colores.superficie} />
        </Pressable>
      </View>

      <View style={styles.ingredientes}>
        <Text style={styles.subtitulo}>Ingredientes (mantén pulsado para tachar)</Text>
        <ScrollView style={styles.listaIngredientes}>
          {ingredientes.map((ing, i) => (
            <IngredienteItem key={i} ing={ing} indice={i} tachado={tachados.has(i)} onAlternar={alternarTachado} />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#2E2118',
    paddingHorizontal: Espaciado.md,
    paddingTop: Espaciado.sm,
    gap: Espaciado.md,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titulo: {
    fontSize: Tipografia.subtitulo,
    fontWeight: '800',
    color: Colores.superficie,
  },
  botonSalir: {
    backgroundColor: Colores.superficie,
    borderRadius: Radio.lg,
    padding: Espaciado.xs,
  },
  pasoContenedor: {
    flex: 2,
    backgroundColor: Colores.superficie,
    borderRadius: Radio.lg,
    padding: Espaciado.md,
    justifyContent: 'center',
  },
  indicador: {
    fontSize: Tipografia.pequena,
    color: Colores.primario,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pasoTxtScroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  pasoTexto: {
    fontSize: 30,
    lineHeight: 40,
    fontWeight: '600',
    color: Colores.texto,
    textAlign: 'center',
  },
  hintDesliza: {
    fontSize: Tipografia.pequena,
    color: Colores.textoSuave,
    textAlign: 'center',
    marginTop: Espaciado.sm,
  },
  controlesPasos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espaciado.md,
  },
  botonPaso: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colores.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonLeer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colores.acento,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deshabilitado: {
    opacity: 0.35,
  },
  ingredientes: {
    flex: 1.4,
    gap: Espaciado.xs,
  },
  subtitulo: {
    fontSize: Tipografia.cuerpo,
    fontWeight: '700',
    color: Colores.superficie,
  },
  listaIngredientes: {
    flex: 1,
  },
  filaIngrediente: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espaciado.sm,
    paddingVertical: Espaciado.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#4A3A2D',
  },
  textoIngrediente: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nombreIngrediente: {
    color: Colores.superficie,
    fontSize: Tipografia.cuerpo,
    flex: 1,
  },
  cantidadIngrediente: {
    color: Colores.acento,
    fontSize: Tipografia.cuerpo,
    fontWeight: '600',
  },
  tachado: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
});
