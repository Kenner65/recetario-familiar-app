import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError, SesionExpiradaError } from '@/api/client';
import { tieneApiConfigurada } from '@/api/config';
import { Colores, Espaciado, Radio, Tipografia } from '@/constants/theme';
import { useSesion } from '@/context/session';
import { sincronizar, type ResultadoSync } from '@/services/syncService';

function mensajeError(error: unknown): string {
  if (error instanceof SesionExpiradaError) {
    return 'Tu sesión expiró. Inicia sesión de nuevo.';
  }
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Ocurrió un error inesperado.';
}

export default function Cuenta() {
  const { autenticado, usuario, cargando, iniciarSesion, registrar, cerrarSesion } = useSesion();
  const [modo, setModo] = useState<'login' | 'registro'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoSync | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apiConfigurada = tieneApiConfigurada();

  async function hacerSync() {
    if (!apiConfigurada) {
      return;
    }
    setSincronizando(true);
    setError(null);
    try {
      const r = await sincronizar();
      setResultado(r);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setSincronizando(false);
    }
  }

  async function enviar() {
    setError(null);
    setEnviando(true);
    try {
      if (modo === 'login') {
        await iniciarSesion(email.trim(), password);
      } else {
        await registrar(email.trim(), password);
      }
      setPassword('');
      await hacerSync();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setEnviando(false);
    }
  }

  async function salir() {
    await cerrarSesion();
    setResultado(null);
    setEmail('');
    setModo('login');
  }

  if (cargando) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centro}>
          <ActivityIndicator color={Colores.primario} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo}>Cuenta</Text>

        {!apiConfigurada ? (
          <View style={styles.aviso}>
            <Ionicons name="warning" size={20} color={Colores.peligro} />
            <Text style={styles.avisoTexto}>
              Falta configurar EXPO_PUBLIC_API_URL. La app funciona en modo offline hasta que la configures.
            </Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTexto}>{error}</Text>
          </View>
        ) : null}

        {autenticado ? (
          <View style={styles.tarjeta}>
            <View style={styles.filaSesion}>
              <Ionicons name="checkmark-circle" size={22} color={Colores.exito} />
              <Text style={styles.etiqueta}>Sesión iniciada</Text>
            </View>
            <Text style={styles.email}>{usuario?.email ?? 'Cuenta activa'}</Text>

            <Pressable
              onPress={hacerSync}
              disabled={sincronizando || !apiConfigurada}
              style={[styles.botonPrimario, (sincronizando || !apiConfigurada) && styles.botonDeshabilitado]}
              accessibilityRole="button"
              accessibilityLabel="Sincronizar ahora"
            >
              {sincronizando ? (
                <ActivityIndicator color={Colores.superficie} />
              ) : (
                <Ionicons name="sync" size={20} color={Colores.superficie} />
              )}
              <Text style={styles.textoBotonPrimario}>{sincronizando ? 'Sincronizando…' : 'Sincronizar ahora'}</Text>
            </Pressable>

            {resultado ? (
              <Text style={styles.resultado}>
                Sincronización completa: {resultado.subidos} enviadas, {resultado.bajados} recibidas.
              </Text>
            ) : (
              <Text style={styles.hint}>Sincroniza para ver y subir tus recetas a la nube.</Text>
            )}

            <Pressable onPress={salir} style={styles.botonSecundario} accessibilityRole="button" accessibilityLabel="Cerrar sesión">
              <Ionicons name="log-out-outline" size={18} color={Colores.texto} />
              <Text style={styles.textoBotonSecundario}>Cerrar sesión</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.tarjeta}>
            <Text style={styles.etiqueta}>{modo === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}</Text>
            <Text style={styles.sub}>Usa la misma cuenta que en la web para ver las mismas recetas.</Text>

            <View style={styles.tabs}>
              <Pressable
                onPress={() => setModo('login')}
                style={[styles.tab, modo === 'login' && styles.tabActivo]}
                accessibilityRole="button"
                accessibilityLabel="Iniciar sesión"
              >
                <Text style={[styles.tabTexto, modo === 'login' && styles.tabTextoActivo]}>Iniciar sesión</Text>
              </Pressable>
              <Pressable
                onPress={() => setModo('registro')}
                style={[styles.tab, modo === 'registro' && styles.tabActivo]}
                accessibilityRole="button"
                accessibilityLabel="Crear cuenta"
              >
                <Text style={[styles.tabTexto, modo === 'registro' && styles.tabTextoActivo]}>Crear cuenta</Text>
              </Pressable>
            </View>

            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="correo@ejemplo.com"
              placeholderTextColor={Colores.textoSuave}
              autoCapitalize="none"
              keyboardType="email-address"
              accessibilityLabel="Correo electrónico"
            />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={modo === 'registro' ? 'Al menos 8 caracteres' : 'Contraseña'}
              placeholderTextColor={Colores.textoSuave}
              secureTextEntry
              accessibilityLabel="Contraseña"
            />

            <Pressable
              onPress={enviar}
              disabled={enviando || !apiConfigurada}
              style={[styles.botonPrimario, (enviando || !apiConfigurada) && styles.botonDeshabilitado]}
              accessibilityRole="button"
              accessibilityLabel={modo === 'login' ? 'Entrar' : 'Crear cuenta'}
            >
              {enviando ? (
                <ActivityIndicator color={Colores.superficie} />
              ) : (
                <Ionicons name="log-in-outline" size={20} color={Colores.superficie} />
              )}
              <Text style={styles.textoBotonPrimario}>
                {enviando ? 'Conectando…' : modo === 'login' ? 'Entrar' : 'Crear cuenta'}
              </Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.nota}>
          La app funciona sin conexión. Inicia sesión para sincronizar tus recetas con la web y otros dispositivos.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colores.fondo,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contenido: {
    padding: Espaciado.md,
    gap: Espaciado.md,
    paddingBottom: Espaciado.xl,
  },
  titulo: {
    fontSize: Tipografia.titulo,
    fontWeight: '800',
    color: Colores.texto,
  },
  aviso: {
    flexDirection: 'row',
    gap: Espaciado.sm,
    alignItems: 'flex-start',
    backgroundColor: '#FBE9E7',
    borderRadius: Radio.sm,
    borderWidth: 1,
    borderColor: Colores.peligro,
    padding: Espaciado.sm,
  },
  avisoTexto: {
    flex: 1,
    color: Colores.peligro,
    fontSize: Tipografia.pequena,
  },
  errorBox: {
    backgroundColor: '#FBE9E7',
    borderRadius: Radio.sm,
    borderWidth: 1,
    borderColor: Colores.peligro,
    padding: Espaciado.sm,
  },
  errorTexto: {
    color: Colores.peligro,
    fontSize: Tipografia.pequena,
  },
  tarjeta: {
    backgroundColor: Colores.superficie,
    borderRadius: Radio.md,
    borderWidth: 1,
    borderColor: Colores.borde,
    padding: Espaciado.md,
    gap: Espaciado.sm,
  },
  filaSesion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espaciado.xs,
  },
  etiqueta: {
    fontSize: Tipografia.subtitulo,
    fontWeight: '700',
    color: Colores.texto,
  },
  email: {
    fontSize: Tipografia.cuerpo,
    color: Colores.textoSuave,
    marginBottom: Espaciado.xs,
  },
  sub: {
    fontSize: Tipografia.pequena,
    color: Colores.textoSuave,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colores.fondo,
    borderRadius: Radio.sm,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radio.sm,
    alignItems: 'center',
  },
  tabActivo: {
    backgroundColor: Colores.superficie,
  },
  tabTexto: {
    fontSize: Tipografia.pequena,
    fontWeight: '600',
    color: Colores.textoSuave,
  },
  tabTextoActivo: {
    color: Colores.primario,
  },
  input: {
    backgroundColor: Colores.superficie,
    borderWidth: 1,
    borderColor: Colores.borde,
    borderRadius: Radio.sm,
    paddingHorizontal: Espaciado.sm,
    paddingVertical: 12,
    fontSize: Tipografia.cuerpo,
    color: Colores.texto,
  },
  botonPrimario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espaciado.xs,
    backgroundColor: Colores.primario,
    borderRadius: Radio.md,
    paddingVertical: 13,
    marginTop: Espaciado.xs,
  },
  botonDeshabilitado: {
    opacity: 0.5,
  },
  textoBotonPrimario: {
    color: Colores.superficie,
    fontWeight: '700',
    fontSize: Tipografia.cuerpo,
  },
  botonSecundario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espaciado.xs,
    borderRadius: Radio.md,
    borderWidth: 1,
    borderColor: Colores.borde,
    paddingVertical: 11,
  },
  textoBotonSecundario: {
    color: Colores.texto,
    fontWeight: '600',
  },
  resultado: {
    fontSize: Tipografia.pequena,
    color: Colores.exito,
  },
  hint: {
    fontSize: Tipografia.pequena,
    color: Colores.textoSuave,
  },
  nota: {
    fontSize: Tipografia.pequena,
    color: Colores.textoSuave,
    textAlign: 'center',
    paddingHorizontal: Espaciado.md,
  },
});
