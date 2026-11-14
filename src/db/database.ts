import * as SQLite from 'expo-sqlite';

export const DATABASE_NAME = 'recetario.db';

let instancia: SQLite.SQLiteDatabase | null = null;

/**
 * Esquema v1. A cada tabla de dominio se le añaden los campos de sincronización:
 * `remote_id`, `updated_at`, `deleted` y `pending` (sección 8 del enunciado).
 *
 * `pasos` se guarda como JSON (array de strings) en la columna TEXT.
 */
const MIGRACIONES: string[] = [
  `
  CREATE TABLE IF NOT EXISTS receta (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    porciones INTEGER NOT NULL DEFAULT 4 CHECK (porciones > 0),
    minutos INTEGER,
    pasos TEXT NOT NULL,
    foto_uri TEXT,
    favorita INTEGER NOT NULL DEFAULT 0,
    remote_id TEXT,
    updated_at TEXT,
    deleted INTEGER NOT NULL DEFAULT 0,
    pending INTEGER NOT NULL DEFAULT 0
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_receta_nombre_nocase
    ON receta (nombre COLLATE NOCASE);

  CREATE TABLE IF NOT EXISTS ingrediente (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receta_id INTEGER NOT NULL REFERENCES receta(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    cantidad REAL NOT NULL CHECK (cantidad > 0),
    unidad TEXT NOT NULL,
    remote_id TEXT,
    updated_at TEXT,
    deleted INTEGER NOT NULL DEFAULT 0,
    pending INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_ingrediente_receta
    ON ingrediente (receta_id);

  CREATE TABLE IF NOT EXISTS meta (
    clave TEXT PRIMARY KEY,
    valor TEXT NOT NULL
  );
  `,
];

/**
 * Abre (o reutiliza) la base de datos y aplica las migraciones pendientes.
 * La base es la fuente de verdad local: funciona sin conexión.
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!instancia) {
    instancia = SQLite.openDatabaseSync(DATABASE_NAME);
    migrar(instancia);
  }
  return instancia;
}

/** Aplica las migraciones pendientes usando `PRAGMA user_version`. */
export function migrar(db: SQLite.SQLiteDatabase): void {
  db.execSync('PRAGMA foreign_keys = ON;');
  db.execSync('PRAGMA journal_mode = WAL;');

  const fila = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  const versionActual = fila?.user_version ?? 0;

  for (let v = versionActual; v < MIGRACIONES.length; v += 1) {
    db.execSync(MIGRACIONES[v]!);
    // PRAGMA no admite parámetros: se interpola un entero controlado.
    db.execSync(`PRAGMA user_version = ${v + 1};`);
  }
}

/** Útil en pruebas: cierra y olvida la instancia para reiniciar el estado. */
export function cerrarBaseDatos(): void {
  if (instancia) {
    instancia.closeSync();
    instancia = null;
  }
}
