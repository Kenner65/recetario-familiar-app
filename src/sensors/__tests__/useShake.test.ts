import { debeDispararSacudida, magnitudAceleracion } from '../useShake';

describe('magnitudAceleracion', () => {
  it('calcula la magnitud del vector', () => {
    expect(magnitudAceleracion(3, 4, 0)).toBe(5);
  });

  it('en reposo (solo gravedad en Z) ronda 1 g', () => {
    expect(magnitudAceleracion(0, 0, 1)).toBe(1);
  });
});

describe('debeDispararSacudida', () => {
  it('detecta una sacudida por encima del umbral', () => {
    expect(debeDispararSacudida(2.5, 1.8)).toBe(true);
  });

  it('no dispara con magnitud normal (gravedad)', () => {
    expect(debeDispararSacudida(1.1, 1.8)).toBe(false);
  });
});
