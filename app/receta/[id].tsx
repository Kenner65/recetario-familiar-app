import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { EmptyState } from '@/components/EmptyState';
import { ModoCocina, type IngredienteCocina } from '@/components/ModoCocina';
import { ZoomableImage } from '@/components/ZoomableImage';
import { Colores, Espaciado, Radio, Tipografia } from '@/constants/theme';
import { recetaService } from '@/services/recetaService';
import type { Receta } from '@/types/receta';
import { escalar, formatearCantidad } from '@/utils/escalar';

export default function DetalleReceta() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const idNum = Number(id);

  const [receta, setReceta] = useState<Receta | null>(null);
  const [porciones, setPorciones] = useState(4);
  const [modoCocina, setModoCocina] = useState(false);

  const cargar = useCallback(() => {
    const r = recetaService.obtener(idNum);
    setReceta(r);
    if (r) {
      setPorciones(r.porciones);
    }
  }, [idNum]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  if (modoCocina && receta) {
    return (
      <ModoCocina
        pasos={receta.pasos}
        ingredientes={ingredientesEscalados(receta, porciones)}
        onSalir={() => setModoCocina(false)}
      />
    );
  }

  if (!receta) {
    return (
      <View style={styles.contenedorCentrado}>
        <EmptyState icono="alert-circle-outline" titulo="Receta no encontrada" mensaje="Es posible que haya sido eliminada." />
      </View>
    );
  }

  const alternarFavorita = () => {
    recetaService.marcarFavorita(receta.id, !receta.favorita);
    cargar();
  };

  const dobleTapFavorita = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .runOnJS(true)
    .onEnd(() => alternarFavorita());

  const confirmarEliminar = () => {
    Alert.alert('Eliminar receta', `¿Seguro que quieres eliminar «${receta.nombre}»?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          recetaService.eliminar(receta.id);
          router.back();
        },
      },
    ]);
  };

  const ingredientes = ingredientesEscalados(receta, porciones);

  return (
    <ScrollView style={styles.contenedor} contentContainerStyle={styles.contenido}>
      <Stack.Screen options={{ title: receta.nombre }} />

      {receta.foto_uri ? <ZoomableImage uri={receta.foto_uri} /> : null}

      <GestureDetector gesture={dobleTapFavorita}>
        <View style={styles.cabecera} accessible accessibilityLabel={`Receta ${receta.nombre}`}>
          <View style={styles.tituloFila}>
            <Text style={styles.titulo}>{receta.nombre}</Text>
            <Pressable
              onPress={alternarFavorita}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={receta.favorita ? 'Quitar de favoritas' : 'Marcar como favorita'}
            >
              <Ionicons
                name={receta.favorita ? 'star' : 'star-outline'}
                size={30}
                color={receta.favorita ? Colores.favorito : Colores.textoSuave}
              />
            </Pressable>
          </View>
          <Text style={styles.meta}>
            {receta.minutos != null ? `${receta.minutos} min · ` : ''}Porciones base: {receta.porciones}
          </Text>
          <Text style={styles.hint}>Toca dos veces el título para marcar favorita.</Text>
        </View>
      </GestureDetector>

      <View style={styles.porciones}>
        <Text style={styles.etiqueta}>Porciones</Text>
        <View style={styles.stepper}>
          <Pressable
            onPress={() => setPorciones((p) => Math.max(1, p - 1))}
            style={styles.botonStepper}
            accessibilityRole="button"
            accessibilityLabel="Disminuir porciones"
          >
            <Ionicons name="remove" size={24} color={Colores.primario} />
          </Pressable>
          <Text style={styles.valorPorciones} accessibilityLiveRegion="polite">
            {porciones}
          </Text>
          <Pressable
            onPress={() => setPorciones((p) => p + 1)}
            style={styles.botonStepper}
            accessibilityRole="button"
            accessibilityLabel="Aumentar porciones"
          >
            <Ionicons name="add" size={24} color={Colores.primario} />
          </Pressable>
        </View>
      </View>

      <View style={styles.seccion}>
        <Text style={styles.etiqueta}>Ingredientes</Text>
        {ingredientes.map((ing, i) => (
          <View key={i} style={styles.filaIngrediente}>
            <Text style={styles.nombreIngrediente}>{ing.nombre}</Text>
            <Text style={styles.cantidadIngrediente}>{ing.texto}</Text>
          </View>
        ))}
      </View>

      <View style={styles.seccion}>
        <Text style={styles.etiqueta}>Preparación</Text>
        {receta.pasos.map((paso, i) => (
          <View key={i} style={styles.filaPaso}>
            <Text style={styles.numeroPaso}>{i + 1}.</Text>
            <Text style={styles.pasoTexto}>{paso}</Text>
          </View>
        ))}
      </View>

      <View style={styles.acciones}>
        <Pressable
          onPress={() => setModoCocina(true)}
          style={[styles.botonAccion, styles.botonCocina]}
          accessibilityRole="button"
          accessibilityLabel="Iniciar modo cocina"
        >
          <Ionicons name="flame" size={22} color={Colores.superficie} />
          <Text style={styles.textoBotonCocina}>Modo cocina</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push(`/receta/nueva?editar=${receta.id}`)}
          style={[styles.botonAccion, styles.botonSecundario]}
          accessibilityRole="button"
          accessibilityLabel="Editar receta"
        >
          <Ionicons name="create" size={20} color={Colores.texto} />
          <Text style={styles.textoBotonSecundario}>Editar</Text>
        </Pressable>
        <Pressable
          onPress={confirmarEliminar}
          style={[styles.botonAccion, styles.botonEliminar]}
          accessibilityRole="button"
          accessibilityLabel="Eliminar receta"
        >
          <Ionicons name="trash" size={20} color={Colores.peligro} />
          <Text style={styles.textoBotonEliminar}>Eliminar</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function ingredientesEscalados(receta: Receta, porciones: number): IngredienteCocina[] {
  return receta.ingredientes.map((i) => ({
    nombre: i.nombre,
    texto: `${formatearCantidad(escalar(i.cantidad, receta.porciones, porciones))} ${i.unidad}`,
  }));
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: Colores.fondo,
  },
  contenedorCentrado: {
    flex: 1,
    backgroundColor: Colores.fondo,
    justifyContent: 'center',
  },
  contenido: {
    padding: Espaciado.md,
    gap: Espaciado.md,
    paddingBottom: Espaciado.xl,
  },
  cabecera: {
    gap: Espaciado.xs,
  },
  tituloFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Espaciado.sm,
  },
  titulo: {
    flex: 1,
    fontSize: Tipografia.titulo,
    fontWeight: '800',
    color: Colores.texto,
  },
  meta: {
    fontSize: Tipografia.pequena,
    color: Colores.textoSuave,
  },
  hint: {
    fontSize: Tipografia.pequena,
    color: Colores.textoSuave,
    fontStyle: 'italic',
  },
  porciones: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  etiqueta: {
    fontSize: Tipografia.subtitulo,
    fontWeight: '700',
    color: Colores.texto,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espaciado.sm,
  },
  botonStepper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colores.superficie,
    borderWidth: 1,
    borderColor: Colores.borde,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valorPorciones: {
    minWidth: 36,
    textAlign: 'center',
    fontSize: Tipografia.subtitulo,
    fontWeight: '700',
    color: Colores.texto,
  },
  seccion: {
    gap: Espaciado.sm,
    backgroundColor: Colores.superficie,
    borderRadius: Radio.md,
    padding: Espaciado.md,
  },
  filaIngrediente: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Espaciado.sm,
    paddingVertical: Espaciado.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colores.borde,
  },
  nombreIngrediente: {
    flex: 1,
    fontSize: Tipografia.cuerpo,
    color: Colores.texto,
  },
  cantidadIngrediente: {
    fontSize: Tipografia.cuerpo,
    fontWeight: '600',
    color: Colores.primario,
  },
  filaPaso: {
    flexDirection: 'row',
    gap: Espaciado.sm,
  },
  numeroPaso: {
    fontSize: Tipografia.cuerpo,
    fontWeight: '700',
    color: Colores.primario,
  },
  pasoTexto: {
    flex: 1,
    fontSize: Tipografia.cuerpo,
    color: Colores.texto,
    lineHeight: 22,
  },
  acciones: {
    flexDirection: 'row',
    gap: Espaciado.sm,
  },
  botonAccion: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espaciado.xs,
    paddingVertical: 12,
    borderRadius: Radio.md,
    borderWidth: 1,
  },
  botonCocina: {
    backgroundColor: Colores.primario,
    borderColor: Colores.primario,
  },
  textoBotonCocina: {
    color: Colores.superficie,
    fontWeight: '700',
  },
  botonSecundario: {
    backgroundColor: Colores.superficie,
    borderColor: Colores.borde,
  },
  textoBotonSecundario: {
    color: Colores.texto,
    fontWeight: '600',
  },
  botonEliminar: {
    backgroundColor: Colores.superficie,
    borderColor: Colores.peligro,
  },
  textoBotonEliminar: {
    color: Colores.peligro,
    fontWeight: '600',
  },
});
