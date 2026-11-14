/**
 * Paleta y medidas compartidas. Colores de "recetario" cálidos y legibles
 * con buen contraste para accesibilidad.
 */
export const Colores = {
  fondo: '#F8F1E7',
  superficie: '#FFFFFF',
  texto: '#3A2E22',
  textoSuave: '#7A6B5D',
  primario: '#B4532A',
  primarioOscuro: '#8F3D1D',
  acento: '#D98E4A',
  borde: '#E6D8C6',
  favorito: '#E9A13B',
  peligro: '#B3382C',
  exito: '#4A7C59',
  sombra: '#00000022',
} as const;

export const Espaciado = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const Radio = {
  sm: 8,
  md: 12,
  lg: 20,
} as const;

export const Tipografia = {
  titulo: 28,
  subtitulo: 20,
  cuerpo: 16,
  pequena: 14,
} as const;
