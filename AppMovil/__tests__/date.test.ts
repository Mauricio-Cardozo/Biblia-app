import { formatoFecha, fechaActualLarga, hoy } from '@/utils/date';

describe('formatoFecha', () => {
  it('formats YYYY-MM-DD to readable Spanish date', () => {
    expect(formatoFecha('2026-07-09')).toBe('Jueves, 9 de Julio 2026');
    expect(formatoFecha('2026-01-01')).toBe('Jueves, 1 de Enero 2026');
    expect(formatoFecha('2026-12-25')).toBe('Viernes, 25 de Diciembre 2026');
  });
});

describe('fechaActualLarga', () => {
  it('returns a non-empty string', () => {
    const result = fechaActualLarga();
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });
});

describe('hoy', () => {
  it('returns YYYY-MM-DD format', () => {
    const result = hoy();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
