import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { RecetaCard } from '@/components/RecetaCard';
import { Colores, Espaciado, Radio, Tipografia } from '@/constants/theme';
import { recetaService } from '@/services/recetaService';
import type { Receta } from '@/types/receta';

export default function ListaRecetas() {
  const router = useRouter();
  const [texto, setTexto] = useState('');
  const [recetas, setRecetas] = useState<Receta[]>([]);

  const cargar = useCallback((termino: string) => {
    setRecetas(recetaService.listar({ texto: termino }));
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar(texto);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cargar]),
  );

  const alCambiarTexto = (valor: string) => {
    setTexto(valor);
    cargar(valor);
  };

  const alternarFavorita = (receta: Receta) => {
    recetaService.marcarFavorita(receta.id, !receta.favorita);
    cargar(texto);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.encabezado}>
        <Text style={styles.titulo}>Recetario familiar</Text>
        <Pressable
          onPress={() => router.push('/receta/nueva')}
          style={styles.botonNueva}
          accessibilityRole="button"
          accessibilityLabel="Crear nueva receta"
        >
          <Ionicons name="add" size={22} color={Colores.superficie} />
          <Text style={styles.textoNueva}>Nueva</Text>
        </Pressable>
      </View>

      <View style={styles.buscador}>
        <Ionicons name="search" size={20} color={Colores.textoSuave} />
        <TextInput
          style={styles.input}
          value={texto}
          onChangeText={alCambiarTexto}
          placeholder="Buscar por nombre o ingrediente…"
          placeholderTextColor={Colores.textoSuave}
          accessibilityLabel="Buscar recetas por nombre o ingrediente"
          returnKeyType="search"
        />
        {texto ? (
          <Pressable onPress={() => alCambiarTexto('')} accessibilityLabel="Limpiar búsqueda" hitSlop={8}>
            <Ionicons name="close-circle" size={20} color={Colores.textoSuave} />
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={recetas}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) => (
          <RecetaCard
            receta={item}
            onPress={() => router.push(`/receta/${item.id}`)}
            onToggleFavorita={() => alternarFavorita(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            titulo={texto ? 'Sin resultados' : 'Aún no hay recetas'}
            mensaje={
              texto
                ? `No se encontraron recetas para «${texto}».`
                : 'Crea tu primera receta tocando el botón «Nueva».'
            }
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colores.fondo,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Espaciado.md,
    paddingTop: Espaciado.sm,
    paddingBottom: Espaciado.sm,
  },
  titulo: {
    fontSize: Tipografia.titulo,
    fontWeight: '800',
    color: Colores.texto,
  },
  botonNueva: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colores.primario,
    paddingHorizontal: Espaciado.md,
    paddingVertical: Espaciado.sm,
    borderRadius: Radio.lg,
  },
  textoNueva: {
    color: Colores.superficie,
    fontWeight: '700',
    fontSize: Tipografia.cuerpo,
  },
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espaciado.sm,
    marginHorizontal: Espaciado.md,
    marginBottom: Espaciado.sm,
    backgroundColor: Colores.superficie,
    borderRadius: Radio.md,
    paddingHorizontal: Espaciado.md,
    borderWidth: 1,
    borderColor: Colores.borde,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: Tipografia.cuerpo,
    color: Colores.texto,
  },
  lista: {
    padding: Espaciado.md,
    gap: Espaciado.sm,
    paddingBottom: Espaciado.xl,
  },
});
