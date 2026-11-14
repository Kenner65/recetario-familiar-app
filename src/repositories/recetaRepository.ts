import { getDatabase } from '../db/database';
import type { Ingrediente, Receta, RecetaInput } from '../types/receta';
import { ahoraIso, generarUuid } from '../utils/uuid';

export type SqlValue = string | number | null;

/**
 * Interfaz mínima de base de datos que usa el repositorio. `SQLiteDatabase`
 * la satisface de forma estructural y en pruebas se inyecta un fake con
 * semántica de transacción real (rollback ante error).
 */
export interface DB {
  runSync(source: string, params: SqlValue[]): { lastInsertRowId: number; changes: number };
  getFirstSync<T>(source: string, params: SqlValue[]): T | null;
  getAllSync<T>(source: string, params: SqlValue[]): T[];
  withTransactionSync(task: () => void): void;
}

interface RecetaFila {
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
}

interface IngredienteFila {
  id: number;
  receta_id: number;
  nombre: string;
  cantidad: number;
  unidad: string;
  remote_id: string | null;
  updated_at: string;
  deleted: number;
  pending: number;
}

export interface ListarOpciones {
  texto?: string;
  soloFavoritas?: boolean;
  db?: DB;
}

export interface GuardarOpciones {
  db?: DB;
  remoteId?: string;
  ahora?: string;
}

function parsearPasos(json: string): string[] {
  try {
    const valor: unknown = JSON.parse(json);
    if (Array.isArray(valor)) {
      return valor.filter((v): v is string => typeof v === 'string');
    }
    return [];
  } catch {
    return [];
  }
}

function filaAReceta(fila: RecetaFila): Receta {
  return {
    id: fila.id,
    nombre: fila.nombre,
    porciones: fila.porciones,
    minutos: fila.minutos,
    pasos: parsearPasos(fila.pasos),
    foto_uri: fila.foto_uri,
    favorita: !!fila.favorita,
    remote_id: fila.remote_id,
    updated_at: fila.updated_at,
    deleted: !!fila.deleted,
    pending: !!fila.pending,
    ingredientes: [],
  };
}

function filaAIngrediente(fila: IngredienteFila): Ingrediente {
  return {
    id: fila.id,
    receta_id: fila.receta_id,
    nombre: fila.nombre,
    cantidad: fila.cantidad,
    unidad: fila.unidad,
  };
}

export function cargarIngredientesPara(db: DB, recetaIds: number[]): Map<number, Ingrediente[]> {
  const mapa = new Map<number, Ingrediente[]>();
  recetaIds.forEach((id) => mapa.set(id, []));
  if (recetaIds.length === 0) {
    return mapa;
  }
  const placeholders = recetaIds.map(() => '?').join(',');
  const filas = db.getAllSync<IngredienteFila>(
    `SELECT * FROM ingrediente WHERE deleted = 0 AND receta_id IN (${placeholders}) ORDER BY id ASC`,
    recetaIds,
  );
  filas.forEach((fila) => {
    mapa.get(fila.receta_id)?.push(filaAIngrediente(fila));
  });
  return mapa;
}

function insertarIngredientes(db: DB, recetaId: number, ingredientes: Ingrediente[], ahora: string): void {
  for (const ing of ingredientes) {
    db.runSync(
      `INSERT INTO ingrediente (receta_id, nombre, cantidad, unidad, remote_id, updated_at, deleted, pending)
       VALUES (?, ?, ?, ?, ?, ?, 0, 1)`,
      [recetaId, ing.nombre.trim(), ing.cantidad, ing.unidad.trim(), generarUuid(), ahora],
    );
  }
}

/** Lista recetas (no borradas), opcionalmente filtradas por favorita o texto. */
export function listarRecetas(opciones: ListarOpciones = {}): Receta[] {
  const { texto, soloFavoritas = false, db = getDatabase() } = opciones;
  const condiciones: string[] = ['r.deleted = 0'];
  const params: SqlValue[] = [];

  if (soloFavoritas) {
    condiciones.push('r.favorita = 1');
  }

  const termino = texto?.trim();
  if (termino) {
    const like = `%${termino}%`;
    condiciones.push(
      `(r.nombre LIKE ? COLLATE NOCASE OR r.id IN (
         SELECT receta_id FROM ingrediente
         WHERE nombre LIKE ? COLLATE NOCASE AND deleted = 0
       ))`,
    );
    params.push(like, like);
  }

  const where = condiciones.join(' AND ');
  const filas = db.getAllSync<RecetaFila>(
    `SELECT r.* FROM receta r WHERE ${where} ORDER BY r.updated_at DESC, r.id DESC`,
    params,
  );

  const recetas = filas.map(filaAReceta);
  const ingredientesPorReceta = cargarIngredientesPara(db, recetas.map((r) => r.id));
  recetas.forEach((r) => {
    r.ingredientes = ingredientesPorReceta.get(r.id) ?? [];
  });
  return recetas;
}

