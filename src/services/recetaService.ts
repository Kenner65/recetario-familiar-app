import * as recetaRepo from '../repositories/recetaRepository';
import type { Receta, RecetaInput } from '../types/receta';
import { validarReceta } from '../utils/validaciones';
import type { ErrorValidacion } from '../utils/validaciones';

export class ErrorReceta extends Error {
  readonly errores: ErrorValidacion[];

  constructor(errores: ErrorValidacion[]) {
    super(errores.map((e) => e.mensaje).join(' '));
    this.name = 'ErrorReceta';
    this.errores = errores;
  }
}

/**
 * Capa de reglas de negocio. Orquesta validación + persistencia para que la UI
 * no hable directamente con SQLite.
 */
export const recetaService = {
  listar(opciones: { texto?: string; soloFavoritas?: boolean } = {}): Receta[] {
    return recetaRepo.listarRecetas(opciones);
  },

  obtener(id: number): Receta | null {
    return recetaRepo.obtenerReceta(id);
  },

  /**
   * Valida y crea una receta. Lanza `ErrorReceta` si el input no es válido o
   * si el nombre ya existe (regla de nombre único).
   */
  crear(input: RecetaInput): number {
    const errores = validarReceta(input);
    if (errores.length > 0) {
      throw new ErrorReceta(errores);
    }
    if (recetaRepo.nombreRecetaExiste(input.nombre)) {
      throw new ErrorReceta([{ campo: 'nombre', mensaje: 'Ya existe una receta con ese nombre.' }]);
    }
    return recetaRepo.crearReceta(input);
  },

  /**
   * Valida y actualiza. El nombre debe ser único sin contar la propia receta.
   */
  actualizar(id: number, input: RecetaInput): void {
    const errores = validarReceta(input);
    if (errores.length > 0) {
      throw new ErrorReceta(errores);
    }
    if (recetaRepo.nombreRecetaExiste(input.nombre, id)) {
      throw new ErrorReceta([{ campo: 'nombre', mensaje: 'Ya existe una receta con ese nombre.' }]);
    }
    recetaRepo.actualizarReceta(id, input);
  },

  eliminar(id: number): void {
    recetaRepo.eliminarReceta(id);
  },

  marcarFavorita(id: number, favorita: boolean): void {
    recetaRepo.marcarFavorita(id, favorita);
  },
};
