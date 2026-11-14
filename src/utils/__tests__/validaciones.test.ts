import { normalizarNombre, validarReceta } from '../validaciones';
import type { RecetaInput } from '../../types/receta';

const recetaValida: RecetaInput = {
  nombre: 'Arroz de la abuela',
  porciones: 4,
  minutos: 30,
  pasos: ['Cocer el arroz', 'Servir'],
  foto_uri: null,
  favorita: false,
  ingredientes: [{ nombre: 'arroz', cantidad: 200, unidad: 'g' }],
};

describe('validarReceta', () => {
  it('no devuelve errores para una receta válida', () => {
    expect(validarReceta(recetaValida)).toEqual([]);
  });

  it('exige al menos un ingrediente', () => {
    const errores = validarReceta({ ...recetaValida, ingredientes: [] });
    expect(errores.some((e) => e.campo === 'ingredientes')).toBe(true);
  });

  it('exige al menos un paso', () => {
    const errores = validarReceta({ ...recetaValida, pasos: ['   '] });
    expect(errores.some((e) => e.campo === 'pasos')).toBe(true);
  });

  it('rechaza cantidad igual o menor que 0', () => {
    const errores = validarReceta({
      ...recetaValida,
      ingredientes: [{ nombre: 'sal', cantidad: 0, unidad: 'g' }],
    });
    expect(errores.some((e) => e.campo === 'ingredientes[0].cantidad')).toBe(true);
  });

  it('rechaza porciones no positivas', () => {
    const errores = validarReceta({ ...recetaValida, porciones: 0 });
    expect(errores.some((e) => e.campo === 'porciones')).toBe(true);
  });

  it('exige nombre', () => {
    const errores = validarReceta({ ...recetaValida, nombre: '  ' });
    expect(errores.some((e) => e.campo === 'nombre')).toBe(true);
  });
});

describe('normalizarNombre', () => {
  it('normaliza a minúsculas y recorta espacios', () => {
    expect(normalizarNombre('  Arroz Con Leche ')).toBe('arroz con leche');
  });
});
