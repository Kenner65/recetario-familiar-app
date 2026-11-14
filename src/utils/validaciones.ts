import type { RecetaInput } from '../types/receta';

export interface ErrorValidacion {
  campo: string;
  mensaje: string;
}

/**
 * Reglas de validación del proyecto (sección 7 del enunciado):
 * - Al menos 1 ingrediente y 1 paso.
 * - Cantidad numérica mayor que 0.
 * - Nombre de receta único (sin distinguir mayúsculas).
 */
export function validarReceta(input: RecetaInput): ErrorValidacion[] {
  const errores: ErrorValidacion[] = [];

  const nombre = input.nombre.trim();
  if (!nombre) {
    errores.push({ campo: 'nombre', mensaje: 'El nombre es obligatorio.' });
  }

  if (!Number.isInteger(input.porciones) || input.porciones <= 0) {
    errores.push({ campo: 'porciones', mensaje: 'Las porciones deben ser un número entero mayor que 0.' });
  }

  if (input.minutos != null && (!Number.isInteger(input.minutos) || input.minutos < 0)) {
    errores.push({ campo: 'minutos', mensaje: 'Los minutos deben ser un número entero mayor o igual que 0.' });
  }

  const pasos = input.pasos.map((p) => p.trim()).filter((p) => p.length > 0);
  if (pasos.length === 0) {
    errores.push({ campo: 'pasos', mensaje: 'Agrega al menos 1 paso.' });
  }

  const ingredientes = input.ingredientes.filter((i) => i.nombre.trim().length > 0);
  if (ingredientes.length === 0) {
    errores.push({ campo: 'ingredientes', mensaje: 'Agrega al menos 1 ingrediente.' });
  } else {
    ingredientes.forEach((ing, idx) => {
      if (!Number.isFinite(ing.cantidad) || ing.cantidad <= 0) {
        errores.push({
          campo: `ingredientes[${idx}].cantidad`,
          mensaje: 'La cantidad debe ser un número mayor que 0.',
        });
      }
      if (!ing.unidad.trim()) {
        errores.push({
          campo: `ingredientes[${idx}].unidad`,
          mensaje: 'Indica la unidad (g, ml, cucharada…).',
        });
      }
    });
  }

  return errores;
}

/** Normaliza un nombre para comparaciones sin distinguir mayúsculas. */
export function normalizarNombre(nombre: string): string {
  return nombre.trim().toLowerCase();
}
