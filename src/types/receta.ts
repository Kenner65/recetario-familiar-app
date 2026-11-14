/**
 * Modelo de dominio del recetario.
 *
 * Los nombres de las columnas de SQLite y los campos de Firestore son los
 * mismos (snake_case) para facilitar la sincronización.
 */

export interface Ingrediente {
  id?: number;
  receta_id?: number;
  nombre: string;
  /** Cantidad referida a la base de `porciones` de la receta. */
  cantidad: number;
  unidad: string;
}

export interface Receta {
  id: number;
  nombre: string;
  /** Porciones base con las que se guardaron las cantidades. */
  porciones: number;
  minutos: number | null;
  pasos: string[];
  foto_uri: string | null;
  favorita: boolean;
  ingredientes: Ingrediente[];

  // Campos de sincronización.
  remote_id: string | null;
  updated_at: string;
  deleted: boolean;
  pending: boolean;
}

/** Datos que introduce el usuario al crear/editar una receta. */
export interface RecetaInput {
  nombre: string;
  porciones: number;
  minutos: number | null;
  pasos: string[];
  foto_uri: string | null;
  favorita: boolean;
  ingredientes: Ingrediente[];
}

/** Campos de una receta tal y como los expone la API (Firestore). */
export interface RecetaRemota {
  id: string;
  nombre: string;
  porciones: number;
  minutos: number | null;
  pasos: string[];
  favorita: boolean;
  ingredientes: { nombre: string; cantidad: number; unidad: string }[];
  foto_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
