/**
 * Escala una cantidad de ingrediente al cambiar el número de porciones.
 *
 * Función pura (sin efectos secundarios) para poder probarla en Jest.
 *
 * @param cantidad       Cantidad referida a `porcionesBase`.
 * @param porcionesBase  Porciones con las que se guardó la receta.
 * @param porcionesNuevas Porciones deseadas.
 * @returns Cantidad escalada, redondeada a 2 decimales.
 */
export function escalar(
  cantidad: number,
  porcionesBase: number,
  porcionesNuevas: number,
): number {
  if (!Number.isFinite(cantidad) || !Number.isFinite(porcionesBase) || !Number.isFinite(porcionesNuevas)) {
    return 0;
  }
  if (porcionesBase <= 0) {
    return cantidad;
  }
  if (porcionesNuevas <= 0) {
    return 0;
  }
  const factor = porcionesNuevas / porcionesBase;
  return redondear(cantidad * factor);
}

/** Redondea a 2 decimales, evitando errores de coma flotante. */
export function redondear(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

/**
 * Formatea una cantidad para mostrarla: entero sin decimales, decimales con
 * hasta 2 cifras significativas.
 */
export function formatearCantidad(valor: number): string {
  const redondeado = redondear(valor);
  if (Number.isInteger(redondeado)) {
    return String(redondeado);
  }
  return redondeado.toFixed(2).replace(/\.?0+$/, '');
}
