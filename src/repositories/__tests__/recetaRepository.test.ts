import { crearReceta } from '../recetaRepository';
import type { DB, SqlValue } from '../recetaRepository';
import type { RecetaInput } from '../../types/receta';

/**
 * Fake de base de datos en memoria con semántica de transacción real:
 * `withTransactionSync` restaura el estado si el task lanza un error,
 * reproduciendo el rollback de SQLite.
 */
class FakeDB implements DB {
  recetas: unknown[] = [];
  ingredientes: unknown[] = [];
  fallarEn: { tabla: 'ingrediente' | 'receta'; n: number } | null = null;

  private insertConteo: Record<string, number> = {};
  private snapshot: { recetas: unknown[]; ingredientes: unknown[]; conteo: Record<string, number> } | null = null;

  runSync(source: string, _params: SqlValue[]): { lastInsertRowId: number; changes: number } {
    const coincidencia = /\bINTO\s+(\w+)/i.exec(source);
    const tabla = coincidencia?.[1] ?? 'otra';
    this.insertConteo[tabla] = (this.insertConteo[tabla] ?? 0) + 1;

    if (this.fallarEn && this.fallarEn.tabla === tabla && this.fallarEn.n === this.insertConteo[tabla]) {
      throw new Error(`Fallo simulado al insertar el ${this.fallarEn.n}º elemento en ${tabla}`);
    }

    const fila = { tabla, insertNumero: this.insertConteo[tabla] };
    if (tabla === 'ingrediente') {
      this.ingredientes.push(fila);
    } else if (tabla === 'receta') {
      this.recetas.push(fila);
    }
    return { lastInsertRowId: (tabla === 'receta' ? this.recetas : this.ingredientes).length, changes: 1 };
  }

  withTransactionSync(task: () => void): void {
    this.snapshot = {
      recetas: [...this.recetas],
      ingredientes: [...this.ingredientes],
      conteo: { ...this.insertConteo },
    };
    try {
      task();
      this.snapshot = null;
    } catch (error) {
      if (this.snapshot) {
        this.recetas = this.snapshot.recetas;
        this.ingredientes = this.snapshot.ingredientes;
        this.insertConteo = this.snapshot.conteo;
      }
      this.snapshot = null;
      throw error;
    }
  }

  getFirstSync<T>(): T | null {
    return null;
  }

  getAllSync<T>(): T[] {
    return [];
  }
}

const inputBase: RecetaInput = {
  nombre: 'Guiso familiar',
  porciones: 4,
  minutos: 45,
  pasos: ['Cortar', 'Cocinar'],
  foto_uri: null,
  favorita: false,
  ingredientes: [
    { nombre: 'papa', cantidad: 2, unidad: 'u' },
    { nombre: 'carne', cantidad: 500, unidad: 'g' },
    { nombre: 'zanahoria', cantidad: 3, unidad: 'u' },
  ],
};

describe('crearReceta — transacción (RF-05)', () => {
  it('guarda receta e ingredientes juntos cuando todo sale bien', () => {
    const db = new FakeDB();
    crearReceta(inputBase, { db, remoteId: 'uuid-1', ahora: '2026-01-01T00:00:00.000Z' });

    expect(db.recetas).toHaveLength(1);
    expect(db.ingredientes).toHaveLength(3);
  });

  it('hace rollback si falla el guardado del 3.er ingrediente', () => {
    const db = new FakeDB();
    db.fallarEn = { tabla: 'ingrediente', n: 3 };

    expect(() => crearReceta(inputBase, { db, remoteId: 'uuid-2', ahora: '2026-01-01T00:00:00.000Z' })).toThrow();

    // No queda nada guardado a medias: ni la receta ni los 2 ingredientes previos.
    expect(db.recetas).toHaveLength(0);
    expect(db.ingredientes).toHaveLength(0);
  });
});
