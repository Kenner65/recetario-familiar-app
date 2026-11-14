import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { RecetaCard } from '@/components/RecetaCard';
import { Colores, Espaciado, Tipografia } from '@/constants/theme';
import { recetaService } from '@/services/recetaService';
import type { Receta } from '@/types/receta';

export default function Favoritas() {
  const router = useRouter();
  const [recetas, setRecetas] = useState<Receta[]>([]);

  const cargar = useCallback(() => {
    setRecetas(recetaService.listar({ soloFavoritas: true }));
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  const alternarFavorita = (receta: Receta) => {
    recetaService.marcarFavorita(receta.id, !receta.favorita);
    cargar();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Text style={styles.titulo}>Favoritas</Text>
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
            icono="star-outline"
            titulo="Sin favoritas"
            mensaje="Toca dos veces una receta (o su estrella) para marcarla como favorita."
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
  titulo: {
    fontSize: Tipografia.titulo,
    fontWeight: '800',
    color: Colores.texto,
    paddingHorizontal: Espaciado.md,
    paddingTop: Espaciado.sm,
    paddingBottom: Espaciado.sm,
  },
  lista: {
    padding: Espaciado.md,
    gap: Espaciado.sm,
    paddingBottom: Espaciado.xl,
  },
});
