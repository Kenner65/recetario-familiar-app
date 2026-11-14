import { getDatabase } from '../db/database';
import type { Receta, RecetaRemota } from '../types/receta';
import { generarUuid } from '../utils/uuid';
import { cargarIngredientesPara } from './recetaRepository';
import type { DB } from './recetaRepository';

/**
 * Funciones de acceso a datos para la sincronización con la API.
 * Separadas del CRUD principal para mantener cada archivo enfocado.
 */

/** Recetas con cambios locales sin enviar (pending = 1), incluidas las borradas. */
export function listarPendientes(db: DB = getDatabase()): Receta[] {
  const filas = db.getAllSync<{
    id: number;
    nombre: string;
    porciones: number;
    minutos: number | null;
    pasos: string;
    foto_uri: string | null;
    favorita: number;
    remote_id: string | null;
    updated_at: string;
    deleted: number;
    pending: number;
  }>('SELECT * FROM receta WHERE pending = 1 ORDER BY updated_at ASC, id ASC', []);

  return filas.map((fila) => {
    const pasos = (() => {
      try {
        const v: unknown = JSON.parse(fila.pasos);
        return Array.isArray(v) ? (v as string[]) : [];
      } catch {
        return [];
      }
    })();
    return {
      id: fila.id,
      nombre: fila.nombre,
      porciones: fila.porciones,
      minutos: fila.minutos,
      pasos,
      foto_uri: fila.foto_uri,
      favorita: !!fila.favorita,
      remote_id: fila.remote_id,
      updated_at: fila.updated_at,
      deleted: !!fila.deleted,
      pending: !!fila.pending,
      ingredientes: cargarIngredientesPara(db, [fila.id]).get(fila.id) ?? [],
    };
  });
}

/** Marca una receta (y sus ingredientes) como ya sincronizada con la API. */
export function marcarSincronizada(id: number, db: DB = getDatabase()): void {
  db.runSync('UPDATE receta SET pending = 0 WHERE id = ?', [id]);
  db.runSync('UPDATE ingrediente SET pending = 0 WHERE receta_id = ?', [id]);
}

/** Aplica un documento remoto (crea o reemplaza) sin marcarlo como pendiente. */
export function aplicarRecetaRemota(remota: RecetaRemota, db: DB = getDatabase()): void {
  const existente = db.getFirstSync<{ id: number }>('SELECT id FROM receta WHERE remote_id = ?', [remota.id]);
  const deleted = remota.deleted_at != null;
  const pasosJson = JSON.stringify(remota.pasos ?? []);
  const foto = remota.foto_url ?? null;

  db.withTransactionSync(() => {
    if (existente) {
      db.runSync(
        `UPDATE receta
         SET nombre = ?, porciones = ?, minutos = ?, pasos = ?, foto_uri = ?, favorita = ?,
             updated_at = ?, deleted = ?, pending = 0
         WHERE id = ?`,
        [
          remota.nombre,
          remota.porciones,
          remota.minutos,
          pasosJson,
          foto,
          remota.favorita ? 1 : 0,
          remota.updated_at,
          deleted ? 1 : 0,
          existente.id,
        ],
      );
      db.runSync('DELETE FROM ingrediente WHERE receta_id = ?', [existente.id]);
      insertarIngredientesRemotos(db, existente.id, remota);
      return;
    }

    const resultado = db.runSync(
      `INSERT INTO receta (nombre, porciones, minutos, pasos, foto_uri, favorita, remote_id, updated_at, deleted, pending)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        remota.nombre,
        remota.porciones,
        remota.minutos,
        pasosJson,
        foto,
        remota.favorita ? 1 : 0,
        remota.id,
        remota.updated_at,
        deleted ? 1 : 0,
      ],
    );
    insertarIngredientesRemotos(db, resultado.lastInsertRowId, remota);
  });
}

function insertarIngredientesRemotos(db: DB, recetaId: number, remota: RecetaRemota): void {
  for (const ing of remota.ingredientes ?? []) {
    db.runSync(
      `INSERT INTO ingrediente (receta_id, nombre, cantidad, unidad, remote_id, updated_at, deleted, pending)
       VALUES (?, ?, ?, ?, ?, ?, 0, 0)`,
      [recetaId, ing.nombre, ing.cantidad, ing.unidad, generarUuid(), remota.updated_at],
    );
  }
}

export function getMeta(clave: string, db: DB = getDatabase()): string | null {
  const fila = db.getFirstSync<{ valor: string }>('SELECT valor FROM meta WHERE clave = ?', [clave]);
  return fila?.valor ?? null;
}

export function setMeta(clave: string, valor: string, db: DB = getDatabase()): void {
  db.runSync('INSERT INTO meta (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor', [
    clave,
    valor,
  ]);
}
