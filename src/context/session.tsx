import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { cerrarSesion as apiCerrarSesion, iniciarSesion, registrar, type Usuario } from '../api/auth';
import { obtenerSesion } from '../api/session';

interface SesionContexto {
  usuario: Usuario | null;
  autenticado: boolean;
  cargando: boolean;
  iniciarSesion: (email: string, password: string) => Promise<void>;
  registrar: (email: string, password: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

const Contexto = createContext<SesionContexto | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [autenticado, setAutenticado] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const sesion = await obtenerSesion();
        if (activo) {
          setAutenticado(!!sesion);
        }
      } catch {
        // sin secure-store disponible: se trata como no autenticado.
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  const iniciarSesionCtx = useCallback(async (email: string, password: string) => {
    const resp = await iniciarSesion(email, password);
    setUsuario(resp.usuario);
    setAutenticado(true);
  }, []);

  const registrarCtx = useCallback(async (email: string, password: string) => {
    const resp = await registrar(email, password);
    setUsuario(resp.usuario);
    setAutenticado(true);
  }, []);

  const cerrarSesionCtx = useCallback(async () => {
    await apiCerrarSesion();
    setUsuario(null);
    setAutenticado(false);
  }, []);

  const valor = useMemo(
    () => ({
      usuario,
      autenticado,
      cargando,
      iniciarSesion: iniciarSesionCtx,
      registrar: registrarCtx,
      cerrarSesion: cerrarSesionCtx,
    }),
    [usuario, autenticado, cargando, iniciarSesionCtx, registrarCtx, cerrarSesionCtx],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSesion(): SesionContexto {
  const ctx = useContext(Contexto);
  if (!ctx) {
    throw new Error('useSesion debe usarse dentro de <SessionProvider>.');
  }
  return ctx;
}
