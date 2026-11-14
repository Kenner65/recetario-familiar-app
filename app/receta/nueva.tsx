import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { IngredienteForm } from '@/components/IngredienteForm';
import { Colores, Espaciado, Radio, Tipografia } from '@/constants/theme';
import { recetaService, ErrorReceta } from '@/services/recetaService';
import type { Ingrediente, RecetaInput } from '@/types/receta';
import type { ErrorValidacion } from '@/utils/validaciones';

const PORCIONES_DEFECTO = '4';

export default function NuevaReceta() {
  const router = useRouter();
  const params = useLocalSearchParams<{ editar?: string }>();
  const idEdicion = params.editar ? Number(params.editar) : null;

  // Se carga la receta existente una sola vez (inicialización perezosa del estado).
  const [recetaEdicion] = useState(() => (idEdicion != null ? recetaService.obtener(idEdicion) : null));
  const [nombre, setNombre] = useState(recetaEdicion?.nombre ?? '');
  const [porciones, setPorciones] = useState(recetaEdicion ? String(recetaEdicion.porciones) : PORCIONES_DEFECTO);
  const [minutos, setMinutos] = useState(recetaEdicion?.minutos != null ? String(recetaEdicion.minutos) : '');
  const [pasos, setPasos] = useState<string[]>(
    recetaEdicion && recetaEdicion.pasos.length > 0 ? recetaEdicion.pasos : [''],
  );
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>(
    recetaEdicion && recetaEdicion.ingredientes.length > 0
      ? recetaEdicion.ingredientes.map(({ nombre: n, cantidad, unidad }) => ({ nombre: n, cantidad, unidad }))
      : [{ nombre: '', cantidad: 1, unidad: 'g' }],
  );
  const [fotoUri, setFotoUri] = useState<string | null>(recetaEdicion?.foto_uri ?? null);
  const [errores, setErrores] = useState<ErrorValidacion[]>([]);

  const titulo = useMemo(() => (idEdicion != null ? 'Editar receta' : 'Nueva receta'), [idEdicion]);

  const cambiarPaso = (indice: number, valor: string) => {
    setPasos((prev) => prev.map((p, i) => (i === indice ? valor : p)));
  };

  const agregarPaso = () => setPasos((prev) => [...prev, '']);

  const quitarPaso = (indice: number) => {
    setPasos((prev) => prev.filter((_, i) => i !== indice));
  };

  const elegirFoto = async (origen: 'camara' | 'galeria') => {
    try {
      const permiso =
        origen === 'camara'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert(
          'Permiso necesario',
          origen === 'camara'
            ? 'Necesitamos permiso de cámara para tomar la foto del plato.'
            : 'Necesitamos acceso a tus fotos para elegir la imagen del plato.',
        );
        return;
      }
      const resultado =
        origen === 'camara'
          ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 })
          : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
      if (resultado.canceled) {
        return;
      }
      const asset = resultado.assets[0];
      if (!asset) {
        return;
      }
      let uri = asset.uri;
      // Reducir la foto antes de guardarla (ancho <= 1280 px, JPEG 0.7).
      if (asset.width > 1280) {
        const manipulado = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 1280 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
        );
        uri = manipulado.uri;
      }
      setFotoUri(uri);
    } catch {
      Alert.alert('No se pudo usar la foto', 'La cámara o la galería no están disponibles en este dispositivo.');
    }
  };

  const construirInput = (): RecetaInput => ({
    nombre: nombre.trim(),
    porciones: parseInt(porciones, 10) || 0,
    minutos: minutos.trim() ? parseInt(minutos, 10) || 0 : null,
    pasos: pasos.map((p) => p.trim()).filter((p) => p.length > 0),
    foto_uri: fotoUri,
    favorita: false,
    ingredientes: ingredientes
      .filter((i) => i.nombre.trim().length > 0)
      .map((i) => ({ nombre: i.nombre.trim(), cantidad: i.cantidad, unidad: i.unidad.trim() })),
  });

  const guardar = () => {
    const input = construirInput();
    try {
      if (idEdicion != null) {
        recetaService.actualizar(idEdicion, input);
      } else {
        recetaService.crear(input);
      }
      router.back();
    } catch (error) {
      if (error instanceof ErrorReceta) {
        setErrores(error.errores);
      } else {
        Alert.alert('Error', 'No se pudo guardar la receta.');
      }
    }
  };

  return (
    <ScrollView style={styles.contenedor} contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: titulo }} />

      {errores.length > 0 ? (
        <View style={styles.banner} accessibilityLiveRegion="assertive">
          {errores.map((e) => (
            <Text key={`${e.campo}-${e.mensaje}`} style={styles.textoError}>
              • {e.mensaje}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.campo}>
        <Text style={styles.etiqueta}>Nombre de la receta</Text>
        <TextInput
          style={styles.input}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Ej. Arroz de la abuela"
          placeholderTextColor={Colores.textoSuave}
          accessibilityLabel="Nombre de la receta"
        />
      </View>

      <View style={styles.filaCampos}>
        <View style={[styles.campo, styles.mitad]}>
          <Text style={styles.etiqueta}>Porciones</Text>
          <TextInput
            style={styles.input}
            value={porciones}
            onChangeText={setPorciones}
            keyboardType="number-pad"
            accessibilityLabel="Número de porciones"
          />
        </View>
        <View style={[styles.campo, styles.mitad]}>
          <Text style={styles.etiqueta}>Minutos (opcional)</Text>
          <TextInput
            style={styles.input}
            value={minutos}
            onChangeText={setMinutos}
            keyboardType="number-pad"
            placeholder="—"
            placeholderTextColor={Colores.textoSuave}
            accessibilityLabel="Tiempo de preparación en minutos"
          />
        </View>
      </View>

      <View style={styles.campo}>
        <Text style={styles.etiqueta}>Foto del plato (opcional)</Text>
        {fotoUri ? (
          <View style={styles.fotoPrevista}>
            <Image source={{ uri: fotoUri }} style={styles.foto} contentFit="cover" accessibilityLabel="Foto seleccionada" />
            <Pressable
              onPress={() => setFotoUri(null)}
              style={styles.botonQuitarFoto}
              accessibilityRole="button"
              accessibilityLabel="Quitar foto"
            >
              <Ionicons name="trash" size={20} color={Colores.superficie} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.botonesFoto}>
            <Pressable
              onPress={() => elegirFoto('camara')}
              style={styles.botonFoto}
              accessibilityRole="button"
              accessibilityLabel="Tomar foto con la cámara"
            >
              <Ionicons name="camera" size={20} color={Colores.primario} />
              <Text style={styles.textoBotonFoto}>Cámara</Text>
            </Pressable>
            <Pressable
              onPress={() => elegirFoto('galeria')}
              style={styles.botonFoto}
              accessibilityRole="button"
              accessibilityLabel="Elegir foto de la galería"
            >
              <Ionicons name="images" size={20} color={Colores.primario} />
              <Text style={styles.textoBotonFoto}>Galería</Text>
            </Pressable>
          </View>
        )}
      </View>

      <IngredienteForm ingredientes={ingredientes} onChange={setIngredientes} />

      <View style={styles.campo}>
        <Text style={styles.etiqueta}>Pasos</Text>
        {pasos.map((paso, i) => (
          <View key={i} style={styles.filaPaso}>
            <Text style={styles.numeroPaso}>{i + 1}.</Text>
            <TextInput
              style={[styles.input, styles.inputPaso]}
              value={paso}
              onChangeText={(t) => cambiarPaso(i, t)}
              placeholder="Describe este paso…"
              placeholderTextColor={Colores.textoSuave}
              multiline
              accessibilityLabel={`Paso ${i + 1}`}
            />
            <Pressable
              onPress={() => quitarPaso(i)}
              disabled={pasos.length <= 1}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Quitar paso ${i + 1}`}
            >
              <Ionicons
                name="remove-circle"
                size={24}
                color={pasos.length <= 1 ? Colores.borde : Colores.peligro}
              />
            </Pressable>
          </View>
        ))}
        <Pressable
          onPress={agregarPaso}
          style={styles.botonAgregarPaso}
          accessibilityRole="button"
          accessibilityLabel="Agregar paso"
        >
          <Ionicons name="add-circle" size={22} color={Colores.primario} />
          <Text style={styles.textoAgregarPaso}>Agregar paso</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={guardar}
        style={({ pressed }) => [styles.botonGuardar, pressed && styles.presionado]}
        accessibilityRole="button"
        accessibilityLabel="Guardar receta"
      >
        <Text style={styles.textoGuardar}>Guardar receta</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: Colores.fondo,
  },
  contenido: {
    padding: Espaciado.md,
    gap: Espaciado.md,
    paddingBottom: Espaciado.xl,
  },
  banner: {
    backgroundColor: '#FBE9E7',
    borderRadius: Radio.sm,
    padding: Espaciado.sm,
    gap: 2,
    borderWidth: 1,
    borderColor: Colores.peligro,
  },
  textoError: {
    color: Colores.peligro,
    fontSize: Tipografia.pequena,
  },
  campo: {
    gap: Espaciado.xs,
  },
  filaCampos: {
    flexDirection: 'row',
    gap: Espaciado.sm,
  },
  mitad: {
    flex: 1,
  },
  etiqueta: {
    fontSize: Tipografia.subtitulo,
    fontWeight: '700',
    color: Colores.texto,
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
  fotoPrevista: {
    position: 'relative',
    borderRadius: Radio.md,
    overflow: 'hidden',
  },
  foto: {
    width: '100%',
    height: 200,
    backgroundColor: Colores.borde,
  },
  botonQuitarFoto: {
    position: 'absolute',
    top: Espaciado.sm,
    right: Espaciado.sm,
    backgroundColor: Colores.peligro,
    borderRadius: Radio.lg,
    padding: Espaciado.sm,
  },
  botonesFoto: {
    flexDirection: 'row',
    gap: Espaciado.sm,
  },
  botonFoto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espaciado.xs,
    backgroundColor: Colores.superficie,
    borderWidth: 1,
    borderColor: Colores.borde,
    borderRadius: Radio.sm,
    paddingHorizontal: Espaciado.md,
    paddingVertical: Espaciado.sm,
  },
  textoBotonFoto: {
    color: Colores.primario,
    fontWeight: '600',
  },
  filaPaso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Espaciado.xs,
  },
  numeroPaso: {
    fontSize: Tipografia.cuerpo,
    fontWeight: '700',
    color: Colores.primario,
    paddingTop: 10,
  },
  inputPaso: {
    flex: 1,
    minHeight: 44,
  },
  botonAgregarPaso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espaciado.xs,
    paddingVertical: Espaciado.sm,
  },
  textoAgregarPaso: {
    color: Colores.primario,
    fontWeight: '600',
    fontSize: Tipografia.cuerpo,
  },
  botonGuardar: {
    backgroundColor: Colores.primario,
    borderRadius: Radio.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  presionado: {
    opacity: 0.9,
  },
  textoGuardar: {
    color: Colores.superficie,
    fontWeight: '700',
    fontSize: Tipografia.cuerpo,
  },
});
