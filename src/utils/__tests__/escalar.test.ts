import { escalar, formatearCantidad, redondear } from '../escalar';

describe('escalar', () => {
  it('duplica las cantidades al pasar de 4 a 8 porciones', () => {
    expect(escalar(200, 4, 8)).toBe(400);
    expect(escalar(1, 4, 8)).toBe(2);
  });

  it('reduce a la mitad al pasar de 8 a 4 porciones', () => {
    expect(escalar(400, 8, 4)).toBe(200);
  });

  it('mantiene la cantidad si no cambian las porciones', () => {
    expect(escalar(150, 6, 6)).toBe(150);
  });

  it('redondea a 2 decimales', () => {
    expect(escalar(1, 3, 1)).toBe(0.33);
  });

  it('devuelve 0 si las porciones nuevas son 0 o negativas', () => {
    expect(escalar(100, 4, 0)).toBe(0);
  });

  it('mantiene la cantidad si la base es 0 o negativa', () => {
    expect(escalar(100, 0, 4)).toBe(100);
  });
});

describe('redondear', () => {
  it('evita errores de coma flotante', () => {
    expect(redondear(0.1 + 0.2)).toBe(0.3);
  });
});

describe('formatearCantidad', () => {
  it('muestra enteros sin decimales', () => {
    expect(formatearCantidad(400)).toBe('400');
  });

  it('muestra decimales sin ceros finales', () => {
    expect(formatearCantidad(1.5)).toBe('1.5');
    expect(formatearCantidad(0.33)).toBe('0.33');
  });
});