export function obtenerReceta(id: number, db: DB = getDatabase()): Receta | null {
  const fila = db.getFirstSync<RecetaFila>(
    'SELECT * FROM receta WHERE id = ? AND deleted = 0',
    [id],
  );
  if (!fila) {
    return null;
  }
  const receta = filaAReceta(fila);
  receta.ingredientes = cargarIngredientesPara(db, [id]).get(id) ?? [];
  return receta;
}

/** True si ya existe (sin distinguir mayúsculas) una receta con ese nombre. */
export function nombreRecetaExiste(nombre: string, excluirId?: number, db: DB = getDatabase()): boolean {
  const normalizado = nombre.trim();
  if (!normalizado) {
    return false;
  }
  const sql =
    excluirId != null
      ? 'SELECT id FROM receta WHERE nombre = ? COLLATE NOCASE AND deleted = 0 AND id != ? LIMIT 1'
      : 'SELECT id FROM receta WHERE nombre = ? COLLATE NOCASE AND deleted = 0 LIMIT 1';
  const params: SqlValue[] = excluirId != null ? [normalizado, excluirId] : [normalizado];
  return db.getFirstSync<{ id: number }>(sql, params) != null;
}

/**
 * Crea una receta y sus ingredientes en una única transacción (RF-05):
 * si falla cualquier insert, no queda nada guardado a medias.
 */
export function crearReceta(input: RecetaInput, opciones: GuardarOpciones = {}): number {
  const db = opciones.db ?? getDatabase();
  const ahora = opciones.ahora ?? ahoraIso();
  const remoteId = opciones.remoteId ?? generarUuid();
  let nuevoId = 0;

  db.withTransactionSync(() => {
    const resultado = db.runSync(
      `INSERT INTO receta (nombre, porciones, minutos, pasos, foto_uri, favorita, remote_id, updated_at, deleted, pending)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1)`,
      [
        input.nombre.trim(),
        input.porciones,
        input.minutos,
        JSON.stringify(input.pasos),
        input.foto_uri,
        input.favorita ? 1 : 0,
        remoteId,
        ahora,
      ],
    );
    nuevoId = resultado.lastInsertRowId;
    insertarIngredientes(db, nuevoId, input.ingredientes, ahora);
  });

  return nuevoId;
}

/**
 * Actualiza una receta: reemplaza ingredientes dentro de la misma transacción.
 */
export function actualizarReceta(id: number, input: RecetaInput, opciones: GuardarOpciones = {}): void {
  const db = opciones.db ?? getDatabase();
  const ahora = opciones.ahora ?? ahoraIso();

  db.withTransactionSync(() => {
    db.runSync(
      `UPDATE receta
       SET nombre = ?, porciones = ?, minutos = ?, pasos = ?, foto_uri = ?, favorita = ?, updated_at = ?, pending = 1
       WHERE id = ?`,
      [
        input.nombre.trim(),
        input.porciones,
        input.minutos,
        JSON.stringify(input.pasos),
        input.foto_uri,
        input.favorita ? 1 : 0,
        ahora,
        id,
      ],
    );
    db.runSync('DELETE FROM ingrediente WHERE receta_id = ?', [id]);
    insertarIngredientes(db, id, input.ingredientes, ahora);
  });
}

/** Borrado lógico: marca la receta como eliminada y pendiente de sincronizar. */
export function eliminarReceta(id: number, db: DB = getDatabase()): void {
  const ahora = ahoraIso();
  db.runSync('UPDATE receta SET deleted = 1, pending = 1, updated_at = ? WHERE id = ?', [ahora, id]);
}

/** Marca o desmarca una receta como favorita. */
export function marcarFavorita(id: number, favorita: boolean, db: DB = getDatabase()): void {
  const ahora = ahoraIso();
  db.runSync('UPDATE receta SET favorita = ?, pending = 1, updated_at = ? WHERE id = ?', [
    favorita ? 1 : 0,
    ahora,
    id,
  ]);
}


