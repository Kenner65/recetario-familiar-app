import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colores, Espaciado, Radio, Tipografia } from '../constants/theme';
import type { Ingrediente } from '../types/receta';

interface FilaProps {
  ing: Ingrediente;
  indice: number;
  total: number;
  onCambiar: (indice: number, campo: 'nombre' | 'cantidad' | 'unidad', valor: string | number) => void;
  onQuitar: (indice: number) => void;
}

function FilaIngrediente({ ing, indice, total, onCambiar, onQuitar }: FilaProps) {
  const [cantidadTexto, setCantidadTexto] = useState(String(ing.cantidad));

  const cambiarCantidad = (texto: string) => {
    setCantidadTexto(texto);
    const numero = parseFloat(texto.replace(',', '.'));
    onCambiar(indice, 'cantidad', Number.isFinite(numero) ? numero : 0);
  };

  return (
    <View style={styles.fila}>
      <TextInput
        style={[styles.input, styles.inputNombre]}
        value={ing.nombre}
        onChangeText={(t) => onCambiar(indice, 'nombre', t)}
        placeholder="Ingrediente"
        placeholderTextColor={Colores.textoSuave}
        accessibilityLabel={`Nombre del ingrediente ${indice + 1}`}
      />
      <TextInput
        style={[styles.input, styles.inputCantidad]}
        value={cantidadTexto}
        onChangeText={cambiarCantidad}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={Colores.textoSuave}
        accessibilityLabel={`Cantidad del ingrediente ${indice + 1}`}
      />
      <TextInput
        style={[styles.input, styles.inputUnidad]}
        value={ing.unidad}
        onChangeText={(t) => onCambiar(indice, 'unidad', t)}
        placeholder="unidad"
        placeholderTextColor={Colores.textoSuave}
        accessibilityLabel={`Unidad del ingrediente ${indice + 1}`}
      />
      <Pressable
        onPress={() => onQuitar(indice)}
        disabled={total <= 1}
        style={[styles.botonQuitar, total <= 1 && styles.botonQuitarDeshabilitado]}
        accessibilityRole="button"
        accessibilityLabel={`Quitar ingrediente ${indice + 1}`}
        testID={`quitar-ingrediente-${indice}`}
      >
        <Ionicons name="remove-circle" size={26} color={total <= 1 ? Colores.borde : Colores.peligro} />
      </Pressable>
    </View>
  );
}

interface Props {
  ingredientes: Ingrediente[];
  onChange: (nuevos: Ingrediente[]) => void;
}

/**
 * Lista dinámica de ingredientes (RF-01): permite agregar y quitar filas.
 * Componente controlado y accesible; cada acción tiene su `accessibilityLabel`.
 */
export function IngredienteForm({ ingredientes, onChange }: Props) {
  const cambiar = (indice: number, campo: 'nombre' | 'cantidad' | 'unidad', valor: string | number) => {
    const nuevos = ingredientes.map((ing, i) => (i === indice ? { ...ing, [campo]: valor } : ing));
    onChange(nuevos);
  };

  const quitar = (indice: number) => {
    onChange(ingredientes.filter((_, i) => i !== indice));
  };

  const agregar = () => {
    onChange([...ingredientes, { nombre: '', cantidad: 1, unidad: 'g' }]);
  };

  return (
    <View style={styles.contenedor}>
      <View style={styles.encabezado}>
        <Text style={styles.titulo}>Ingredientes</Text>
        <Text style={styles.sugerencia}>Cantidad referida a las porciones indicadas.</Text>
      </View>

      {ingredientes.map((ing, i) => (
        <FilaIngrediente
          key={i}
          ing={ing}
          indice={i}
          total={ingredientes.length}
          onCambiar={cambiar}
          onQuitar={quitar}
        />
      ))}

      <Pressable
        onPress={agregar}
        style={styles.botonAgregar}
        accessibilityRole="button"
        accessibilityLabel="Agregar ingrediente"
        testID="agregar-ingrediente"
      >
        <Ionicons name="add-circle" size={22} color={Colores.primario} />
        <Text style={styles.textoAgregar}>Agregar ingrediente</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    gap: Espaciado.sm,
  },
  encabezado: {
    gap: Espaciado.xs,
    marginBottom: Espaciado.xs,
  },
  titulo: {
    fontSize: Tipografia.subtitulo,
    fontWeight: '700',
    color: Colores.texto,
  },
  sugerencia: {
    fontSize: Tipografia.pequena,
    color: Colores.textoSuave,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espaciado.xs,
  },
  input: {
    backgroundColor: Colores.superficie,
    borderWidth: 1,
    borderColor: Colores.borde,
    borderRadius: Radio.sm,
    paddingHorizontal: Espaciado.sm,
    paddingVertical: 10,
    fontSize: Tipografia.cuerpo,
    color: Colores.texto,
  },
  inputNombre: {
    flex: 3,
  },
  inputCantidad: {
    flex: 1,
    textAlign: 'right',
  },
  inputUnidad: {
    flex: 1,
  },
  botonQuitar: {
    padding: 2,
  },
  botonQuitarDeshabilitado: {
    opacity: 0.4,
  },
  botonAgregar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espaciado.xs,
    paddingVertical: Espaciado.sm,
  },
  textoAgregar: {
    color: Colores.primario,
    fontWeight: '600',
    fontSize: Tipografia.cuerpo,
  },
});
